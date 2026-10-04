// Web Audio API tactical sound generator for AegisOps Security Dashboard

class TacticalSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private alarmInterval: number | null = null;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSOSAlarm();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playRadioClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 3;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.04);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio fallback ignored
    }
  }

  public playCheckpointScan() {
    // Pinging sound removed as requested
    return;
  }

  public playDispatchAlert() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [0, 0.12, 0.24].forEach((offset, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const freqs = [880, 1100, 1320];
        osc.frequency.setValueAtTime(freqs[idx] || 880, now + offset);

        gain.gain.setValueAtTime(0.1, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } catch {
      // Ignore
    }
  }

  public startSOSAlarm() {
    if (this.isMuted || this.alarmInterval) return;
    this.initCtx();

    const triggerSirenBurst = () => {
      if (this.isMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(950, now + 0.35);
        osc.frequency.linearRampToValueAtTime(600, now + 0.7);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.65);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.7);
      } catch {
        // audio fail
      }
    };

    triggerSirenBurst();
    this.alarmInterval = window.setInterval(triggerSirenBurst, 1200);
  }

  public stopSOSAlarm() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }
}

export const tacticalAudio = new TacticalSoundEngine();
