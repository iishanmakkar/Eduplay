import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { createCronLogger } from '@/lib/logger'

/**
 * Weekly Teacher BKT Digest — Monday 7 AM IST (01:30 UTC)
 * Cron schedule in vercel.json: "30 1 * * 1"
 *
 * For every teacher, aggregates their classes for the past week:
 * - Active student count & engagement %
 * - Average class P(L) Bayesian mastery score
 * - Top skills needing attention (avg P(L) < 0.4)
 * - At-risk students (any skill P(L) < 0.25)
 * - Top student by XP this week
 */
export async function GET(req: NextRequest) {
  const log = createCronLogger('send-weekly-teacher-digest')

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  log.start()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const APP_URL = process.env.NEXTAUTH_URL || 'https://app.eduplay.in'

  let emailsSent = 0
  let emailsFailed = 0

  try {
    // Fetch all teachers who have at least one class
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      select: {
        id: true,
        email: true,
        firstName: true,
      }
    })

    for (const teacher of teachers) {
      if (!teacher.email) continue

      // Fetch this teacher's classes with enrolled students + BKT masteries
      const teacherClasses = await (prisma.class as any).findMany({
        where: { teacherId: teacher.id },
        include: {
          students: {
            include: {
              student: {
                include: {
                  gameResults: {
                    where: { completedAt: { gte: weekAgo } },
                    select: { xpEarned: true, accuracy: true }
                  },
                  skillMasteries: {
                    include: {
                      skill: { select: { name: true, subject: true } }
                    }
                  }
                }
              }
            }
          }
        }
      }) as Array<any>

      if (teacherClasses.length === 0) continue

      // All students across all classes (dedup by id)
      const studentMap = new Map<string, any>()
      for (const cls of teacherClasses) {
        for (const enr of cls.students) {
          studentMap.set(enr.student.id, enr.student)
        }
      }
      const allStudents = Array.from(studentMap.values())
      if (allStudents.length === 0) continue

      const weeklyActive = allStudents.filter((s: any) => s.gameResults.length > 0)
      const totalGamesPlayed = weeklyActive.reduce((acc: number, s: any) => acc + s.gameResults.length, 0)

      // Class-wide average P(L)
      const allMasteries = allStudents.flatMap((s: any) =>
        s.skillMasteries.map((m: any) => m.masteryProbability as number)
      )
      const avgMastery = allMasteries.length > 0
        ? allMasteries.reduce((a: number, b: number) => a + b, 0) / allMasteries.length
        : 0

      // Skills needing attention: group by skill name, avg P(L) < 0.4
      const skillMap = new Map<string, number[]>()
      for (const student of allStudents) {
        for (const m of student.skillMasteries) {
          const key = m.skill.name as string
          if (!skillMap.has(key)) skillMap.set(key, [])
          skillMap.get(key)!.push(m.masteryProbability as number)
        }
      }
      const strugglingSkills = Array.from(skillMap.entries())
        .map(([name, vals]) => ({
          name,
          avg: vals.reduce((a, b) => a + b, 0) / vals.length,
          count: vals.length,
        }))
        .filter(s => s.avg < 0.4)
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 3)

      // At-risk students: any skill P(L) < 0.25
      const atRisk = allStudents
        .filter((s: any) => s.skillMasteries.some((m: any) => m.masteryProbability < 0.25))
        .map((s: any) => {
          const worst = s.skillMasteries
            .filter((m: any) => m.masteryProbability < 0.25)
            .sort((a: any, b: any) => a.masteryProbability - b.masteryProbability)[0]
          return {
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
            worstSkill: worst ? { skillName: worst.skill.name, pl: worst.masteryProbability as number } : null
          }
        })
        .slice(0, 5)

      // Top student this week by XP
      const topStudent = weeklyActive
        .map((s: any) => ({
          name: (s.firstName || 'Student') as string,
          xp: s.gameResults.reduce((acc: number, r: any) => acc + (r.xpEarned as number), 0),
        }))
        .sort((a: any, b: any) => b.xp - a.xp)[0] ?? null

      const weekLabel = weekAgo.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      const todayLabel = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

      const html = buildDigestEmail({
        teacherName: teacher.firstName || 'Teacher',
        weekLabel: `${weekLabel} – ${todayLabel}`,
        totalStudents: allStudents.length,
        activeStudents: weeklyActive.length,
        totalGamesPlayed,
        avgMastery,
        strugglingSkills,
        atRisk,
        topStudent,
        appUrl: APP_URL,
      })

      try {
        await sendEmail({
          to: teacher.email,
          subject: `📊 Your EduPlay Class Report — Week of ${weekLabel}`,
          html,
        })

        await (prisma.emailLog.create as any)({
          data: {
            userId: teacher.id,
            type: 'weekly_teacher_digest',
            subject: `Weekly Class Report — ${weekLabel}`,
            status: 'SENT',
          },
        })

        emailsSent++
      } catch (err) {
        emailsFailed++
        log.error(err, { teacherId: teacher.id })
      }
    }

    log.success({ emailsSent, emailsFailed, totalTeachers: teachers.length })
    return NextResponse.json({ ok: true, emailsSent, emailsFailed })

  } catch (error) {
    log.error(error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}

// ── HTML Builder ──────────────────────────────────────────────────────────────

interface DigestPayload {
  teacherName: string
  weekLabel: string
  totalStudents: number
  activeStudents: number
  totalGamesPlayed: number
  avgMastery: number
  strugglingSkills: Array<{ name: string; avg: number; count: number }>
  atRisk: Array<{ name: string; worstSkill: { skillName: string; pl: number } | null }>
  topStudent: { name: string; xp: number } | null
  appUrl: string
}

function masteryLabel(p: number) {
  if (p >= 0.75) return 'Proficient 🟢'
  if (p >= 0.5) return 'Developing 🟡'
  if (p >= 0.25) return 'Emerging 🟠'
  return 'Needs Attention 🔴'
}

function buildDigestEmail(d: DigestPayload): string {
  const engagementRate = d.totalStudents > 0
    ? Math.round((d.activeStudents / d.totalStudents) * 100)
    : 0
  const avgPct = Math.round(d.avgMastery * 100)
  const barColor = d.avgMastery >= 0.75 ? '#10b981' : d.avgMastery >= 0.5 ? '#f59e0b' : d.avgMastery >= 0.25 ? '#f97316' : '#ef4444'
  const labelColor = d.avgMastery >= 0.75 ? '#16a34a' : d.avgMastery >= 0.5 ? '#ca8a04' : d.avgMastery >= 0.25 ? '#ea580c' : '#dc2626'

  const strugglingRows = d.strugglingSkills.length > 0
    ? d.strugglingSkills.map(s => `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#0f172a;">${s.name}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#ef4444;font-weight:700;">${Math.round(s.avg * 100)}%</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">${s.count}</td>
            </tr>`).join('')
    : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;">All skills above threshold 🎉</td></tr>`

  const atRiskRows = d.atRisk.length > 0
    ? d.atRisk.map(s => `
            <tr>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#0f172a;">${s.name}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#f59e0b;">${s.worstSkill?.skillName ?? '—'}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#ef4444;font-weight:700;">${s.worstSkill ? Math.round(s.worstSkill.pl * 100) + '%' : '—'}</td>
            </tr>`).join('')
    : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8;">No at-risk students this week 🎉</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>EduPlay Weekly Report</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:620px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#10b981 0%,#0891b2 100%);padding:36px 40px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">📊</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">Weekly Class Report</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${d.weekLabel}</p>
    </div>
    <!-- Body -->
    <div style="padding:36px 40px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;">Hi <strong>${d.teacherName}</strong>, here's how your students did this week.</p>
      <!-- 4-stat grid -->
      <table width="100%" cellpadding="0" cellspacing="8" style="margin-bottom:28px;">
        <tr>
          <td width="50%">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#16a34a;">${d.activeStudents}/${d.totalStudents}</div>
              <div style="font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.05em;margin-top:4px;">Active Students</div>
            </div>
          </td>
          <td width="50%">
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#1d4ed8;">${engagementRate}%</div>
              <div style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.05em;margin-top:4px;">Engagement</div>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%">
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:18px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#7c3aed;">${avgPct}%</div>
              <div style="font-size:11px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:0.05em;margin-top:4px;">Avg P(L) Mastery</div>
            </div>
          </td>
          <td width="50%">
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:18px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ea580c;">${d.totalGamesPlayed}</div>
              <div style="font-size:11px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:0.05em;margin-top:4px;">Games Played</div>
            </div>
          </td>
        </tr>
      </table>
      <!-- Mastery bar -->
      <div style="background:#f8fafc;border-radius:12px;padding:18px;margin-bottom:28px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-weight:700;color:#0f172a;font-size:13px;">Class Mastery P(L)</span>
          <span style="font-weight:800;font-size:13px;color:${labelColor};">${masteryLabel(d.avgMastery)}</span>
        </div>
        <div style="height:10px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
          <div style="height:100%;width:${avgPct}%;background:${barColor};border-radius:99px;"></div>
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-top:6px;">P(L) = Bayesian probability student has mastered each skill</div>
      </div>
      ${d.topStudent ? `
      <div style="background:linear-gradient(135deg,#fef9c3,#fef08a);border:1px solid #fde047;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
        <span style="font-size:24px;">🏆</span>
        <span style="font-weight:800;color:#92400e;font-size:16px;margin-left:10px;">${d.topStudent.name} — ${d.topStudent.xp.toLocaleString()} XP this week</span>
      </div>` : ''}
      <!-- Skills needing attention -->
      <h2 style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 10px;">⚠️ Skills Needing Attention</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
        <thead><tr style="background:#fff7ed;">
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:#9a3412;text-transform:uppercase;">Skill</th>
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:#9a3412;text-transform:uppercase;">Avg P(L)</th>
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:#9a3412;text-transform:uppercase;">Students</th>
        </tr></thead>
        <tbody>${strugglingRows}</tbody>
      </table>
      <!-- At-risk students -->
      <h2 style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 10px;">🚩 Students Needing Support</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:32px;">
        <thead><tr style="background:#fef2f2;">
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:#991b1b;text-transform:uppercase;">Student</th>
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:#991b1b;text-transform:uppercase;">Weakest Skill</th>
          <th style="padding:9px 12px;text-align:left;font-size:10px;font-weight:800;color:#991b1b;text-transform:uppercase;">P(L)</th>
        </tr></thead>
        <tbody>${atRiskRows}</tbody>
      </table>
      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${d.appUrl}/dashboard/teacher" style="display:inline-block;background:linear-gradient(135deg,#10b981,#0891b2);color:#fff;text-decoration:none;padding:13px 34px;border-radius:999px;font-weight:800;font-size:14px;">View Full Dashboard →</a>
      </div>
      <p style="font-size:11px;color:#94a3b8;text-align:center;margin:0;">EduPlay · <a href="${d.appUrl}/settings/notifications" style="color:#94a3b8;">Manage email preferences</a></p>
    </div>
  </div>
</body>
</html>`
}
