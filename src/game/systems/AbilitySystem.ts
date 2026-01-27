import type { GameState } from "../types";

export class AbilitySystem {
  private readonly lastPressed: boolean[] = [];

  public update(state: GameState, dt: number): void {
    this.updateBuffs(state, dt);
    this.updateAbilities(state, dt);
    this.updateUI(state);
  }

  private updateBuffs(state: GameState, dt: number): void {
    if (state.playerDamageMultTimer > 0) {
      state.playerDamageMultTimer = Math.max(0, state.playerDamageMultTimer - dt);
      if (state.playerDamageMultTimer === 0) {
        state.playerDamageMult = 1;
      }
    }
  }

  private updateAbilities(state: GameState, dt: number): void {
    const paused = state.dialog.open || state.menu.isOpen || state.levelUp.active;
    const abilities = state.abilities;
    for (let i = 0; i < abilities.length; i += 1) {
      const ability = abilities[i];
      const def = ability.def;

      if (ability.cooldownRemaining > 0) {
        ability.cooldownRemaining = Math.max(0, ability.cooldownRemaining - dt);
      }

      if (ability.castRemaining > 0) {
        if (!paused) {
          ability.castRemaining = Math.max(0, ability.castRemaining - dt);
          if (ability.castRemaining === 0) {
            const ok = def.onCast(state);
            if (ok) {
              ability.cooldownRemaining = def.cooldown;
            }
          }
        }
        continue;
      }

      const pressed = state.input.isActionPressed(def.inputAction);
      const wasPressed = this.lastPressed[i] ?? false;
      this.lastPressed[i] = pressed;

      if (paused || ability.cooldownRemaining > 0 || !pressed || wasPressed) {
        continue;
      }

      if (def.castTime <= 0) {
        const ok = def.onCast(state);
        if (ok) {
          ability.cooldownRemaining = def.cooldown;
        }
      } else {
        ability.castRemaining = def.castTime;
      }
    }
  }

  private updateUI(state: GameState): void {
    const bar = state.abilityBar;
    const abilities = state.abilities;
    const padding = 8;
    const slotSize = 48;
    const gap = 8;
    const width = padding * 2 + abilities.length * slotSize + (abilities.length - 1) * gap;
    const height = padding * 2 + slotSize;
    bar.root.setSize(width, height);

    for (let i = 0; i < abilities.length; i += 1) {
      const ability = abilities[i];
      const x = padding + i * (slotSize + gap);
      const y = padding;

      const bg = bar.slotBgs[i];
      bg.clear();
      bg.beginFill(0x0b1220, 0.85);
      bg.lineStyle(1, 0x1f2937, 1);
      bg.drawRoundedRect(0, 0, slotSize, slotSize, 6);
      bg.endFill();
      bg.position.set(x, y);

      const label = bar.slotLabels[i];
      label.text = ability.def.label;
      label.position.set(x + slotSize * 0.5, y + slotSize * 0.55);

      const keyText = bar.slotKeys[i];
      keyText.text = ability.def.keyLabel;
      keyText.position.set(x + slotSize - 4, y + slotSize - 3);

      const cooldown = bar.slotCooldowns[i];
      cooldown.clear();
      if (ability.cooldownRemaining > 0) {
        const ratio =
          ability.def.cooldown === 0
            ? 0
            : ability.cooldownRemaining / ability.def.cooldown;
        const h = slotSize * ratio;
        cooldown.beginFill(0x0f172a, 0.7);
        cooldown.drawRoundedRect(0, slotSize - h, slotSize, h, 6);
        cooldown.endFill();
      }
      cooldown.position.set(x, y);

      const cast = bar.slotCasts[i];
      cast.clear();
      if (ability.castRemaining > 0 && ability.def.castTime > 0) {
        const ratio = 1 - ability.castRemaining / ability.def.castTime;
        cast.beginFill(0x38bdf8, 0.9);
        cast.drawRoundedRect(0, 0, slotSize * ratio, 4, 2);
        cast.endFill();
      }
      cast.position.set(x, y);
    }
  }
}
