import { SaveService } from "@/services/SaveService";

/**
 * Procedural audio via the Web Audio API. No .mp3/.ogg files are bundled, so there is
 * nothing for a store reviewer to flag for licensing and nothing that bloats the APK.
 * Music is a simple generative arpeggio loop; SFX are short synthesized envelopes.
 */
class AudioServiceImpl {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = "sine", gainValue = 0.15, delay = 0): void {
    if (!SaveService.get().settings.sfxOn) return;
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.02);
  }

  jump(): void {
    this.tone(520, 0.15, "square", 0.12);
    this.tone(760, 0.1, "square", 0.08, 0.05);
  }

  coin(): void {
    this.tone(880, 0.08, "square", 0.1);
    this.tone(1320, 0.12, "square", 0.08, 0.06);
  }

  gem(): void {
    this.tone(1046, 0.1, "sine", 0.12);
    this.tone(1568, 0.15, "sine", 0.1, 0.05);
  }

  hit(): void {
    this.tone(160, 0.2, "sawtooth", 0.15);
  }

  defeatEnemy(): void {
    this.tone(300, 0.12, "square", 0.12);
    this.tone(150, 0.15, "square", 0.1, 0.06);
  }

  win(): void {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.2, "triangle", 0.14, i * 0.12));
  }

  lose(): void {
    [400, 300, 200].forEach((f, i) => this.tone(f, 0.25, "sawtooth", 0.12, i * 0.15));
  }

  click(): void {
    this.tone(700, 0.06, "square", 0.08);
  }

  purchase(): void {
    this.tone(660, 0.08, "sine", 0.1);
    this.tone(990, 0.1, "sine", 0.1, 0.07);
  }

  startMusicLoop(): void {
    if (!SaveService.get().settings.musicOn) return;
    this.stopMusicLoop();
    const scale = [261, 293, 329, 392, 440, 392, 329, 293];
    this.musicTimer = window.setInterval(() => {
      if (!SaveService.get().settings.musicOn) return;
      const freq = scale[this.musicStep % scale.length];
      this.tone(freq, 0.35, "triangle", 0.035);
      this.musicStep++;
    }, 420);
  }

  stopMusicLoop(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const AudioService = new AudioServiceImpl();
