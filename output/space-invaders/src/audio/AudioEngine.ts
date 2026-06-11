export class AudioEngine {
  private ctx: AudioContext | null = null;
  private marchTimer: ReturnType<typeof setInterval> | null = null;
  private marchStep = 0;
  private readonly marchFreqs = [100, 75, 60, 45];

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  resume(): void {
    this.ctx?.resume();
  }

  private tone(
    freq: number,
    type: OscillatorType,
    duration: number,
    vol = 0.25,
    startFreq?: number,
    delay = 0,
  ): void {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      const t = ctx.currentTime + delay;
      osc.frequency.setValueAtTime(startFreq ?? freq, t);
      if (startFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq), t + duration * 0.8);
      }
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    } catch (_) {}
  }

  private noise(duration: number, vol = 0.2, lowpass = 600, delay = 0): void {
    try {
      const ctx = this.getCtx();
      const sr = ctx.sampleRate;
      const buf = ctx.createBuffer(1, sr * duration, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = ctx.createGain();
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(t);
    } catch (_) {}
  }

  playShoot(): void {
    this.tone(880, 'square', 0.08, 0.12, 440);
  }

  playInvaderShoot(): void {
    this.tone(300, 'sawtooth', 0.1, 0.08, 180);
  }

  playExplosion(big = false): void {
    this.noise(big ? 0.7 : 0.35, big ? 0.45 : 0.3, big ? 300 : 500);
    this.tone(big ? 55 : 80, 'sine', big ? 0.6 : 0.28, 0.3);
  }

  playPlayerDeath(): void {
    this.noise(0.9, 0.5, 400);
    this.tone(600, 'sawtooth', 0.9, 0.35, 180);
  }

  playPowerUp(): void {
    [440, 554, 659, 880].forEach((f, i) => {
      this.tone(f, 'square', 0.12, 0.2, undefined, i * 0.07);
    });
  }

  playLevelUp(): void {
    [440, 554, 659, 784, 1047].forEach((f, i) => {
      this.tone(f, 'square', 0.18, 0.22, undefined, i * 0.09);
    });
  }

  playGameOver(): void {
    [440, 370, 294, 220, 165].forEach((f, i) => {
      this.tone(f, 'sawtooth', 0.35, 0.28, undefined, i * 0.22);
    });
  }

  startMarch(intervalMs: number): void {
    this.stopMarch();
    this.marchTimer = setInterval(() => {
      const freq = this.marchFreqs[this.marchStep % 4];
      this.tone(freq, 'square', 0.08, 0.18);
      this.marchStep++;
    }, intervalMs);
  }

  stopMarch(): void {
    if (this.marchTimer !== null) {
      clearInterval(this.marchTimer);
      this.marchTimer = null;
    }
  }
}
