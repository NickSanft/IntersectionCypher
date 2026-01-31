import type { GameState } from "../types";

export class RunSummarySystem {
  private lastSummaryPressed = false;

  public update(state: GameState): void {
    const summaryPressed = state.input.isActionPressed("summary");
    const summaryJustPressed = summaryPressed && !this.lastSummaryPressed;
    this.lastSummaryPressed = summaryPressed;

    if (summaryJustPressed) {
      state.runSummary.open = !state.runSummary.open;
      state.runSummary.ui.setVisible(state.runSummary.open);
    }

    if (!state.runSummary.open) {
      return;
    }

    const total = state.rhythm.shotsTotal;
    const onBeat = state.rhythm.shotsOnBeat;
    const accuracy = total === 0 ? 0 : (onBeat / total) * 100;

    state.runSummary.ui.setStats({
      shotsOnBeat: onBeat,
      shotsTotal: total,
      accuracy,
      bpm: state.rhythm.bpm,
      timeSeconds: state.rhythm.totalTime,
    });
  }
}
