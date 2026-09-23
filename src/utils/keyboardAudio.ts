/**
 * keyboardAudio.ts
 *
 * Realistic, subtle procedural mechanical keyboard sound synthesizer using Web Audio API.
 * Synthesizes clicky mechanical switch characteristics:
 * - Downstroke sharp snap/transient (high frequency bandpass burst)
 * - Switch bottom-out clack (thumpy low-mid resonator)
 * - Slight pitch and timing variations simulating realistic human keypress rhythms
 *
 * No external audio files needed; zero latency, offline capable, volume controllable.
 */

class MechanicalKeyboardAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isTypingLoopRunning: boolean = false;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    try {
      const stored = localStorage.getItem('nd_typing_sound_muted');
      if (stored !== null) {
        this.isMuted = stored === 'true';
      }
    } catch {
      /* ignore */
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.22, this.ctx.currentTime); // gentle, non-intrusive volume
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Plays a single realistic mechanical keystroke sound.
   */
  public playKeyClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const ctx = this.ctx;

    // Subtle pitch micro-variation
    const pitchVariation = 0.92 + Math.random() * 0.18;

    // 1. Bottom-out "Thump" (body of key hitting plate)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    const baseFreq = (140 + Math.random() * 40) * pitchVariation;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, t + 0.045);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650 * pitchVariation, t);

    oscGain.gain.setValueAtTime(0.0001, t);
    oscGain.gain.linearRampToValueAtTime(0.18, t + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);

    // 2. Click / Snap Transient (tactile bump & switch actuation snap)
    const bufferSize = Math.floor(ctx.sampleRate * 0.015); // ~15ms burst
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime((2800 + Math.random() * 800) * pitchVariation, t);
    noiseFilter.Q.setValueAtTime(4.2, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.14, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.025);
  }

  /**
   * Starts a continuous, rhythmic typing cadence mimicking rapid, human typing bursts.
   */
  public startTypingLoop() {
    if (this.isTypingLoopRunning) return;
    this.isTypingLoopRunning = true;

    const scheduleNextKey = () => {
      if (!this.isTypingLoopRunning) return;
      this.playKeyClick();

      // Human keystroke timing: mostly fast (70-130ms), occasional slight pause (180-260ms between words)
      const isWordPause = Math.random() < 0.16;
      const delay = isWordPause ? 180 + Math.random() * 110 : 70 + Math.random() * 65;

      this.typingTimer = setTimeout(scheduleNextKey, delay);
    };

    scheduleNextKey();
  }

  /**
   * Stops the ongoing mechanical typing sound loop.
   */
  public stopTypingLoop() {
    this.isTypingLoopRunning = false;
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('nd_typing_sound_muted', String(muted));
    } catch {
      /* ignore */
    }
    if (muted) {
      this.stopTypingLoop();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const keyboardAudio = new MechanicalKeyboardAudio();
