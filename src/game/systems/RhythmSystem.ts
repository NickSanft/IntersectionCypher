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
    if (state.rhythm.startTimeMs === null) {
      state.rhythm.startTimeMs = performance.now();
    }

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
    }

    state.rhythm.onBeat = isOnBeat(state, nowMs);
    state.rhythm.pulse = Math.max(0, state.rhythm.pulse - dt * state.rhythm.pulseDecay);
  }
}
