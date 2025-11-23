import { LotteryTheme } from '../services/lotteryService'

export class ThemeMusicPlayer {
  private audioContext: AudioContext | null = null
  private currentTheme: LotteryTheme | null = null
  private isPlaying = false
  private oscillators: OscillatorNode[] = []
  private gainNodes: GainNode[] = []

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  // ==================== CASINO JAZZ LOUNGE ====================
  private playCasinoMusic() {
    if (!this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime

    // Jazz chord progression: Dm7 -> G7 -> Cmaj7 -> A7
    const progression = [
      { time: 0, notes: [293.66, 349.23, 440, 523.25] },    // Dm7
      { time: 2, notes: [392, 493.88, 587.33, 698.46] },    // G7
      { time: 4, notes: [261.63, 329.63, 392, 493.88] },    // Cmaj7
      { time: 6, notes: [220, 277.18, 329.63, 415.30] }     // A7
    ]

    const playChord = (notes: number[], time: number) => {
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + time)

        gain.gain.setValueAtTime(0, now + time)
        gain.gain.linearRampToValueAtTime(0.08, now + time + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.01, now + time + 1.8)

        osc.start(now + time)
        osc.stop(now + time + 2)

        this.oscillators.push(osc)
        this.gainNodes.push(gain)
      })
    }

    // Play progression
    progression.forEach(chord => {
      playChord(chord.notes, chord.time)
    })

    // Loop every 8 seconds
    if (this.isPlaying) {
      setTimeout(() => {
        if (this.isPlaying && this.currentTheme === 'casino') {
          this.playCasinoMusic()
        }
      }, 8000)
    }
  }

  // ==================== BINGO PARTY ====================
  private playBingoMusic() {
    if (!this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime

    // Upbeat party melody
    const melody = [
      { freq: 523.25, time: 0, duration: 0.3 },      // C5
      { freq: 659.25, time: 0.3, duration: 0.3 },    // E5
      { freq: 783.99, time: 0.6, duration: 0.3 },    // G5
      { freq: 1046.50, time: 0.9, duration: 0.6 },   // C6
      { freq: 783.99, time: 1.5, duration: 0.3 },    // G5
      { freq: 659.25, time: 1.8, duration: 0.3 },    // E5
      { freq: 523.25, time: 2.1, duration: 0.6 }     // C5
    ]

    melody.forEach(note => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'square'
      osc.frequency.setValueAtTime(note.freq, now + note.time)

      gain.gain.setValueAtTime(0.12, now + note.time)
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration)

      osc.start(now + note.time)
      osc.stop(now + note.time + note.duration)

      this.oscillators.push(osc)
      this.gainNodes.push(gain)
    })

    // Bass line
    const bass = [
      { freq: 130.81, time: 0, duration: 0.8 },     // C3
      { freq: 164.81, time: 0.8, duration: 0.8 },   // E3
      { freq: 196.00, time: 1.6, duration: 0.8 }    // G3
    ]

    bass.forEach(note => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(note.freq, now + note.time)

      gain.gain.setValueAtTime(0.15, now + note.time)
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration)

      osc.start(now + note.time)
      osc.stop(now + note.time + note.duration)

      this.oscillators.push(osc)
      this.gainNodes.push(gain)
    })

    // Loop every 3 seconds
    if (this.isPlaying) {
      setTimeout(() => {
        if (this.isPlaying && this.currentTheme === 'bingo') {
          this.playBingoMusic()
        }
      }, 3000)
    }
  }

  // ==================== LOTTERY DRUM CIRCUS ====================
  private playDrumMusic() {
    if (!this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime

    // Circus-style waltz (3/4 time)
    const waltz = [
      { freq: 261.63, time: 0, duration: 0.8 },      // C4 (strong beat)
      { freq: 329.63, time: 1, duration: 0.4 },      // E4
      { freq: 392.00, time: 1.4, duration: 0.4 },    // G4
      { freq: 523.25, time: 2, duration: 0.8 },      // C5
      { freq: 392.00, time: 3, duration: 0.4 },      // G4
      { freq: 329.63, time: 3.4, duration: 0.4 }     // E4
    ]

    waltz.forEach(note => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(note.freq, now + note.time)

      gain.gain.setValueAtTime(0.1, now + note.time)
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration)

      osc.start(now + note.time)
      osc.stop(now + note.time + note.duration)

      this.oscillators.push(osc)
      this.gainNodes.push(gain)
    })

    // Loop every 4 seconds
    if (this.isPlaying) {
      setTimeout(() => {
        if (this.isPlaying && this.currentTheme === 'drum') {
          this.playDrumMusic()
        }
      }, 4000)
    }
  }

  // ==================== MODERN SYNTHWAVE ====================
  private playModernMusic() {
    if (!this.audioContext) return

    const ctx = this.audioContext
    const now = ctx.currentTime

    // Ambient synthwave pad
    const pad = [220, 277.18, 329.63, 440] // Am chord

    pad.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.06, now + 1)
      gain.gain.setValueAtTime(0.06, now + 4)
      gain.gain.linearRampToValueAtTime(0, now + 5)

      osc.start(now)
      osc.stop(now + 5)

      this.oscillators.push(osc)
      this.gainNodes.push(gain)
    })

    // Arpeggio
    const arpeggio = [
      { freq: 440, time: 0.5 },
      { freq: 554.37, time: 0.8 },
      { freq: 659.25, time: 1.1 },
      { freq: 880, time: 1.4 }
    ]

    arpeggio.forEach(note => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(note.freq, now + note.time)

      gain.gain.setValueAtTime(0.08, now + note.time)
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + 0.4)

      osc.start(now + note.time)
      osc.stop(now + note.time + 0.4)

      this.oscillators.push(osc)
      this.gainNodes.push(gain)
    })

    // Loop every 5 seconds
    if (this.isPlaying) {
      setTimeout(() => {
        if (this.isPlaying && this.currentTheme === 'modern') {
          this.playModernMusic()
        }
      }, 5000)
    }
  }

  // ==================== PUBLIC API ====================

  play(theme: LotteryTheme) {
    this.stop() // Stop any existing music

    this.currentTheme = theme
    this.isPlaying = true

    switch (theme) {
      case 'casino':
        this.playCasinoMusic()
        break
      case 'bingo':
        this.playBingoMusic()
        break
      case 'drum':
        this.playDrumMusic()
        break
      case 'modern':
        this.playModernMusic()
        break
    }
  }

  stop() {
    this.isPlaying = false

    // Stop all oscillators
    this.oscillators.forEach(osc => {
      try {
        osc.stop()
      } catch (e) {
        // Oscillator might already be stopped
      }
    })

    this.oscillators = []
    this.gainNodes = []
  }

  cleanup() {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}
