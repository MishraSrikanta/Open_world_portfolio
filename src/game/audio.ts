/**
 * Tiny audio layer: synth engine hum + horn via the Web Audio API, plus a
 * looping ambient music bed streamed from a public-domain track. The music is
 * a plain <audio> element so it needs no CORS/decoding and fails gracefully.
 */

/**
 * Background music — Erik Satie, "Gnossienne No. 1" (public domain), hosted on
 * Wikimedia Commons. Special:FilePath is a permanent URL that redirects to the
 * current file location (the <audio> element follows the redirect). Drop in
 * any other open/CC0 track URL here to change the score.
 */
const MUSIC_URL =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Satie_-_Gnossienne_1.ogg";
const MUSIC_VOLUME = 0.35;

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private started = false;
  enabled = true;

  /** Must be called from a user gesture (browser autoplay policy). */
  init() {
    if (this.started || typeof window === "undefined") return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.4;
    this.master.connect(this.ctx.destination);
    this.startAmbient();
    this.started = true;
  }

  toggle(on: boolean) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.4 : 0;
    if (this.music) {
      this.music.volume = on ? MUSIC_VOLUME : 0;
      if (on) void this.music.play().catch(() => {});
      else this.music.pause();
    }
  }

  /** Stream a looping public-domain music bed. Plays only if the browser can
   *  decode the format and the network allows it; otherwise it stays silent. */
  private startAmbient() {
    if (typeof Audio === "undefined") return;
    try {
      const el = new Audio(MUSIC_URL);
      el.loop = true;
      el.volume = MUSIC_VOLUME;
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      this.music = el;
      void el.play().catch(() => {
        // some browsers need a second gesture; retry once on next click
        const retry = () => {
          void el.play().catch(() => {});
          window.removeEventListener("pointerdown", retry);
        };
        window.addEventListener("pointerdown", retry, { once: true });
      });
    } catch {
      this.music = null;
    }
  }

  /** intensity 0..1 controls engine pitch + volume; 0 silences it. */
  engine(intensity: number) {
    if (!this.ctx || !this.master || !this.enabled) return;
    if (intensity <= 0.001) {
      if (this.engineGain) this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      return;
    }
    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = "sawtooth";
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 600;
      this.engineOsc.connect(lp).connect(this.engineGain).connect(this.master);
      this.engineOsc.start();
    }
    this.engineOsc.frequency.setTargetAtTime(60 + intensity * 110, this.ctx.currentTime, 0.05);
    this.engineGain!.gain.setTargetAtTime(0.06 + intensity * 0.12, this.ctx.currentTime, 0.05);
  }

  private lastHorn = 0;
  horn() {
    if (!this.ctx || !this.master || !this.enabled) return;
    const now = this.ctx.currentTime;
    if (now - this.lastHorn < 0.4) return;
    this.lastHorn = now;
    const o = this.ctx.createOscillator();
    o.type = "square";
    o.frequency.value = 320;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    o.connect(g).connect(this.master);
    o.start(now);
    o.stop(now + 0.36);
  }
}

export const sfx = new Sfx();
