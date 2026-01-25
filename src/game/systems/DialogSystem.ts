import type { GameState } from "../types";

export class DialogSystem {
  private lastActionPressed = false;

  public update(state: GameState, dt: number): void {
    const actionPressed = state.input.isActionPressed("action");
    const actionJustPressed = actionPressed && !this.lastActionPressed;
    this.lastActionPressed = actionPressed;

    if (actionJustPressed) {
      if (state.dialog.open) {
        state.dialog.open = false;
        state.dialog.ui.visible = false;
        state.dialog.text.text = "";
      } else if (!state.menu.isOpen) {
        const dx = state.player.pos.x - state.npc.pos.x;
        const dy = state.player.pos.y - state.npc.pos.y;
        if (Math.hypot(dx, dy) <= 40) {
          state.dialog.open = true;
          state.dialog.ui.visible = true;
          state.dialog.charIndex = 0;
          state.dialog.charTimer = 0;
          state.dialog.text.text = "";
          state.aim.chargeActive = false;
        }
      }
    }

    if (!state.dialog.open) {
      return;
    }

    if (state.dialog.charIndex < state.dialog.content.length) {
      state.dialog.charTimer += dt;
      const nextChars = Math.floor(state.dialog.charTimer * state.dialog.charsPerSecond);
      if (nextChars > 0) {
        state.dialog.charIndex = Math.min(
          state.dialog.content.length,
          state.dialog.charIndex + nextChars
        );
        state.dialog.charTimer = 0;
        state.dialog.text.text = state.dialog.content.slice(0, state.dialog.charIndex);
      }
    }
  }
}
