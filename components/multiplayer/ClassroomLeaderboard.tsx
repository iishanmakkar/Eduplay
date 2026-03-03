'use client'

/**
 * Classroom Leaderboard
 * Displays local stats for the current session
 */

import { useState, useEffect } from 'react'
import { leaderboard, WinnerStat } from '@/lib/multiplayer/leaderboard'

export default function ClassroomLeaderboard() {
    const [topPlayers, setTopPlayers] = useState<WinnerStat[]>([])
    // const [topStreaks, setTopStreaks] = useState<WinnerStat[]>([]) // Deprecated for now
    const [view, setView] = useState<'wins' | 'xp'>('wins')
    const [loading, setLoading] = useState(false)

    const refreshStats = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/multiplayer/leaderboard?limit=5')
            const data = await res.json()
            if (data.success) {
                // Map API response to Component state
                // API returns { name, wins, totalXP, avatar }
                setTopPlayers(data.leaderboard.map((p: any) => ({
                    ...p,
                    streak: 0 // Placeholder
                })))
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshStats()
        // Auto-refresh every 10 seconds
        const interval = setInterval(refreshStats, 10000)
        return () => clearInterval(interval)
    }, [])

    // Sort helper
    const displayPlayers = [...topPlayers].sort((a, b) => {
        if (view === 'wins') return b.wins - a.wins
        if (view === 'xp') return b.totalXP - a.totalXP
        return 0
    })

    return (
        <div className="bg-white dark:bg-fixed-medium rounded-2xl shadow-xl overflow-hidden border border-border h-full flex flex-col transition-colors">
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-2xl">🏆</span> Class Leaderboard
                    </h3>
                    <div className="flex bg-white/20 rounded-lg p-1">
                        <button
                            onClick={() => setView('wins')}
                            className={`px-3 py-1 rounded-md text-sm font-semibold transition ${view === 'wins' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'}`}
                        >
                            Wins
                        </button>
                        <button
                            onClick={() => setView('xp')}
                            className={`px-3 py-1 rounded-md text-sm font-semibold transition ${view === 'xp' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'}`}
                        >
                            Total XP
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-0 overflow-y-auto grow">
                {displayPlayers.length === 0 ? (
                    <div className="p-8 text-center text-mist">
                        {loading ? (
                            <p>Loading stats...</p>
                        ) : (
                            <>
                                <div className="text-4xl mb-2">🏁</div>
                                <p>No games played yet!</p>
                            </>
                        )}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-fixed-dark text-mist text-xs uppercase sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left">Rank</th>
                                <th className="px-6 py-3 text-left">Player</th>
                                <th className="px-6 py-3 text-right">
                                    {view === 'wins' ? 'Wins' : 'XP'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {displayPlayers.map((player, index) => (
                                <tr key={player.name} className="hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                            ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 dark:bg-fixed-dark text-gray-700 dark:text-mist' :
                                                    index === 2 ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300' : 'text-mist'}
                                        `}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{player.avatar}</span>
                                            <span className="font-bold text-ink dark:text-white">{player.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                                            {view === 'wins' ? player.wins : player.totalXP}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-fixed-dark border-t border-border text-center shrink-0">
                <button
                    onClick={refreshStats}
                    disabled={loading}
                    className="text-xs text-indigo-500 font-semibold hover:text-indigo-700 uppercase tracking-wider disabled:opacity-50"
                >
                    {loading ? 'Refreshing...' : 'Refresh Stats ↻'}
                </button>
            </div>
        </div>
    )
}
