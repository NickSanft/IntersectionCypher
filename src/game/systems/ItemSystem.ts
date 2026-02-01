import type { GameState } from "../types";
import { findFirstConsumable, removeItemById } from "../data/InventoryUtils";
import { itemDefs } from "../data/Items";

export class ItemSystem {
  private lastUsePressed = false;

  public update(state: GameState): void {
    const usePressed = state.input.isActionPressed("useItem");
    const useJustPressed = usePressed && !this.lastUsePressed;
    this.lastUsePressed = usePressed;

    if (!useJustPressed) {
      return;
    }
    if (state.menu.isOpen || state.dialog.open || state.levelUp.active) {
      return;
    }

    const itemId = findFirstConsumable(state.playerData);
    if (!itemId) {
      return;
    }
    const def = itemDefs[itemId];
    if (!def || !def.effect) {
      return;
    }

    if (def.effect.type === "heal") {
      const stats = state.playerData.stats;
      if (stats.hp >= stats.maxHp) {
        return;
      }
      const ok = removeItemById(state.playerData, itemId, 1);
      if (!ok) {
        return;
      }
      stats.hp = Math.min(stats.maxHp, stats.hp + def.effect.amount);
      state.player.sprite.tint = 0x86efac;
      setTimeout(() => {
        state.player.sprite.tint = 0xffffff;
      }, 150);
    }
  }
}
