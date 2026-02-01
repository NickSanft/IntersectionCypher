import type { GameState, LevelUpOption } from "../types";
import { pickUpgradeOptions } from "../data/Upgrades";
import { applyUpgrade } from "../data/UpgradeUtils";

export class LevelUpSystem {
  private lastUp = false;
  private lastDown = false;
  private lastAction = false;
  private lastGpUp = false;
  private lastGpDown = false;
  private lastGpAction = false;

  public addExperience(state: GameState, amount: number): void {
    const stats = state.playerData.stats;
    stats.exp += amount;
    while (stats.exp >= stats.expToNext) {
      stats.exp -= stats.expToNext;
      stats.level += 1;
      stats.expToNext *= 2;
      this.openLevelUp(state);
    }
  }

  public update(state: GameState): void {
    if (!state.levelUp.active) {
      return;
    }

    const up = state.input.isActionPressed("up");
    const down = state.input.isActionPressed("down");
    const action = state.input.isActionPressed("action");

    const gamepad = this.getGamepad();
    const gpUp = this.isGamepadUp(gamepad);
    const gpDown = this.isGamepadDown(gamepad);
    const gpAction = this.isGamepadAction(gamepad);

    const upJust = (up && !this.lastUp) || (gpUp && !this.lastGpUp);
    const downJust = (down && !this.lastDown) || (gpDown && !this.lastGpDown);
    const actionJust =
      (action && !this.lastAction) || (gpAction && !this.lastGpAction);

    this.lastUp = up;
    this.lastDown = down;
    this.lastAction = action;
    this.lastGpUp = gpUp;
    this.lastGpDown = gpDown;
    this.lastGpAction = gpAction;

    if (upJust) {
      state.levelUp.selectedIndex = Math.max(0, state.levelUp.selectedIndex - 1);
      state.levelUp.ui.setSelected(state.levelUp.selectedIndex);
    } else if (downJust) {
      state.levelUp.selectedIndex = Math.min(
        state.levelUp.options.length - 1,
        state.levelUp.selectedIndex + 1
      );
      state.levelUp.ui.setSelected(state.levelUp.selectedIndex);
    } else if (actionJust) {
      const option = state.levelUp.options[state.levelUp.selectedIndex];
      if (option) {
        option.apply(state);
      }
      state.levelUp.active = false;
      state.levelUp.ui.setVisible(false);
    }
  }

  private openLevelUp(state: GameState): void {
    state.levelUp.active = true;
    state.levelUp.selectedIndex = 0;
    state.levelUp.options = this.buildOptions(state);
    state.levelUp.ui.setOptions(
      state.levelUp.options.map((opt) => opt.label),
      0,
      (index) => {
        state.levelUp.selectedIndex = index;
        const option = state.levelUp.options[index];
        if (option) {
          option.apply(state);
        }
        state.levelUp.active = false;
        state.levelUp.ui.setVisible(false);
      }
    );
    state.levelUp.ui.setVisible(true);
  }

  private buildOptions(state: GameState): LevelUpOption[] {
    const upgrades = pickUpgradeOptions(3, state.playerData.stats.level);
    return upgrades.map((upgrade) => ({
      id: upgrade.id,
      label: upgrade.label,
      apply: (state) => applyUpgrade(state, upgrade),
    }));
  }

  private getGamepad(): Gamepad | null {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (pad && pad.connected) {
        return pad;
      }
    }
    return null;
  }

  private isGamepadUp(pad: Gamepad | null): boolean {
    if (!pad) {
      return false;
    }
    const axis = pad.axes[1] ?? 0;
    return pad.buttons[12]?.pressed === true || axis < -0.6;
  }

  private isGamepadDown(pad: Gamepad | null): boolean {
    if (!pad) {
      return false;
    }
    const axis = pad.axes[1] ?? 0;
    return pad.buttons[13]?.pressed === true || axis > 0.6;
  }

  private isGamepadAction(pad: Gamepad | null): boolean {
    if (!pad) {
      return false;
    }
    return pad.buttons[0]?.pressed === true;
  }

}
