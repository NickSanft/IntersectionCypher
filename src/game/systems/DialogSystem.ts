import type { GameState } from "../types";

export class DialogSystem {
  private lastActionPressed = false;
  private lastNodeId: string | null = null;
  private choicesNodeId: string | null = null;
  private lastUpPressed = false;
  private lastDownPressed = false;
  private selectedIndex = 0;
  private lastGpUp = false;
  private lastGpDown = false;
  private lastGpAction = false;
  private lastGpBack = false;

  public update(state: GameState, dt: number): void {
    const upPressed = state.input.isActionPressed("up");
    const downPressed = state.input.isActionPressed("down");
    const actionPressed = state.input.isActionPressed("action");

    const gamepad = this.getGamepad();
    const gpUp = this.isGamepadUp(gamepad);
    const gpDown = this.isGamepadDown(gamepad);
    const gpAction = this.isGamepadAction(gamepad);
    const gpBack = this.isGamepadBack(gamepad);

    const upJustPressed = (upPressed && !this.lastUpPressed) || (gpUp && !this.lastGpUp);
    const downJustPressed =
      (downPressed && !this.lastDownPressed) || (gpDown && !this.lastGpDown);
    const actionJustPressed =
      (actionPressed && !this.lastActionPressed) || (gpAction && !this.lastGpAction);
    const backJustPressed = gpBack && !this.lastGpBack;

    this.lastUpPressed = upPressed;
    this.lastDownPressed = downPressed;
    this.lastActionPressed = actionPressed;
    this.lastGpUp = gpUp;
    this.lastGpDown = gpDown;
    this.lastGpAction = gpAction;
    this.lastGpBack = gpBack;

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
    if (backJustPressed && state.dialog.open) {
      state.dialog.engine.close();
      state.dialog.open = false;
      state.dialog.activeId = null;
      state.dialog.ui.setVisible(false);
      state.dialog.ui.setText("");
      state.dialog.ui.setChoices([], () => undefined);
      this.selectedIndex = 0;
      return;
    }

    if (!state.dialog.open) {
      if (actionJustPressed && !state.menu.isOpen) {
        const nearest = this.findNearestNpc(state);
        if (nearest) {
          state.dialog.open = true;
          const dialogData = state.dialog.dialogs[nearest.dialogId];
          if (!dialogData) {
            state.dialog.open = false;
            return;
          }
          state.dialog.activeId = nearest.dialogId;
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

  private findNearestNpc(state: GameState): { dialogId: string } | null {
    let closest: { dialogId: string; dist: number } | null = null;
    for (const npc of state.npcs) {
      if (npc.mapId !== state.currentMapId) {
        continue;
      }
      const dx = state.player.pos.x - npc.entity.pos.x;
      const dy = state.player.pos.y - npc.entity.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 40 && (!closest || dist < closest.dist)) {
        closest = { dialogId: npc.dialogId, dist };
      }
    }
    return closest ? { dialogId: closest.dialogId } : null;
  }

  private getGamepad(): Gamepad | null {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (pad && pad.connected) {
        return pad;
      }
    }
    return null;
  }

  private isGamepadUp(pad: Gamepad | null): boolean {
    if (!pad) {
      return false;
    }
    const axis = pad.axes[1] ?? 0;
    return pad.buttons[12]?.pressed === true || axis < -0.6;
  }

  private isGamepadDown(pad: Gamepad | null): boolean {
    if (!pad) {
      return false;
    }
    const axis = pad.axes[1] ?? 0;
    return pad.buttons[13]?.pressed === true || axis > 0.6;
  }

  private isGamepadAction(pad: Gamepad | null): boolean {
    if (!pad) {
      return false;
    }
    return pad.buttons[0]?.pressed === true;
  }

  private isGamepadBack(pad: Gamepad | null): boolean {
    if (!pad) {
      return false;
    }
    return pad.buttons[1]?.pressed === true;
  }
}
