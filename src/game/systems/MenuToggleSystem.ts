import type { GameState } from "../types";

export class MenuToggleSystem {
  private lastMenuPressed = false;

  public update(state: GameState): void {
    const menuPressed = state.input.isActionPressed("menu");
    const menuJustPressed = menuPressed && !this.lastMenuPressed;
    this.lastMenuPressed = menuPressed;

    if (!menuJustPressed) {
      return;
    }

    state.menu.toggle();
    if (state.menu.isOpen) {
      state.dialog.open = false;
      state.dialog.ui.visible = false;
      state.dialog.text.text = "";
      state.aim.chargeActive = false;
    }
  }
}
