/**
 * Player Setup Manager
 * Handles player lobby, ready states, and team generation
 */

import { PlayerConfig, TeamConfig, GameMode, PlayerSide, AVATAR_OPTIONS, COLOR_OPTIONS, createDefaultPlayer, createDefaultTeam } from './game-modes'

export class PlayerSetupManager {
    private playerOne: PlayerConfig
    private playerTwo: PlayerConfig | null = null
    private teamA: TeamConfig | null = null
    private teamB: TeamConfig | null = null
    private mode: GameMode = GameMode.SOLO

    constructor() {
        this.playerOne = createDefaultPlayer(PlayerSide.LEFT, 1)
        this.playerTwo = createDefaultPlayer(PlayerSide.RIGHT, 2)
    }

    setMode(mode: GameMode) {
        this.mode = mode

        if (mode === GameMode.TEAM_VS_TEAM) {
            this.teamA = createDefaultTeam(PlayerSide.LEFT, 'Team A')
            this.teamB = createDefaultTeam(PlayerSide.RIGHT, 'Team B')
        } else {
            this.teamA = null
            this.teamB = null
        }
    }

    getMode(): GameMode {
        return this.mode
    }

    updatePlayer(side: PlayerSide, updates: Partial<PlayerConfig>) {
        if (side === PlayerSide.LEFT) {
            this.playerOne = { ...this.playerOne, ...updates }
        } else if (this.playerTwo) {
            this.playerTwo = { ...this.playerTwo, ...updates }
        }
    }

    updateTeam(side: PlayerSide, updates: Partial<TeamConfig>) {
        if (side === PlayerSide.LEFT && this.teamA) {
            this.teamA = { ...this.teamA, ...updates }
        } else if (side === PlayerSide.RIGHT && this.teamB) {
            this.teamB = { ...this.teamB, ...updates }
        }
    }

    toggleReady(side: PlayerSide) {
        if (this.mode === GameMode.TEAM_VS_TEAM) {
            if (side === PlayerSide.LEFT && this.teamA) {
                this.teamA.isReady = !this.teamA.isReady
            } else if (side === PlayerSide.RIGHT && this.teamB) {
                this.teamB.isReady = !this.teamB.isReady
            }
        } else {
            if (side === PlayerSide.LEFT) {
                this.playerOne.isReady = !this.playerOne.isReady
            } else if (this.playerTwo) {
                this.playerTwo.isReady = !this.playerTwo.isReady
            }
        }
    }

    isReadyToStart(): boolean {
        if (this.mode === GameMode.SOLO) {
            return this.playerOne.isReady
        } else if (this.mode === GameMode.ONE_V_ONE) {
            return this.playerOne.isReady && this.playerTwo?.isReady === true
        } else if (this.mode === GameMode.TEAM_VS_TEAM) {
            return this.teamA?.isReady === true && this.teamB?.isReady === true
        }
        return false
    }

    getPlayers(): { playerOne: PlayerConfig; playerTwo: PlayerConfig | null } {
        return {
            playerOne: this.playerOne,
            playerTwo: this.playerTwo
        }
    }

    getTeams(): { teamA: TeamConfig | null; teamB: TeamConfig | null } {
        return {
            teamA: this.teamA,
            teamB: this.teamB
        }
    }

    switchSides() {
        if (this.mode === GameMode.ONE_V_ONE && this.playerTwo) {
            // Swap player sides
            const tempName = this.playerOne.name
            const tempColor = this.playerOne.color
            const tempAvatar = this.playerOne.avatar

            this.playerOne.name = this.playerTwo.name
            this.playerOne.color = this.playerTwo.color
            this.playerOne.avatar = this.playerTwo.avatar

            this.playerTwo.name = tempName
            this.playerTwo.color = tempColor
            this.playerTwo.avatar = tempAvatar
        } else if (this.mode === GameMode.TEAM_VS_TEAM && this.teamA && this.teamB) {
            // Swap team sides
            const tempName = this.teamA.name
            const tempColor = this.teamA.color
            const tempPlayers = this.teamA.players

            this.teamA.name = this.teamB.name
            this.teamA.color = this.teamB.color
            this.teamA.players = this.teamB.players

            this.teamB.name = tempName
            this.teamB.color = tempColor
            this.teamB.players = tempPlayers
        }
    }

    generateRandomTeams(studentNames: string[]): void {
        if (studentNames.length < 2) return

        // Shuffle students
        const shuffled = [...studentNames].sort(() => Math.random() - 0.5)

        // Split into two teams
        const midpoint = Math.ceil(shuffled.length / 2)
        const teamAPlayers = shuffled.slice(0, midpoint)
        const teamBPlayers = shuffled.slice(midpoint)

        if (this.teamA && this.teamB) {
            this.teamA.players = teamAPlayers
            this.teamB.players = teamBPlayers
        }
    }

    reset() {
        this.playerOne = createDefaultPlayer(PlayerSide.LEFT, 1)
        this.playerTwo = createDefaultPlayer(PlayerSide.RIGHT, 2)
        this.teamA = null
        this.teamB = null
        this.mode = GameMode.SOLO
    }

    savePreferences() {
        if (typeof window !== 'undefined') {
            const prefs = {
                playerOne: this.playerOne,
                playerTwo: this.playerTwo,
                mode: this.mode
            }
            localStorage.setItem('eduplay-multiplayer-prefs', JSON.stringify(prefs))
        }
    }

    loadPreferences() {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('eduplay-multiplayer-prefs')
            if (saved) {
                try {
                    const prefs = JSON.parse(saved)
                    this.playerOne = prefs.playerOne || this.playerOne
                    this.playerTwo = prefs.playerTwo || this.playerTwo
                    this.mode = prefs.mode || this.mode
                } catch (e) {
                    console.error('Failed to load preferences:', e)
                }
            }
        }
    }
}
