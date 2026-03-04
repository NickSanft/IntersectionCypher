import type { GameState } from "../types";

/** Returns the AudioContext if audio is ready to use, null otherwise */
function getCtx(state: GameState): AudioContext | null {
  if (!state.rhythm.audioEnabled || !state.rhythm.audioUnlocked) return null;
  const c = state.rhythm.audioContext;
  if (!c || c.state === "suspended") return null;
  return c;
}

/**
 * Play a single oscillator with exponential gain decay.
 * delay is in seconds relative to AudioContext.currentTime.
 */
function osc(
  c: AudioContext,
  type: OscillatorType,
  freqStart: number,
  freqEnd: number,
  vol: number,
  dur: number,
  delay = 0,
): void {
  const now = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freqStart, now);
  if (freqEnd !== freqStart) {
    o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + dur);
  }
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(now);
  o.stop(now + dur + 0.01);
}

/**
 * Play filtered white noise with exponential gain decay.
 */
function noise(
  c: AudioContext,
  filterType: BiquadFilterType,
  freqStart: number,
  freqEnd: number,
  vol: number,
  dur: number,
  delay = 0,
): void {
  const now = c.currentTime + delay;
  const samples = Math.ceil(c.sampleRate * (dur + 0.05));
  const buf = c.createBuffer(1, samples, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(freqStart, now);
  if (freqEnd !== freqStart) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + dur);
  }

  const g = c.createGain();
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);

  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start(now);
  src.stop(now + dur + 0.05);
}

export class SoundSystem {
  /** Projectile fired */
  static playShoot(state: GameState, charged: boolean): void {
    const c = getCtx(state);
    if (!c) return;
    if (charged) {
      osc(c, "square",   200,  440, 0.09, 0.14);
      osc(c, "sine",     440,  880, 0.07, 0.14);
      noise(c, "highpass", 2000, 4000, 0.06, 0.05);
    } else {
      osc(c, "triangle", 660, 880, 0.06, 0.07);
    }
  }

  /** Projectile hit an enemy */
  static playHit(state: GameState, onBeat: boolean, charged: boolean): void {
    const c = getCtx(state);
    if (!c) return;
    const base = charged ? 1.5 : 1.0;
    const beatMult = onBeat ? 1.65 : 1.0;
    const v = 0.18 * base * beatMult;
    noise(c, "lowpass", 1500, 200, v,        0.12);
    osc(c,   "sine",    110,   40, v * 1.1,  0.12);
    if (onBeat) {
      // Extra crack on the beat
      osc(c, "square", 2000, 800, 0.10, 0.04);
    }
  }

  /** Enemy killed */
  static playEnemyDeath(state: GameState, onBeat: boolean): void {
    const c = getCtx(state);
    if (!c) return;
    const v = onBeat ? 0.42 : 0.28;
    noise(c, "lowpass", 600,  80, v,         0.35);
    osc(c,   "sine",    120,  28, v * 0.85,  0.30);
    if (onBeat) {
      osc(c, "triangle", 1200, 400, 0.16, 0.08); // bright ping on kill
    }
  }

  /** Player took damage */
  static playPlayerHurt(state: GameState): void {
    const c = getCtx(state);
    if (!c) return;
    noise(c, "lowpass", 350, 80,  0.20, 0.09); // impact thump
    osc(c,   "sine",    180, 55,  0.28, 0.30); // painful descend
  }

  /** An ability was successfully activated */
  static playAbility(state: GameState): void {
    const c = getCtx(state);
    if (!c) return;
    osc(c, "square", 440, 440, 0.10, 0.05);
    osc(c, "square", 660, 660, 0.08, 0.05, 0.04);
  }

  /** Player stepped into the door and transition started */
  static playDoorTransition(state: GameState): void {
    const c = getCtx(state);
    if (!c) return;
    osc(c, "sine", 261, 261, 0.10, 0.10);
    osc(c, "sine", 329, 329, 0.10, 0.10, 0.09);
    osc(c, "sine", 392, 392, 0.12, 0.15, 0.18);
  }

  /** Player levelled up */
  static playLevelUp(state: GameState): void {
    const c = getCtx(state);
    if (!c) return;
    // Ascending C-E-G-C arpeggio
    ([261, 329, 392, 523] as const).forEach((freq, i) => {
      osc(c, "square", freq, freq, 0.12, 0.09, i * 0.09);
    });
  }

  /** Combo milestone reached (x3 / x5 / x8 etc.) */
  static playComboMilestone(state: GameState, count: number): void {
    const c = getCtx(state);
    if (!c) return;
    const freq = Math.min(400 + count * 28, 1100);
    osc(c, "triangle", freq, freq * 1.5, 0.09, 0.07);
  }
}
