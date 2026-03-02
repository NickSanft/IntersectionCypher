import type { GameState } from "../types";

export class HUDSystem {
  public update(state: GameState, dt: number): void {
    this.layoutHud(state);
    this.updatePlayerHp(state, dt);
    this.updateChargeBar(state);
    this.updateRhythmIndicator(state);
    this.updateEnemyLabels(state);
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

    const beatY = state.chargeLabel.position.y + state.chargeLabel.height + 14;
    state.hudBeatLabel.text = `Beat ${state.rhythm.bpm}`;
    state.hudBeatLabel.position.set(padding + 22, beatY - 2);
    state.hudBeatRing.position.set(padding + 8, beatY + 6);

    const contentWidth = Math.max(
      state.hudTitle.width,
      state.hudText.width,
      state.hudHpText.width,
      state.chargeLabel.width,
      state.hudBeatLabel.width + 22
    );
    const hudWidth = Math.max(200, contentWidth + padding * 2);
    const hudHeight =
      state.hudBeatLabel.position.y + state.hudBeatLabel.height + padding;
    state.hud.setSize(hudWidth, hudHeight);

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
    const topWidth = Math.max(
      160,
      Math.max(state.hudLevelText.width, state.hudExpText.width) + topPadding * 2
    );
    state.hudTopRight.setSize(topWidth, topHeight);

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

  private updatePlayerHp(state: GameState, dt: number): void {
    const hp = state.playerData.stats.hp;
    const maxHp = state.playerData.stats.maxHp;
    const ratio = maxHp === 0 ? 0 : hp / maxHp;

    // Decay ghost ratio toward real ratio
    if (state.playerHpGhostRatio > ratio) {
      state.playerHpGhostRatio = Math.max(ratio, state.playerHpGhostRatio - 0.4 * dt);
    } else {
      state.playerHpGhostRatio = ratio;
    }

    const barWidth = Math.max(120, state.hud.widthPx - 24);
    const barHeight = 10;
    const x = 12;
    const y = state.hudHpText.position.y + state.hudHpText.height + 4;

    state.hudHpBar.clear();
    state.hudHpBar.beginFill(0x0b1220, 0.8);
    state.hudHpBar.lineStyle(1, 0x1f2937, 1);
    state.hudHpBar.drawRoundedRect(x, y, barWidth, barHeight, 4);
    state.hudHpBar.endFill();

    // Ghost bar (orange, behind green)
    if (state.playerHpGhostRatio > ratio) {
      state.hudHpBar.beginFill(0xf97316, 0.55);
      state.hudHpBar.drawRoundedRect(
        x + 1,
        y + 1,
        Math.max(2, (barWidth - 2) * state.playerHpGhostRatio),
        barHeight - 2,
        3
      );
      state.hudHpBar.endFill();
    }

    // Real HP bar
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
    const barWidth = Math.max(120, state.hud.widthPx - 24);
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

  private updateRhythmIndicator(state: GameState): void {
    const pulse = state.rhythm.pulse;
    const color = state.rhythm.onBeat ? 0xfbbf24 : 0x38bdf8;
    const innerAlpha = 0.35 + pulse * 0.45;
    state.hudBeatLabel.tint = state.rhythm.onBeat ? 0xfef08a : 0x93c5fd;

    state.hudBeatRing.clear();

    // Static inner ring
    state.hudBeatRing.lineStyle(1.5, color, innerAlpha);
    state.hudBeatRing.drawCircle(0, 0, 5);

    // Filled center dot
    state.hudBeatRing.beginFill(color, innerAlpha);
    state.hudBeatRing.drawCircle(0, 0, state.rhythm.onBeat ? 3.5 : 2.5);
    state.hudBeatRing.endFill();

    // Expanding outer ring on beat pulse
    if (pulse > 0.01) {
      const outerRadius = 5 + pulse * 9;
      state.hudBeatRing.lineStyle(2, color, pulse * 0.8);
      state.hudBeatRing.drawCircle(0, 0, outerRadius);
    }
  }

  private updateTopRight(state: GameState): void {
    state.hudLevelText.text = `LV ${state.playerData.stats.level}`;
    state.hudExpText.text = `EXP ${state.playerData.stats.exp}/${state.playerData.stats.expToNext}`;
  }

  private updateEnemyLabels(state: GameState): void {
    for (const enemy of state.enemies) {
      if (enemy.mapId !== state.currentMapId || enemy.dead) {
        enemy.label.visible = false;
        continue;
      }
      enemy.label.visible = true;
      enemy.label.position.set(
        enemy.entity.pos.x,
        enemy.entity.pos.y - enemy.labelOffsetY
      );
      enemy.label.text = `${enemy.name} ${enemy.hp}/${enemy.maxHp}`;
    }
  }
}
