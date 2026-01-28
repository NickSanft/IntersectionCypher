import type { GameState } from "../types";

export class UISystem {
  public update(state: GameState, dt: number): void {
    state.hud.updateLayout(state.app.renderer.width, state.app.renderer.height);
    state.hudTopRight.updateLayout(state.app.renderer.width, state.app.renderer.height);
    state.doorPrompt.updateLayout(state.app.renderer.width, state.app.renderer.height);
    state.minimap.updateLayout(state.app.renderer.width, state.app.renderer.height);
    state.triggerPrompt.updateLayout(state.app.renderer.width, state.app.renderer.height);
    state.abilityBar.root.updateLayout(state.app.renderer.width, state.app.renderer.height);
    state.dialog.ui.updateLayout(state.app.renderer.width, state.app.renderer.height);
    state.levelUp.ui.updateLayout(state.app.renderer.width, state.app.renderer.height);
    state.menu.update(dt);
    state.menu.updateLayout(state.app.renderer.width, state.app.renderer.height);
    state.menu.updatePlayerData(state.playerData);
  }
}
