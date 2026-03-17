import type { GameState } from "../types";
import { findFirstConsumable, removeItemById, useConsumableById } from "../data/InventoryUtils";
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
    if (def?.effect?.type === "beatStim") {
      const ok = removeItemById(state.playerData, itemId, 1);
      if (ok) {
        state.tempoBurstBeatsLeft = 8;
        state.player.sprite.tint = 0xfde047;
        setTimeout(() => { state.player.sprite.tint = 0xffffff; }, 200);
      }
      return;
    }
    if (def?.effect?.type === "ampCrystal") {
      const ok = removeItemById(state.playerData, itemId, 1);
      if (ok) {
        state.ampCrystalReady = true;
        state.player.sprite.tint = 0xf97316;
        setTimeout(() => { state.player.sprite.tint = 0xffffff; }, 200);
      }
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
