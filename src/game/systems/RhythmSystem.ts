import type { GameState } from "../types";

const getTimeSeconds = (state: GameState, nowMs: number): number => {
  const start = state.rhythm.startTimeMs;
  if (start === null) {
    return 0;
  }
  return Math.max(0, (nowMs - start) / 1000);
};

export const isOnBeat = (state: GameState, nowMs: number = performance.now()): boolean => {
  if (state.rhythm.startTimeMs === null) {
    return false;
  }
  const interval = state.rhythm.beatInterval;
  if (interval <= 0) {
    return false;
  }
  const time = getTimeSeconds(state, nowMs);
  const phase = time % interval;
  const window = state.rhythm.windowSeconds;
  return phase <= window || phase >= interval - window;
};

export class RhythmSystem {
  public update(state: GameState, dt: number): void {
    this.ensureAudioUnlocked(state);
    if (state.rhythm.startTimeMs === null) {
      state.rhythm.startTimeMs = performance.now();
    }
    state.rhythm.totalTime += dt;

    const interval = state.rhythm.beatInterval;
    if (interval <= 0) {
      state.rhythm.onBeat = false;
      return;
    }

    const nowMs = performance.now();
    const time = getTimeSeconds(state, nowMs);
    state.rhythm.time = time;

    const beatIndex = Math.floor(time / interval);
    if (beatIndex !== state.rhythm.lastBeat) {
      state.rhythm.lastBeat = beatIndex;
      state.rhythm.pulse = 1;
      state.rhythm.overlayAlpha = 0.18;
      this.playTick(state, beatIndex % 4 === 0);
    }

    state.rhythm.onBeat = isOnBeat(state, nowMs);
    state.rhythm.pulse = Math.max(0, state.rhythm.pulse - dt * state.rhythm.pulseDecay);
    state.rhythm.overlayAlpha = Math.max(
      0,
      state.rhythm.overlayAlpha - dt * state.rhythm.overlayDecay
    );
    this.updateOverlay(state);
  }

  private ensureAudioUnlocked(state: GameState): void {
    if (!state.rhythm.audioEnabled) {
      return;
    }
    if (!state.rhythm.audioUnlocked) {
      if (!state.input.isAnyPressed()) {
        return;
      }
      state.rhythm.audioUnlocked = true;
    }
    if (typeof AudioContext === "undefined") {
      return;
    }
    if (!state.rhythm.audioContext) {
      state.rhythm.audioContext = new AudioContext();
    }
    if (state.rhythm.audioContext.state === "suspended") {
      void state.rhythm.audioContext.resume();
    }
  }

  private playTick(state: GameState, accent: boolean): void {
    if (!state.rhythm.audioEnabled || !state.rhythm.audioUnlocked) {
      return;
    }
    const ctx = state.rhythm.audioContext;
    if (!ctx) {
      return;
    }
    if (ctx.state === "suspended") {
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = accent ? 880 : 660;
    const now = ctx.currentTime;
    gain.gain.value = state.rhythm.tickVolume;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.frequency.value = freq;
    osc.type = "square";
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  private updateOverlay(state: GameState): void {
    const overlay = state.rhythmOverlay;
    const alpha = state.rhythm.overlayAlpha;
    if (alpha <= 0) {
      overlay.visible = false;
      return;
    }
    overlay.visible = true;
    overlay.clear();
    const width = state.app.renderer.width;
    const height = state.app.renderer.height;
    overlay.beginFill(0xfbbf24, alpha);
    overlay.drawRect(0, 0, width, height);
    overlay.endFill();
  }
}
