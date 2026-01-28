import type { GameState, TriggerState } from "../types";

export class TriggerSystem {
  private lastActionPressed = false;

  public update(state: GameState): void {
    const actionPressed = state.input.isActionPressed("action");
    const actionJustPressed = actionPressed && !this.lastActionPressed;
    this.lastActionPressed = actionPressed;

    if (state.dialog.open || state.menu.isOpen || state.levelUp.active) {
      state.triggerPrompt.visible = false;
      return;
    }

    const active = this.findActiveTrigger(state);
    if (!active) {
      state.triggerPrompt.visible = false;
      return;
    }

    this.updatePrompt(state, active);

    if (actionJustPressed) {
      this.activateTrigger(state, active);
    }
  }

  private findActiveTrigger(state: GameState): TriggerState | null {
    const px = state.player.pos.x;
    const py = state.player.pos.y;
    for (const trigger of state.triggers) {
      if (trigger.mapId !== state.currentMapId) {
        continue;
      }
      if (trigger.once && trigger.triggered) {
        continue;
      }
      if (px >= trigger.xMin && px <= trigger.xMax && py >= trigger.yMin && py <= trigger.yMax) {
        return trigger;
      }
    }
    return null;
  }

  private updatePrompt(state: GameState, trigger: TriggerState): void {
    state.triggerPrompt.visible = true;
    state.triggerPromptText.text = trigger.prompt;
    const padding = 10;
    const width = state.triggerPromptText.width + padding * 2;
    const height = state.triggerPromptText.height + padding * 2;
    state.triggerPrompt.setSize(width, height);
    state.triggerPromptBg.clear();
    state.triggerPromptBg.beginFill(0x0f1720, 0.85);
    state.triggerPromptBg.lineStyle(1, 0x2b3440, 1);
    state.triggerPromptBg.drawRoundedRect(0, 0, width, height, 6);
    state.triggerPromptBg.endFill();
    state.triggerPromptText.position.set(width * 0.5, height * 0.5);
  }

  private activateTrigger(state: GameState, trigger: TriggerState): void {
    if (trigger.type === "checkpoint") {
      state.checkpoint = {
        mapId: state.currentMapId,
        x: state.player.pos.x,
        y: state.player.pos.y,
      };
    }

    if (trigger.rewards) {
      if (trigger.rewards.credits) {
        state.playerData.credits += trigger.rewards.credits;
      }
      if (trigger.rewards.items && trigger.rewards.items.length > 0) {
        state.playerData.inventory.push(...trigger.rewards.items);
      }
      if (trigger.rewards.flags) {
        for (const flag of trigger.rewards.flags) {
          state.playerData.questFlags[flag] = true;
        }
      }
    }

    if (trigger.onTrigger) {
      trigger.onTrigger(state);
    }

    if (trigger.dialogId) {
      this.openDialog(state, trigger.dialogId);
    }

    if (trigger.once) {
      trigger.triggered = true;
      trigger.view.alpha = 0.4;
    }
  }

  private openDialog(state: GameState, dialogId: string): void {
    const dialogData = state.dialog.dialogs[dialogId];
    if (!dialogData) {
      return;
    }
    state.dialog.open = true;
    state.dialog.activeId = dialogId;
    state.dialog.engine.setData(dialogData);
    state.dialog.engine.start();
    state.dialog.ui.setVisible(true);
    state.dialog.charIndex = 0;
    state.dialog.charTimer = 0;
    state.dialog.ui.setText("");
    state.dialog.ui.setChoices([], () => undefined);
    state.aim.chargeActive = false;
  }
}
