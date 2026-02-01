import type { GameState } from "../types";
import { findFirstConsumable, useConsumableById } from "../data/InventoryUtils";

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
    const healed = useConsumableById(state.playerData, itemId);
    if (healed > 0) {
      state.player.sprite.tint = 0x86efac;
      setTimeout(() => {
        state.player.sprite.tint = 0xffffff;
      }, 150);
    }
  }
}
