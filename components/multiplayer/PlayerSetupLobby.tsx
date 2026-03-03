'use client'

/**
 * Player Setup Lobby
 * Pre-game screen for multiplayer setup
 */

import { useState, useEffect } from 'react'
import { GameMode, PlayerSide, AVATAR_OPTIONS, COLOR_OPTIONS, createDefaultPlayer } from '@/lib/multiplayer/game-modes'
import { PlayerSetupManager } from '@/lib/multiplayer/player-setup'
import { theme } from '@/lib/theme'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

import ClassroomTools from './ClassroomTools'
import ClassroomLeaderboard from './ClassroomLeaderboard'

interface PlayerSetupLobbyProps {
    onStartGame: (setupManager: PlayerSetupManager) => void
    gameName: string
}

export default function PlayerSetupLobby({ onStartGame, gameName }: PlayerSetupLobbyProps) {
    const [setupManager] = useState(() => new PlayerSetupManager())
    const [mode, setMode] = useState<GameMode>(GameMode.SOLO)
    const [players, setPlayers] = useState(setupManager.getPlayers())
    const [teams, setTeams] = useState(setupManager.getTeams())

    // Define the update handler
    const handleUpdate = () => {
        setMode(setupManager.getMode())
        setPlayers(setupManager.getPlayers())
        setTeams(setupManager.getTeams())
    }

    useEffect(() => {
        setupManager.loadPreferences()
        handleUpdate()
    }, [setupManager])

    const handleModeChange = (newMode: GameMode) => {
        setMode(newMode)
        setupManager.setMode(newMode)
        handleUpdate()
    }

    const handlePlayerUpdate = (side: PlayerSide, field: string, value: string) => {
        setupManager.updatePlayer(side, { [field]: value })
        handleUpdate()
    }

    const handleToggleReady = (side: PlayerSide) => {
        setupManager.toggleReady(side)
        handleUpdate()
    }

    const handleStartGame = () => {
        if (setupManager.isReadyToStart()) {
            setupManager.savePreferences()
            onStartGame(setupManager)
        }
    }

    const isReadyToStart = setupManager.isReadyToStart()

    return (
        <div className={theme.page + " p-8"}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <ThemeToggle />
                    </div>
                    <h1 className={`text-6xl font-black ${theme.textPrimary} mb-4`}>
                        {gameName}
                    </h1>
                    <p className={`text-2xl ${theme.textSecondary}`}>
                        Choose your game mode and get ready to compete!
                    </p>
                </div>

                {/* Classroom Tools & Leaderboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-2">
                        <ClassroomTools
                            setupManager={setupManager}
                            onUpdate={handleUpdate}
                        />
                    </div>
                    <div>
                        <ClassroomLeaderboard />
                    </div>
                </div>

                {/* Mode Selection */}
                <div className="mb-16">
                    <h2 className={`text-3xl font-bold text-center mb-8 ${theme.textPrimary}`}>Select Game Mode</h2>
                    <div className="flex gap-6 justify-center">
                        <button
                            onClick={() => handleModeChange(GameMode.SOLO)}
                            className={`px-12 py-8 rounded-3xl text-2xl font-black transition-all touch-target border-4 ${mode === GameMode.SOLO
                                ? 'bg-blue-600 text-white border-blue-400 scale-105 shadow-2xl'
                                : `${theme.card} text-slate-400 hover:scale-105 border-transparent`
                                }`}
                        >
                            <div className="text-5xl mb-2">🎮</div>
                            Solo
                        </button>

                        <button
                            onClick={() => handleModeChange(GameMode.ONE_V_ONE)}
                            className={`px-12 py-8 rounded-3xl text-2xl font-black transition-all touch-target border-4 ${mode === GameMode.ONE_V_ONE
                                ? 'bg-purple-600 text-white border-purple-400 scale-105 shadow-2xl'
                                : `${theme.card} text-slate-400 hover:scale-105 border-transparent`
                                }`}
                        >
                            <div className="text-5xl mb-2">⚔️</div>
                            1v1 Battle
                        </button>

                        <button
                            onClick={() => handleModeChange(GameMode.TEAM_VS_TEAM)}
                            className={`px-12 py-8 rounded-3xl text-2xl font-black transition-all touch-target border-4 ${mode === GameMode.TEAM_VS_TEAM
                                ? 'bg-emerald-600 text-white border-emerald-400 scale-105 shadow-2xl'
                                : `${theme.card} text-slate-400 hover:scale-105 border-transparent`
                                }`}
                        >
                            <div className="text-5xl mb-2">👥</div>
                            Team vs Team
                        </button>
                    </div>
                </div>

                {/* Player Setup */}
                {mode !== GameMode.SOLO && (
                    <div className="grid grid-cols-2 gap-8 mb-12">
                        {/* Player 1 / Team A */}
                        <div className={`${theme.card} p-8 border-4 border-rose-500/30`}>
                            <h3 className="text-3xl font-black text-center mb-8 text-rose-500">
                                {mode === GameMode.TEAM_VS_TEAM ? 'Team A' : 'Player 1'}
                            </h3>

                            {/* Name Input */}
                            <div className="mb-8">
                                <label className={`block text-sm font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Name</label>
                                <input
                                    type="text"
                                    value={players.playerOne.name}
                                    onChange={(e) => handlePlayerUpdate(PlayerSide.LEFT, 'name', e.target.value)}
                                    className={`w-full px-6 py-4 text-2xl font-bold rounded-2xl border-4 border-slate-200 dark:border-slate-700 dark:bg-slate-900 ${theme.textPrimary} focus:border-rose-500 focus:outline-none transition-all`}
                                    placeholder="Enter name..."
                                />
                            </div>

                            {/* Avatar Selection */}
                            <div className="mb-8">
                                <label className={`block text-sm font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Avatar</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {AVATAR_OPTIONS.map((avatar) => (
                                        <button
                                            key={avatar}
                                            onClick={() => handlePlayerUpdate(PlayerSide.LEFT, 'avatar', avatar)}
                                            className={`avatar-option ${players.playerOne.avatar === avatar ? 'selected ring-4 ring-rose-500' : 'bg-slate-100 dark:bg-slate-800'
                                                }`}
                                        >
                                            {avatar}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Selection */}
                            <div className="mb-8">
                                <label className={`block text-sm font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Color</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {COLOR_OPTIONS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => handlePlayerUpdate(PlayerSide.LEFT, 'color', color.value)}
                                            className={`color-option h-12 w-full rounded-xl transition-all ${players.playerOne.color === color.value ? 'ring-4 ring-offset-4 ring-slate-400 scale-110' : ''
                                                }`}
                                            style={{ backgroundColor: color.value }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Ready Button */}
                            <button
                                onClick={() => handleToggleReady(PlayerSide.LEFT)}
                                className={`w-full py-6 rounded-xl text-2xl font-bold transition-all ${players.playerOne.isReady
                                    ? 'bg-green-600 text-white ready-button'
                                    : 'bg-gray-200 dark:bg-fixed-dark text-ink-2 dark:text-mist hover:bg-gray-300 dark:hover:bg-fixed-medium'
                                    }`}
                            >
                                {players.playerOne.isReady ? '✓ READY!' : 'Ready?'}
                            </button>
                        </div>

                        {/* Player 2 / Team B */}
                        <div className={`${theme.card} p-8 border-4 border-sky-500/30`}>
                            <h3 className="text-3xl font-black text-center mb-8 text-sky-500">
                                {mode === GameMode.TEAM_VS_TEAM ? 'Team B' : 'Player 2'}
                            </h3>

                            {/* Name Input */}
                            <div className="mb-8">
                                <label className={`block text-sm font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Name</label>
                                <input
                                    type="text"
                                    value={players.playerTwo?.name || ''}
                                    onChange={(e) => handlePlayerUpdate(PlayerSide.RIGHT, 'name', e.target.value)}
                                    className={`w-full px-6 py-4 text-2xl font-bold rounded-2xl border-4 border-slate-200 dark:border-slate-700 dark:bg-slate-900 ${theme.textPrimary} focus:border-sky-500 focus:outline-none transition-all`}
                                    placeholder="Enter name..."
                                />
                            </div>

                            {/* Avatar Selection */}
                            <div className="mb-8">
                                <label className={`block text-sm font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Avatar</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {AVATAR_OPTIONS.map((avatar) => (
                                        <button
                                            key={avatar}
                                            onClick={() => handlePlayerUpdate(PlayerSide.RIGHT, 'avatar', avatar)}
                                            className={`avatar-option ${players.playerTwo?.avatar === avatar ? 'selected ring-4 ring-sky-500' : 'bg-slate-100 dark:bg-slate-800'
                                                }`}
                                        >
                                            {avatar}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Selection */}
                            <div className="mb-8">
                                <label className={`block text-sm font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Color</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {COLOR_OPTIONS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => handlePlayerUpdate(PlayerSide.RIGHT, 'color', color.value)}
                                            className={`color-option h-12 w-full rounded-xl transition-all ${players.playerTwo?.color === color.value ? 'ring-4 ring-offset-4 ring-slate-400 scale-110' : ''
                                                }`}
                                            style={{ backgroundColor: color.value }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Ready Button */}
                            <button
                                onClick={() => handleToggleReady(PlayerSide.RIGHT)}
                                className={`w-full py-6 rounded-xl text-2xl font-bold transition-all ${players.playerTwo?.isReady
                                    ? 'bg-green-600 text-white ready-button'
                                    : 'bg-gray-200 dark:bg-fixed-dark text-ink-2 dark:text-mist hover:bg-gray-300 dark:hover:bg-fixed-medium'
                                    }`}
                            >
                                {players.playerTwo?.isReady ? '✓ READY!' : 'Ready?'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Solo Mode Ready */}
                {mode === GameMode.SOLO && (
                    <div className="max-w-md mx-auto mb-12">
                        <button
                            onClick={() => handleToggleReady(PlayerSide.LEFT)}
                            className={`w-full py-8 rounded-2xl text-3xl font-bold transition-all ${players.playerOne.isReady
                                ? 'bg-green-600 text-white ready-button'
                                : 'bg-gray-200 dark:bg-ink-3 text-ink-2 dark:text-mist hover:bg-gray-300 dark:hover:bg-ink-4'
                                }`}
                        >
                            {players.playerOne.isReady ? '✓ READY!' : 'Ready to Play?'}
                        </button>
                    </div>
                )}

                {/* Start Game Button */}
                <div className="text-center">
                    <button
                        onClick={handleStartGame}
                        disabled={!isReadyToStart}
                        className={`px-20 py-8 rounded-2xl text-4xl font-black transition-all touch-target ${isReadyToStart
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 shadow-2xl animate-pulse-fast'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        🎮 START GAME! 🎮
                    </button>
                </div>
            </div>
        </div>
    )
}
