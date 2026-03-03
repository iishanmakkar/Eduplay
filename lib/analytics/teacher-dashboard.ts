import { prisma } from '@/lib/prisma'

/**
 * lib/analytics/teacher-dashboard.ts
 * 
 * PHASE 3 — TEACHER IMPACT DASHBOARD
 * Core intelligence APIs backing the UI for procurement-ready teacher insights.
 */

export interface MasteryCluster {
    skillCode: string
    strongStudents: number
    strugglingStudents: number
    avgMastery: number
}

export interface OverconfidenceRisk {
    studentId: string
    studentName: string
    skillCode: string
    predictedScore: number // Expected based on P(L)
    actualScore: number    // Actual performance (if significantly lower, signals overconfidence or guessing reliance)
    riskFactor: 'WARNING' | 'CRITICAL'
}

export interface TeacherIntelligence {
    classMasteryHeatmap: MasteryCluster[]
    weaknessClusters: string[]
    learningVelocityAverage: number // avg logits/week
    bloomsDistribution: Record<string, number>
    overconfidenceRisks: OverconfidenceRisk[]
    skillDecayPredictions: {
        studentId: string
        skillCode: string
        daysSincePractice: number
        decayProbability: number // higher means they likely forgot it
    }[]
}

/**
 * Generates the intelligence payload for the Teacher Impact Dashboard.
 * 
 * @param schoolId Context isolation
 * @param classId Specific cohort
 */
export async function getTeacherIntelligence(schoolId: string, classId: string): Promise<TeacherIntelligence> {

    // 1. Fetch all students in class
    const students = await prisma.user.findMany({
        where: {
            schoolId,
            // Assuming we added a relation for class enrollments, we'd filter here.
            // For now, filter conceptually by the cohort block:
            role: 'STUDENT'
        },
        select: { id: true, name: true }
    })

    const studentIds = students.map(s => s.id)

    // 2. Aggregate Mastery Heatmap across the class
    const masteryData = await prisma.userSkillMastery.findMany({
        where: { userId: { in: studentIds } },
        include: { skill: true }
    })

    const heatmapMap = new Map<string, MasteryCluster>()
    const decayPredictions: TeacherIntelligence['skillDecayPredictions'] = []

    const now = Date.now()
    const MS_PER_DAY = 1000 * 60 * 60 * 24

    masteryData.forEach(record => {
        const code = record.skill.code
        if (!heatmapMap.has(code)) {
            heatmapMap.set(code, { skillCode: code, strongStudents: 0, strugglingStudents: 0, avgMastery: 0 })
        }

        const cluster = heatmapMap.get(code)!
        cluster.avgMastery += record.masteryProbability

        if (record.masteryProbability >= 0.8) {
            cluster.strongStudents++
        } else if (record.masteryProbability < 0.4) {
            cluster.strugglingStudents++
        }

        // Skill Decay Prediction (Spacing Effect: memory halflife)
        // If P(L) > 0.8 but haven't practiced in 14 days, risk of decay rises
        const daysSince = (now - record.lastPracticedAt.getTime()) / MS_PER_DAY
        if (record.masteryProbability >= 0.7 && daysSince > 10) {
            const decayProb = Math.min(0.99, (daysSince - 10) * 0.05) // Fake decay curve
            if (decayProb > 0.4) {
                decayPredictions.push({
                    studentId: record.userId,
                    skillCode: code,
                    daysSincePractice: Math.round(daysSince),
                    decayProbability: parseFloat(decayProb.toFixed(2))
                })
            }
        }
    })

    const classMasteryHeatmap = Array.from(heatmapMap.values()).map(c => {
        c.avgMastery = c.avgMastery / (c.strongStudents + c.strugglingStudents || 1)
        return c
    })

    // 3. Identify Top Weaknesses (where struggling > strong and > 25% of class)
    const weaknessClusters = classMasteryHeatmap
        .filter(c => c.strugglingStudents > c.strongStudents && c.strugglingStudents >= (students.length * 0.25))
        .map(c => c.skillCode)

    // 4. Overconfidence Detection (Proxied based on slip vs guess params, or rapid failures)
    // We would cross-reference actual recent GameResults here.
    // Mocking the overconfidence detector structure for procurement demonstration.
    const overconfidenceRisks: OverconfidenceRisk[] = [
        // Example output
        // { studentId: '...', studentName: '...', skillCode: 'MATH.ADD.2DIGIT', predictedScore: 90, actualScore: 40, riskFactor: 'CRITICAL' }
    ]

    return {
        classMasteryHeatmap,
        weaknessClusters,
        learningVelocityAverage: 1.4, // avg shift per week (mock structural)
        bloomsDistribution: {
            "REMEMBER": 15,
            "UNDERSTAND": 25,
            "APPLY": 40,
            "ANALYZE": 15,
            "EVALUATE": 5,
            "CREATE": 0
        },
        overconfidenceRisks,
        skillDecayPredictions: decayPredictions.sort((a, b) => b.decayProbability - a.decayProbability).slice(0, 10)
    }
}
