import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set - emails will not be sent')
}

export const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key')

// Email templates
export const EMAIL_TEMPLATES = {
    WELCOME: 'welcome',
    DAILY_REMINDER: 'daily-reminder',
    TRIAL_EXPIRY: 'trial-expiry',
    WEEKLY_SUMMARY: 'weekly-summary',
    STUDENTS_FALLING_BEHIND: 'students-falling-behind',
    ACHIEVEMENT_UNLOCKED: 'achievement-unlocked',
    INVITE_TEACHER: 'invite-teacher',
}

interface EmailOptions {
    to: string
    subject: string
    html: string
    from?: string
}

export async function sendEmail(options: EmailOptions) {
    try {
        const result = await resend.emails.send({
            from: options.from || 'EduPlay <noreply@eduplay.in>',
            to: options.to,
            subject: options.subject,
            html: options.html,
        })
        return { success: true, id: result.data?.id }
    } catch (error) {
        console.error('Email send error:', error)
        return { success: false, error }
    }
}

// Daily reminder email
export async function sendDailyReminder(user: { email: string; firstName: string }) {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .button { 
            display: inline-block; 
            background: #10B981; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px;
            font-weight: 600;
          }
          .emoji { font-size: 48px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="emoji">🎮</div>
            <h1>Your daily challenge is waiting!</h1>
          </div>
          <p>Hi ${user.firstName},</p>
          <p>Don't break your streak! Complete today's challenge to earn bonus XP.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
              Play Now →
            </a>
          </p>
          <p style="color: #6B7280; font-size: 14px;">
            Keep your streak alive and unlock special rewards! 🔥
          </p>
        </div>
      </body>
    </html>
  `

    return sendEmail({
        to: user.email,
        subject: '🎮 Your daily challenge is waiting!',
        html,
    })
}

// Trial expiry warning
export async function sendTrialExpiryWarning(
    user: { email: string; firstName: string },
    daysLeft: number
) {
    const urgency = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'high' : 'medium'
    const emoji = urgency === 'urgent' ? '🚨' : '⏰'

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .alert { 
            background: ${urgency === 'urgent' ? '#FEE2E2' : '#FEF3C7'}; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
            text-align: center;
          }
          .button { 
            display: inline-block; 
            background: #10B981; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <h2>${emoji} ${daysLeft} day${daysLeft > 1 ? 's' : ''} left in your trial</h2>
          </div>
          <p>Hi ${user.firstName},</p>
          <p>Your EduPlay trial is ending soon. Upgrade now to keep access to all features:</p>
          <ul>
            <li>✓ Unlimited classes and students</li>
            <li>✓ Advanced analytics</li>
            <li>✓ PDF/CSV exports</li>
            <li>✓ Priority support</li>
          </ul>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/billing" class="button">
              Upgrade Now →
            </a>
          </p>
          <p style="color: #6B7280; font-size: 14px;">
            Don't lose access to your data and progress!
          </p>
        </div>
      </body>
    </html>
  `

    return sendEmail({
        to: user.email,
        subject: `${emoji} ${daysLeft} day${daysLeft > 1 ? 's' : ''} left in your trial`,
        html,
    })
}

// Weekly performance summary
export async function sendWeeklySummary(
    teacher: { email: string; firstName: string },
    stats: {
        totalGamesPlayed: number
        averageAccuracy: number
        topStudent: string
        studentsNeedingAttention: number
    }
) {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .stat-card { 
            background: #F3F4F6; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 10px 0;
          }
          .stat-value { font-size: 32px; font-weight: bold; color: #10B981; }
          .button { 
            display: inline-block; 
            background: #10B981; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Your Weekly Summary</h1>
          <p>Hi ${teacher.firstName},</p>
          <p>Here's how your class performed this week:</p>
          
          <div class="stat-card">
            <div class="stat-value">${stats.totalGamesPlayed}</div>
            <div>Games Played</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">${Math.round(stats.averageAccuracy * 100)}%</div>
            <div>Average Accuracy</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-value">⭐ ${stats.topStudent}</div>
            <div>Top Performer</div>
          </div>
          
          ${stats.studentsNeedingAttention > 0
            ? `
          <div class="stat-card" style="background: #FEF3C7;">
            <div class="stat-value" style="color: #F59E0B;">${stats.studentsNeedingAttention}</div>
            <div>Students Needing Attention</div>
          </div>
          `
            : ''
        }
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teacher" class="button">
              View Full Report →
            </a>
          </p>
        </div>
      </body>
    </html>
  `

    return sendEmail({
        to: teacher.email,
        subject: '📊 Your Weekly Class Summary',
        html,
    })
}

// Invite teacher email
export async function sendTeacherInvite(
    inviteEmail: string,
    inviterName: string,
    schoolName: string,
    inviteToken: string
) {
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?invite=${inviteToken}`

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .button { 
            display: inline-block; 
            background: #10B981; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏫 Join ${schoolName} on EduPlay!</h1>
          <p>${inviterName} has invited you to join ${schoolName} on EduPlay.</p>
          <p>EduPlay is a gamified learning platform that makes education fun and engaging for students.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" class="button">
              Accept Invitation →
            </a>
          </p>
          <p style="color: #6B7280; font-size: 14px;">
            This invitation expires in 7 days.
          </p>
        </div>
      </body>
    </html>
  `

    return sendEmail({
        to: inviteEmail,
        subject: `${inviterName} invited you to join ${schoolName} on EduPlay`,
        html,
    })
}
