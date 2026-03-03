/**
 * Multiplayer Game Modes System
 * Defines game modes, player configs, and competition settings
 */

export enum GameMode {
    SOLO = 'solo',
    ONE_V_ONE = '1v1',
    TEAM_VS_TEAM = 'team'
}

export enum PlayerSide {
    LEFT = 'left',
    RIGHT = 'right'
}

export interface PlayerConfig {
    id: string
    name: string
    color: string
    avatar: string
    side: PlayerSide
    isReady: boolean
}

export interface TeamConfig {
    id: string
    name: string
    color: string
    players: string[]
    side: PlayerSide
    isReady: boolean
}

export interface CompetitionSettings {
    enableComebackBonus: boolean
    enableSpeedBonus: boolean
    enableAccuracyBonus: boolean
    smartboardMode: boolean
    touchOptimized: boolean
    soundEffects: boolean
    showCompetitionBar: boolean
    autoSwitchSides: boolean
}

export interface GameModeConfig {
    mode: GameMode
    playerOne: PlayerConfig
    playerTwo?: PlayerConfig
    teamA?: TeamConfig
    teamB?: TeamConfig
    settings: CompetitionSettings
}

export const DEFAULT_SETTINGS: CompetitionSettings = {
    enableComebackBonus: true,
    enableSpeedBonus: true,
    enableAccuracyBonus: true,
    smartboardMode: false,
    touchOptimized: true,
    soundEffects: true,
    showCompetitionBar: true,
    autoSwitchSides: false
}

export const AVATAR_OPTIONS = [
    '🦁', '🐯', '🦊', '🐻', '🐼', '🐨', '🐸', '🦄',
    '🚀', '⚡', '🔥', '⭐', '💎', '🏆', '👑', '🎯'
]

export const COLOR_OPTIONS = [
    {
        name: 'Red',
        value: '#EF4444',
        gradient: 'from-red-500 to-red-600',
        light: '#FEE2E2',
        dark: '#991B1B'
    },
    {
        name: 'Blue',
        value: '#3B82F6',
        gradient: 'from-blue-500 to-blue-600',
        light: '#DBEAFE',
        dark: '#1E3A8A'
    },
    {
        name: 'Green',
        value: '#10B981',
        gradient: 'from-green-500 to-green-600',
        light: '#D1FAE5',
        dark: '#065F46'
    },
    {
        name: 'Purple',
        value: '#8B5CF6',
        gradient: 'from-purple-500 to-purple-600',
        light: '#EDE9FE',
        dark: '#5B21B6'
    },
    {
        name: 'Orange',
        value: '#F59E0B',
        gradient: 'from-orange-500 to-orange-600',
        light: '#FEF3C7',
        dark: '#92400E'
    },
    {
        name: 'Pink',
        value: '#EC4899',
        gradient: 'from-pink-500 to-pink-600',
        light: '#FCE7F3',
        dark: '#9F1239'
    }
]

export function createDefaultPlayer(side: PlayerSide, index: number): PlayerConfig {
    const colorIndex = side === PlayerSide.LEFT ? 0 : 1 // Red for left, Blue for right
    const avatarIndex = side === PlayerSide.LEFT ? 0 : 1 // Lion for left, Tiger for right

    return {
        id: `player-${side}-${Date.now()}`,
        name: `Player ${index}`,
        color: COLOR_OPTIONS[colorIndex].value,
        avatar: AVATAR_OPTIONS[avatarIndex],
        side,
        isReady: false
    }
}

export function createDefaultTeam(side: PlayerSide, name: string): TeamConfig {
    const colorIndex = side === PlayerSide.LEFT ? 0 : 1

    return {
        id: `team-${side}-${Date.now()}`,
        name,
        color: COLOR_OPTIONS[colorIndex].value,
        players: [],
        side,
        isReady: false
    }
}
