import type { GameState } from "../types";

export class HUDSystem {
  public update(state: GameState): void {
    this.layoutHud(state);
    this.updatePlayerHp(state);
    this.updateChargeBar(state);
    this.updateEnemyLabel(state);
    this.updateTopRight(state);
  }

  private layoutHud(state: GameState): void {
    const padding = 12;
    const titleY = 8;
    state.hudTitle.position.set(padding, titleY);
    state.hudText.position.set(padding, titleY + state.hudTitle.height + 6);

    const hpTextY = state.hudText.position.y + state.hudText.height + 8;
    state.hudHpText.position.set(padding, hpTextY);

    const chargeLabelY = hpTextY + state.hudHpText.height + 24;
    state.chargeLabel.position.set(padding, chargeLabelY);

    const hudHeight =
      state.chargeLabel.position.y + state.chargeLabel.height + padding;
    state.hud.setSize(state.hud.widthPx, hudHeight);

    state.hudBg.clear();
    state.hudBg.beginFill(0x0f1720, 0.7);
    state.hudBg.lineStyle(1, 0x2b3440, 1);
    state.hudBg.drawRoundedRect(0, 0, state.hud.widthPx, state.hud.heightPx, 8);
    state.hudBg.endFill();

    const topPadding = 10;
    state.hudLevelText.position.set(12, topPadding);
    state.hudExpText.position.set(12, topPadding + state.hudLevelText.height + 6);
    const topHeight =
      state.hudExpText.position.y + state.hudExpText.height + topPadding;
    state.hudTopRight.setSize(state.hudTopRight.widthPx, topHeight);

    state.hudTopRightBg.clear();
    state.hudTopRightBg.beginFill(0x0f1720, 0.7);
    state.hudTopRightBg.lineStyle(1, 0x2b3440, 1);
    state.hudTopRightBg.drawRoundedRect(
      0,
      0,
      state.hudTopRight.widthPx,
      state.hudTopRight.heightPx,
      8
    );
    state.hudTopRightBg.endFill();
  }

  private updatePlayerHp(state: GameState): void {
    const hp = state.playerData.stats.hp;
    const maxHp = state.playerData.stats.maxHp;
    const ratio = maxHp === 0 ? 0 : hp / maxHp;
    const barWidth = 180;
    const barHeight = 10;
    const x = 12;
    const y = state.hudHpText.position.y + state.hudHpText.height + 4;

    state.hudHpBar.clear();
    state.hudHpBar.beginFill(0x0b1220, 0.8);
    state.hudHpBar.lineStyle(1, 0x1f2937, 1);
    state.hudHpBar.drawRoundedRect(x, y, barWidth, barHeight, 4);
    state.hudHpBar.endFill();

    state.hudHpBar.beginFill(0x22c55e, 0.95);
    state.hudHpBar.drawRoundedRect(
      x + 1,
      y + 1,
      Math.max(2, (barWidth - 2) * ratio),
      barHeight - 2,
      3
    );
    state.hudHpBar.endFill();

    state.hudHpText.text = `${hp}/${maxHp}`;
  }

  private updateChargeBar(state: GameState): void {
    const ratio = state.aim.chargeRatio;
    const barWidth = 180;
    const barHeight = 10;
    const x = 12;
    const y = state.chargeLabel.position.y - barHeight - 4;

    state.chargeBar.clear();
    state.chargeBar.beginFill(0x0b1220, 0.8);
    state.chargeBar.lineStyle(1, 0x1f2937, 1);
    state.chargeBar.drawRoundedRect(x, y, barWidth, barHeight, 4);
    state.chargeBar.endFill();

    const fillColor = ratio >= 1 ? 0xf97316 : 0x38bdf8;
    state.chargeBar.beginFill(fillColor, 0.95);
    state.chargeBar.drawRoundedRect(
      x + 1,
      y + 1,
      Math.max(2, (barWidth - 2) * ratio),
      barHeight - 2,
      3
    );
    state.chargeBar.endFill();

    state.chargeLabel.text = ratio >= 1 ? "Charged" : "Charging";
  }

  private updateTopRight(state: GameState): void {
    state.hudLevelText.text = `LV ${state.playerData.stats.level}`;
    state.hudExpText.text = `EXP ${state.playerData.stats.exp}/${state.playerData.stats.expToNext}`;
  }

  private updateEnemyLabel(state: GameState): void {
    const enemy = state.enemy;
    if (state.currentMapId !== state.enemyMapId || enemy.dead) {
      enemy.label.visible = false;
      return;
    }
    enemy.label.visible = true;
    enemy.label.position.set(enemy.entity.pos.x, enemy.entity.pos.y - enemy.labelOffsetY);
    enemy.label.text = `${enemy.name} ${enemy.hp}/${enemy.maxHp}`;
  }
}
