/**
 * lib/analytics/roi-calculator.ts
 * 
 * PHASE 5 — ROI CALCULATOR
 * Evaluates the hard financial and academic returns of an EduPlay enterprise license.
 */

export interface SchoolStats {
    studentCount: number
    avgImprovementPercent: number
    teacherHoursSavedPerWeek: number
    aiCostPerStudentAnnually: number
    subscriptionCostAnnually: number
    teacherHourlyRate: number
}

export interface ROIMetrics {
    costPerStudentAnnually: number
    academicUpliftPerDollar: number
    teacherProductivityValue: number // Financial value of time saved
    netROI: number
    longTermRetentionPredictionPercent: number
}

/**
 * Calculates District procurement ROI metrics.
 * Designed to be piped into the Executive Admin Dashboard to prove value for renewals.
 */
export function calculateDistrictROI(metrics: SchoolStats): ROIMetrics {
    const WEEKS_PER_YEAR = 40 // Active school weeks

    // 1. Cost Math
    const totalAiCost = metrics.studentCount * metrics.aiCostPerStudentAnnually
    const totalCost = metrics.subscriptionCostAnnually + totalAiCost
    const costPerStudentAnnually = totalCost / Math.max(1, metrics.studentCount)

    // 2. Productivity Return
    const totalHoursSaved = metrics.teacherHoursSavedPerWeek * WEEKS_PER_YEAR
    const teacherProductivityValue = totalHoursSaved * metrics.teacherHourlyRate

    // 3. Academic Value Mapping (Uplift points per $1000 spent)
    const academicUpliftPerDollar = totalCost > 0
        ? ((metrics.avgImprovementPercent * metrics.studentCount) / totalCost) * 1000
        : 0

    // 4. Financial Net ROI 
    // ((Value Gained - Cost) / Cost) * 100
    const netROI = totalCost > 0
        ? ((teacherProductivityValue - totalCost) / totalCost) * 100
        : 0

    // 5. Retention Prediction
    // Base 80% + (Improvement * 0.5)
    let retentionBase = 80.0 + (metrics.avgImprovementPercent * 0.5)

    // Penalty if cost per student is unsustainably high
    if (costPerStudentAnnually > 30) retentionBase -= 15
    if (costPerStudentAnnually > 50) retentionBase -= 30

    return {
        costPerStudentAnnually: parseFloat(costPerStudentAnnually.toFixed(2)),
        academicUpliftPerDollar: parseFloat(academicUpliftPerDollar.toFixed(2)),
        teacherProductivityValue: parseFloat(teacherProductivityValue.toFixed(2)),
        netROI: parseFloat(netROI.toFixed(1)),
        longTermRetentionPredictionPercent: parseFloat(Math.min(99.9, Math.max(0, retentionBase)).toFixed(1))
    }
}
