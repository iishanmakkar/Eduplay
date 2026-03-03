'use client'

/**
 * Classroom Tools
 * Utilities for teachers to manage student rosters and generate teams
 */

import { useState, useEffect } from 'react'
import { PlayerSetupManager } from '@/lib/multiplayer/player-setup'
import { GameMode, PlayerSide, AVATAR_OPTIONS, COLOR_OPTIONS } from '@/lib/multiplayer/game-modes'
import toast from 'react-hot-toast'

interface ClassroomToolsProps {
    setupManager: PlayerSetupManager
    onUpdate: () => void
}

export default function ClassroomTools({ setupManager, onUpdate }: ClassroomToolsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [rosterInput, setRosterInput] = useState('')
    const [studentList, setStudentList] = useState<string[]>([])

    // Load saved roster on mount
    useEffect(() => {
        const saved = localStorage.getItem('eduplay-classroom-roster')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setStudentList(parsed)
                setRosterInput(parsed.join('\n'))
            } catch (e) {
                console.error('Failed to load roster', e)
            }
        }
    }, [])

    const handleSaveRoster = () => {
        const names = rosterInput
            .split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0)

        setStudentList(names)
        localStorage.setItem('eduplay-classroom-roster', JSON.stringify(names))
        toast.success(`Saved ${names.length} students to roster!`)
    }

    const handleGenerateTeams = () => {
        if (studentList.length < 2) {
            toast.error('Need at least 2 students to generate teams!')
            return
        }

        setupManager.setMode(GameMode.TEAM_VS_TEAM)
        setupManager.generateRandomTeams(studentList)

        // Auto-ready teams for convenience
        // setupManager.toggleReady(PlayerSide.LEFT)
        // setupManager.toggleReady(PlayerSide.RIGHT)

        onUpdate()
        toast.success('Teams generated successfully!')
        setIsOpen(false)
    }

    const handleNextPair = () => {
        if (studentList.length < 2) {
            toast.error('Need at least 2 students for a match!')
            return
        }

        // Shuffle and pick 2
        const shuffled = [...studentList].sort(() => Math.random() - 0.5)
        const [p1, p2] = shuffled

        setupManager.setMode(GameMode.ONE_V_ONE)

        setupManager.updatePlayer(PlayerSide.LEFT, {
            name: p1,
            avatar: AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)],
            color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)].value
        })

        setupManager.updatePlayer(PlayerSide.RIGHT, {
            name: p2,
            avatar: AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)],
            color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)].value
        })

        onUpdate()
        toast.success(`Next Match: ${p1} vs ${p2}!`)
        setIsOpen(false)
    }

    return (
        <div className="mb-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors mx-auto"
            >
                <span>👨‍🏫</span>
                {isOpen ? 'Close Classroom Tools' : 'Open Classroom Tools'}
            </button>

            {isOpen && (
                <div className="mt-4 bg-white dark:bg-fixed-medium rounded-2xl p-6 shadow-xl border-2 border-indigo-100 dark:border-indigo-900/30 max-w-2xl mx-auto animate-fade-in transition-colors">
                    <h3 className="text-xl font-bold text-ink dark:text-white mb-4 flex items-center gap-2">
                        <span>📋</span> Class Roster
                    </h3>

                    <div className="mb-4">
                        <textarea
                            value={rosterInput}
                            onChange={(e) => setRosterInput(e.target.value)}
                            placeholder="Paste student names here (one per line)...&#10;Alice&#10;Bob&#10;Charlie&#10;Diana"
                            className="w-full h-40 p-4 rounded-xl border-2 border-gray-200 dark:border-fixed-dark bg-white dark:bg-background text-ink dark:text-white focus:border-indigo-500 focus:outline-none font-mono text-sm"
                        />
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-mist">
                                {studentList.length} students loaded
                            </span>
                            <button
                                onClick={handleSaveRoster}
                                className="px-4 py-2 bg-ink dark:bg-ink-3 text-white rounded-lg text-sm font-semibold hover:bg-black dark:hover:bg-ink-4 transition"
                            >
                                Save Roster
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-surface dark:border-fixed-dark">
                        <button
                            onClick={handleGenerateTeams}
                            className="p-4 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition flex flex-col items-center gap-2"
                        >
                            <span className="text-2xl">⚡</span>
                            <span>Generate Teams</span>
                            <span className="text-xs font-normal opacity-75">For Team vs Team</span>
                        </button>

                        <button
                            onClick={handleNextPair}
                            className="p-4 bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 rounded-xl font-bold hover:bg-purple-100 dark:hover:bg-purple-900/20 transition flex flex-col items-center gap-2"
                        >
                            <span className="text-2xl">🎲</span>
                            <span>Pick Random Pair</span>
                            <span className="text-xs font-normal opacity-75">For 1v1 Tournament</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
