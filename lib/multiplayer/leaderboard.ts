export interface WinnerStat {
    name: string
    avatar: string
    wins: number
    streak: number
    totalXP: number
    lastPlayed: number
}

const STORAGE_KEY = 'eduplay-classroom-leaderboard'

export class ClassroomLeaderboard {
    private stats: Map<string, WinnerStat> = new Map()

    constructor() {
        this.load()
    }

    private load() {
        if (typeof window === 'undefined') return

        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                this.stats = new Map(Object.entries(parsed))
            } catch (e) {
                console.error('Failed to load leaderboard', e)
            }
        }
    }

    save() {
        if (typeof window === 'undefined') return
        const obj = Object.fromEntries(this.stats)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
    }

    recordWin(name: string, avatar: string, xpEarned: number) {
        const current = this.stats.get(name) || {
            name,
            avatar,
            wins: 0,
            streak: 0,
            totalXP: 0,
            lastPlayed: 0
        }

        current.wins += 1
        current.streak += 1
        current.totalXP += xpEarned
        current.lastPlayed = Date.now()
        // Update avatar to latest used
        current.avatar = avatar

        this.stats.set(name, current)
        this.save()
    }

    recordLoss(name: string, xpEarned: number) {
        // If player doesn't exist, we don't necessarily need to create them just for a loss, 
        // but for XP tracking we might want to.
        const current = this.stats.get(name)

        if (current) {
            current.streak = 0
            current.totalXP += xpEarned
            current.lastPlayed = Date.now()
            this.stats.set(name, current)
            this.save()
        }
    }

    getTopPlayers(limit: number = 5): WinnerStat[] {
        return Array.from(this.stats.values())
            .sort((a, b) => b.wins - a.wins || b.totalXP - a.totalXP)
            .slice(0, limit)
    }

    getTopStreaks(limit: number = 3): WinnerStat[] {
        return Array.from(this.stats.values())
            .sort((a, b) => b.streak - a.streak)
            .slice(0, limit)
    }
}

export const leaderboard = new ClassroomLeaderboard()
