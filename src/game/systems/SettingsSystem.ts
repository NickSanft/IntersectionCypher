import type { GameState } from "../types";

const volumeLabels = ["Low", "Medium", "High"];
const volumeValues = [0.05, 0.12, 0.2];

export class SettingsSystem {
  private lastSettingsPressed = false;

  public update(state: GameState): void {
    const settingsPressed = state.input.isActionPressed("settings");
    const settingsJustPressed = settingsPressed && !this.lastSettingsPressed;
    this.lastSettingsPressed = settingsPressed;

    if (settingsJustPressed) {
      state.settings.open = !state.settings.open;
      state.settings.ui.setVisible(state.settings.open);
    }

    if (!state.settings.open) {
      return;
    }

    const volumeLabel = this.getVolumeLabel(state.rhythm.tickVolume);
    state.settings.ui.setMetronomeEnabled(state.rhythm.audioEnabled);
    state.settings.ui.setTickVolumeLabel(volumeLabel);
  }

  public toggleMetronome(state: GameState): void {
    state.rhythm.audioEnabled = !state.rhythm.audioEnabled;
    if (!state.rhythm.audioEnabled) {
      state.rhythm.audioUnlocked = false;
      if (state.rhythm.audioContext && state.rhythm.audioContext.state !== "closed") {
        void state.rhythm.audioContext.suspend();
      }
    }
  }

  public cycleVolume(state: GameState): void {
    const currentIndex = this.getVolumeIndex(state.rhythm.tickVolume);
    const nextIndex = (currentIndex + 1) % volumeValues.length;
    state.rhythm.tickVolume = volumeValues[nextIndex];
  }

  private getVolumeIndex(value: number): number {
    const index = volumeValues.findIndex((entry) => Math.abs(entry - value) < 0.001);
    return index >= 0 ? index : 1;
  }

  private getVolumeLabel(value: number): string {
    const index = this.getVolumeIndex(value);
    return volumeLabels[index] ?? "Medium";
  }
}
