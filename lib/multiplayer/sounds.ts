/**
 * Multiplayer Sound Manager
 * Handles all competitive sound effects using Web Audio API
 * Designed to be dependency-free (no external mp3s required)
 */

export class SoundManager {
    private enabled: boolean = true
    private volume: number = 0.6
    private audioContext: AudioContext | null = null

    constructor() {
        // Lazy load audio context on first interaction
    }

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            } catch (e) {
                console.warn('Web Audio API not supported')
                return null
            }
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => { })
        }
        return this.audioContext
    }

    /**
     * Play a sound effect
     */
    play(soundName: string, volumeScale: number = 1.0) {
        if (!this.enabled) return
        const ctx = this.getContext()
        if (!ctx) return

        const vol = this.volume * volumeScale

        switch (soundName) {
            case 'correct-ding':
                this.playTone(ctx, 880, 'sine', 0.1, vol)
                setTimeout(() => this.playTone(ctx, 1760, 'sine', 0.3, vol * 0.5), 50)
                break
            case 'wrong-buzz':
                this.playTone(ctx, 150, 'sawtooth', 0.4, vol)
                setTimeout(() => this.playTone(ctx, 100, 'sawtooth', 0.4, vol), 100)
                break
            case 'countdown-beep':
                this.playTone(ctx, 440, 'sine', 0.1, vol)
                break
            case 'go-horn':
                this.playTone(ctx, 660, 'square', 0.1, vol)
                this.playTone(ctx, 880, 'square', 0.6, vol)
                break
            case 'combo-whoosh':
                this.playSweep(ctx, 200, 800, 0.3, vol)
                break
            case 'speed-zap':
                this.playSweep(ctx, 1200, 400, 0.2, vol)
                break
            case 'victory':
                this.playMelody(ctx, [523, 659, 784, 1046], 0.15, vol)
                break
            case 'xp-pop':
                this.playTone(ctx, 1200, 'sine', 0.05, vol * 0.5)
                break
            case 'overtake':
                this.playSweep(ctx, 400, 800, 0.2, vol)
                this.playTone(ctx, 800, 'triangle', 0.1, vol)
                break
        }
    }

    /**
     * Play correct answer sound
     */
    playCorrect() {
        this.play('correct-ding')
    }

    /**
     * Play wrong answer sound
     */
    playWrong() {
        this.play('wrong-buzz')
    }

    /**
     * Play combo sound (pitch increases with streak)
     */
    playCombo(streak: number) {
        if (!this.enabled) return
        const ctx = this.getContext()
        if (!ctx) return

        // Pitch shift based on streak
        const baseFreq = 300 + (Math.min(streak, 10) * 50)
        this.playSweep(ctx, baseFreq, baseFreq + 400, 0.3, this.volume)
    }

    /**
     * Play XP gain pop
     */
    playXP() {
        this.play('xp-pop')
    }

    /**
     * Play countdown sequence
     */
    playCountdown(callback?: () => void) {
        this.play('countdown-beep')
        setTimeout(() => this.play('countdown-beep'), 1000)
        setTimeout(() => this.play('countdown-beep'), 2000)
        setTimeout(() => {
            this.play('go-horn')
            callback?.()
        }, 3000)
    }

    /**
     * Play victory fanfare
     */
    playVictory() {
        this.play('victory')
    }

    /**
     * Play tie game sound
     */
    playTie() {
        // Use a neutral but positive sound, maybe a double ding
        this.play('correct-ding')
        setTimeout(() => this.play('correct-ding'), 200)
    }

    /**
     * Play speed bonus sound
     */
    playSpeedBonus() {
        this.play('speed-zap')
    }

    /**
     * Play overtake sound
     */
    playOvertake() {
        this.play('overtake')
    }

    // --- Synthesis Helpers ---

    private playTone(ctx: AudioContext, freq: number, type: OscillatorType, duration: number, vol: number) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = type
        osc.frequency.setValueAtTime(freq, ctx.currentTime)

        gain.gain.setValueAtTime(vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start()
        osc.stop(ctx.currentTime + duration)
    }

    private playSweep(ctx: AudioContext, startFreq: number, endFreq: number, duration: number, vol: number) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration)

        gain.gain.setValueAtTime(vol, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start()
        osc.stop(ctx.currentTime + duration)
    }

    private playMelody(ctx: AudioContext, freqs: number[], interval: number, vol: number) {
        freqs.forEach((f, i) => {
            setTimeout(() => this.playTone(ctx, f, 'sine', interval, vol), i * (interval * 1000))
        })
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled
    }
}

export const soundManager = new SoundManager()
