import type { GameState, LevelUpOption } from "../types";

export class LevelUpSystem {
  private lastUp = false;
  private lastDown = false;
  private lastAction = false;

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

    const upJust = up && !this.lastUp;
    const downJust = down && !this.lastDown;
    const actionJust = action && !this.lastAction;

    this.lastUp = up;
    this.lastDown = down;
    this.lastAction = action;

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
    state.levelUp.options = this.buildOptions();
    state.levelUp.ui.setOptions(
      state.levelUp.options.map((opt) => opt.label),
      0
    );
    state.levelUp.ui.setVisible(true);
  }

  private buildOptions(): LevelUpOption[] {
    return [
      {
        id: "damage",
        label: "+1 Projectile Damage",
        apply: (state) => {
          state.playerData.stats.projectileDamage += 1;
        },
      },
      {
        id: "projSpeed",
        label: "+30 Projectile Speed",
        apply: (state) => {
          state.playerData.stats.projectileSpeed += 30;
        },
      },
      {
        id: "moveSpeed",
        label: "+20 Move Speed",
        apply: (state) => {
          state.playerData.stats.moveSpeed += 20;
          state.playerController.setMoveSpeed(state.playerData.stats.moveSpeed);
        },
      },
      {
        id: "maxHp",
        label: "+10 Max HP",
        apply: (state) => {
          state.playerData.stats.maxHp += 10;
          state.playerData.stats.hp += 10;
        },
      },
      {
        id: "focus",
        label: "+2 Focus",
        apply: (state) => {
          state.playerData.stats.focus += 2;
        },
      },
    ];
  }
}
