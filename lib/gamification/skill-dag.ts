/**
 * Skill DAG — Topological Sort & Cycle Detection
 * lib/gamification/skill-dag.ts
 *
 * The SkillNode prerequisite graph must be a DAG (Directed Acyclic Graph).
 * A cycle would cause infinite loops during skill progression calculations.
 *
 * Usage:
 *   const cycles = detectCycles(skills)
 *   if (cycles.length > 0) {
 *       console.error('Cyclic prerequisites detected:', cycles)
 *   }
 *
 * Called at seed time and optionally in a /api/health/skill-dag validation route.
 */

export interface SkillNodeLike {
    code: string
    prerequisites: { code: string }[]
}

/**
 * Kahn's Algorithm for topological sort + cycle detection.
 * Time: O(V + E) where V = skill nodes, E = prerequisite edges.
 *
 * @returns Array of skill codes that form cycles. Empty array = no cycles (valid DAG).
 */
export function detectCycles(skills: SkillNodeLike[]): string[] {
    // Build adjacency list and in-degree map
    const inDegree = new Map<string, number>()
    const graph = new Map<string, string[]>()

    for (const skill of skills) {
        if (!inDegree.has(skill.code)) inDegree.set(skill.code, 0)
        if (!graph.has(skill.code)) graph.set(skill.code, [])

        for (const prereq of skill.prerequisites) {
            // prereq -> skill (prereq must be learned first)
            const edges = graph.get(prereq.code) ?? []
            edges.push(skill.code)
            graph.set(prereq.code, edges)
            inDegree.set(skill.code, (inDegree.get(skill.code) ?? 0) + 1)
            if (!inDegree.has(prereq.code)) inDegree.set(prereq.code, 0)
            if (!graph.has(prereq.code)) graph.set(prereq.code, [])
        }
    }

    // Start with all nodes that have no prerequisites
    const queue: string[] = []
    for (const [code, deg] of inDegree) {
        if (deg === 0) queue.push(code)
    }

    let visited = 0
    while (queue.length > 0) {
        const code = queue.shift()!
        visited++
        for (const neighbor of graph.get(code) ?? []) {
            const newDeg = (inDegree.get(neighbor) ?? 0) - 1
            inDegree.set(neighbor, newDeg)
            if (newDeg === 0) queue.push(neighbor)
        }
    }

    // Any node not visited is part of a cycle
    if (visited === inDegree.size) return [] // No cycles

    const cyclicNodes: string[] = []
    for (const [code, deg] of inDegree) {
        if (deg > 0) cyclicNodes.push(code)
    }
    return cyclicNodes
}

/**
 * Build a topological ordering of skills for curriculum sequencing.
 * Returns skill codes in the order they should be recommended to students.
 * If cycles exist, only returns the non-cyclic subgraph.
 */
export function topologicalSort(skills: SkillNodeLike[]): string[] {
    const cycles = new Set(detectCycles(skills))
    const nonCyclicSkills = skills.filter((s) => !cycles.has(s.code))
    const inDegree = new Map<string, number>()
    const graph = new Map<string, string[]>()

    for (const skill of nonCyclicSkills) {
        if (!inDegree.has(skill.code)) inDegree.set(skill.code, 0)
        if (!graph.has(skill.code)) graph.set(skill.code, [])
        for (const prereq of skill.prerequisites) {
            if (cycles.has(prereq.code)) continue
            const edges = graph.get(prereq.code) ?? []
            edges.push(skill.code)
            graph.set(prereq.code, edges)
            inDegree.set(skill.code, (inDegree.get(skill.code) ?? 0) + 1)
        }
    }

    const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([c]) => c)
    const result: string[] = []

    while (queue.length > 0) {
        const code = queue.shift()!
        result.push(code)
        for (const neighbor of graph.get(code) ?? []) {
            const newDeg = (inDegree.get(neighbor) ?? 0) - 1
            inDegree.set(neighbor, newDeg)
            if (newDeg === 0) queue.push(neighbor)
        }
    }

    return result
}
