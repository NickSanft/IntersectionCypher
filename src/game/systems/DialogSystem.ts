import type { GameState } from "../types";

export class DialogSystem {
  private lastActionPressed = false;
  private lastNodeId: string | null = null;
  private choicesNodeId: string | null = null;
  private lastUpPressed = false;
  private lastDownPressed = false;
  private selectedIndex = 0;

  public update(state: GameState, dt: number): void {
    const upPressed = state.input.isActionPressed("up");
    const downPressed = state.input.isActionPressed("down");
    const upJustPressed = upPressed && !this.lastUpPressed;
    const downJustPressed = downPressed && !this.lastDownPressed;
    this.lastUpPressed = upPressed;
    this.lastDownPressed = downPressed;

    if (state.dialog.open && state.menu.isOpen) {
      state.dialog.engine.close();
      state.dialog.open = false;
      state.dialog.activeId = null;
      state.dialog.ui.setVisible(false);
      state.dialog.ui.setText("");
      state.dialog.ui.setChoices([], () => undefined);
      this.selectedIndex = 0;
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
          const dialogData = state.dialog.dialogs[state.npcDialogId];
          if (!dialogData) {
            state.dialog.open = false;
            return;
          }
          state.dialog.activeId = state.npcDialogId;
          state.dialog.engine.setData(dialogData);
          state.dialog.engine.start();
          state.dialog.ui.setVisible(true);
          state.dialog.charIndex = 0;
          state.dialog.charTimer = 0;
          state.dialog.ui.setText("");
          state.dialog.ui.setChoices([], () => undefined);
          this.selectedIndex = 0;
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
      state.dialog.activeId = null;
      state.dialog.ui.setVisible(false);
      return;
    }

    if (this.lastNodeId !== state.dialog.engine.currentNodeId) {
      this.lastNodeId = state.dialog.engine.currentNodeId;
      this.choicesNodeId = null;
      this.selectedIndex = 0;
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
            this.selectedIndex = 0;
          });
          state.dialog.ui.setSelected(this.selectedIndex);
        }
        if (upJustPressed) {
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          state.dialog.ui.setSelected(this.selectedIndex);
        } else if (downJustPressed) {
          this.selectedIndex = Math.min(node.choices.length - 1, this.selectedIndex + 1);
          state.dialog.ui.setSelected(this.selectedIndex);
        } else if (actionJustPressed) {
          state.dialog.engine.choose(this.selectedIndex);
          this.lastNodeId = null;
          this.choicesNodeId = null;
          this.selectedIndex = 0;
        }
      } else if (actionJustPressed) {
        state.dialog.engine.advance();
        if (!state.dialog.engine.isOpen) {
          state.dialog.open = false;
          state.dialog.activeId = null;
          state.dialog.ui.setVisible(false);
          state.dialog.ui.setChoices([], () => undefined);
        }
        this.lastNodeId = null;
        this.choicesNodeId = null;
        this.selectedIndex = 0;
      }
    }

    if (actionJustPressed && state.dialog.charIndex < fullText.length) {
      state.dialog.charIndex = fullText.length;
      state.dialog.ui.setText(fullText);
    }
  }
}
