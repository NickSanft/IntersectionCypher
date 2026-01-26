import type { GameState } from "../types";

export class DialogSystem {
  private lastActionPressed = false;
  private lastNodeId: string | null = null;
  private choicesNodeId: string | null = null;

  public update(state: GameState, dt: number): void {
    if (state.dialog.open && state.menu.isOpen) {
      state.dialog.engine.close();
      state.dialog.open = false;
      state.dialog.ui.setVisible(false);
      state.dialog.ui.setText("");
      state.dialog.ui.setChoices([], () => undefined);
      return;
    }
    const actionPressed = state.input.isActionPressed("action");
    const actionJustPressed = actionPressed && !this.lastActionPressed;
    this.lastActionPressed = actionPressed;

    if (!state.dialog.open) {
      if (actionJustPressed && !state.menu.isOpen) {
        const dx = state.player.pos.x - state.npc.pos.x;
        const dy = state.player.pos.y - state.npc.pos.y;
        if (Math.hypot(dx, dy) <= 40) {
          state.dialog.open = true;
          state.dialog.engine.start();
          state.dialog.ui.setVisible(true);
          state.dialog.charIndex = 0;
          state.dialog.charTimer = 0;
          state.dialog.ui.setText("");
          state.dialog.ui.setChoices([], () => undefined);
          this.lastNodeId = null;
          state.aim.chargeActive = false;
        }
      }
      return;
    }

    const node = state.dialog.engine.currentNode;
    if (!node) {
      state.dialog.engine.close();
      state.dialog.open = false;
      state.dialog.ui.setVisible(false);
      return;
    }

    if (this.lastNodeId !== state.dialog.engine.currentNodeId) {
      this.lastNodeId = state.dialog.engine.currentNodeId;
      this.choicesNodeId = null;
      state.dialog.charIndex = 0;
      state.dialog.charTimer = 0;
      state.dialog.ui.setText("");
      state.dialog.ui.setChoices([], () => undefined);
    }

    const fullText = node.text;
    if (state.dialog.charIndex < fullText.length) {
      state.dialog.charTimer += dt;
      const nextChars = Math.floor(state.dialog.charTimer * state.dialog.charsPerSecond);
      if (nextChars > 0) {
        state.dialog.charIndex = Math.min(
          fullText.length,
          state.dialog.charIndex + nextChars
        );
        state.dialog.charTimer = 0;
        state.dialog.ui.setText(fullText.slice(0, state.dialog.charIndex));
      }
    } else {
      state.dialog.ui.setText(fullText);
      if (node.choices && node.choices.length > 0) {
        if (this.choicesNodeId !== state.dialog.engine.currentNodeId) {
          this.choicesNodeId = state.dialog.engine.currentNodeId;
          state.dialog.ui.setChoices(node.choices, (index) => {
            state.dialog.engine.choose(index);
            this.lastNodeId = null;
            this.choicesNodeId = null;
          });
        }
      } else if (actionJustPressed) {
        state.dialog.engine.advance();
        if (!state.dialog.engine.isOpen) {
          state.dialog.open = false;
          state.dialog.ui.setVisible(false);
          state.dialog.ui.setChoices([], () => undefined);
        }
        this.lastNodeId = null;
        this.choicesNodeId = null;
      }
    }

    if (actionJustPressed && state.dialog.charIndex < fullText.length) {
      state.dialog.charIndex = fullText.length;
      state.dialog.ui.setText(fullText);
    }
  }
}
