import * as PIXI from "pixi.js";
import type { GameState } from "../types";

const BORDER_DARK = 0x1a3a5c;
const BORDER_MID = 0x2d5a8c;
const BORDER_HI = 0x6ea8d0;
const PANEL_BG = 0x091422;

/** Draws an SNES-style bordered panel rectangle into a Graphics object. */
function drawSnesPanel(gfx: PIXI.Graphics, w: number, h: number, alpha = 0.88): void {
  gfx.clear();

  // Background fill
  gfx.rect(0, 0, w, h).fill({ color: PANEL_BG, alpha });

  // Outer border (dark)
  gfx.rect(0, 0, w, 2).fill(BORDER_DARK);           // top
  gfx.rect(0, h - 2, w, 2).fill(BORDER_DARK);       // bottom
  gfx.rect(0, 0, 2, h).fill(BORDER_DARK);           // left
  gfx.rect(w - 2, 0, 2, h).fill(BORDER_DARK);       // right

  // Inner border (medium)
  gfx.rect(2, 2, w - 4, 2).fill(BORDER_MID);        // top inner
  gfx.rect(2, h - 4, w - 4, 2).fill(BORDER_MID);   // bottom inner
  gfx.rect(2, 2, 2, h - 4).fill(BORDER_MID);        // left inner
  gfx.rect(w - 4, 2, 2, h - 4).fill(BORDER_MID);   // right inner

  // Highlight corners (bright accent pixel)
  gfx.rect(3, 3, 1, 1).fill(BORDER_HI);             // TL
  gfx.rect(w - 4, 3, 1, 1).fill(BORDER_HI);         // TR
  gfx.rect(3, h - 4, 1, 1).fill(BORDER_HI);         // BL
  gfx.rect(w - 4, h - 4, 1, 1).fill(BORDER_HI);    // BR
}

const SEGMENT_COUNT = 10;
const SEGMENT_GAP = 2;

/** Draws a segmented SNES-style HP bar (10 blocks). */
function drawSegmentedHpBar(
  gfx: PIXI.Graphics,
  x: number,
  y: number,
  barWidth: number,
  ratio: number,
  ghostRatio: number,
): void {
  const segW = Math.floor((barWidth - SEGMENT_GAP * (SEGMENT_COUNT - 1)) / SEGMENT_COUNT);
  const segH = 8;

  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const segX = x + i * (segW + SEGMENT_GAP);
    const threshold = (i + 1) / SEGMENT_COUNT;
    const halfThreshold = (i + 0.5) / SEGMENT_COUNT;

    let fillColor: number;
    let fillAlpha: number;

    if (ratio >= threshold) {
      // Full segment
      fillColor = ratio > 0.4 ? 0x22c55e : ratio > 0.2 ? 0xf59e0b : 0xef4444;
      fillAlpha = 0.95;
    } else if (ghostRatio >= halfThreshold) {
      // Ghost (grey partial segment)
      fillColor = 0x4b5563;
      fillAlpha = 0.7;
    } else {
      // Empty segment — dark outline only
      gfx.rect(segX, y, segW, segH).fill({ color: 0x0b1220, alpha: 0.8 });
      gfx.rect(segX, y, segW, 1).fill({ color: 0x1f2937, alpha: 0.9 });
      gfx.rect(segX, y + segH - 1, segW, 1).fill({ color: 0x1f2937, alpha: 0.9 });
      continue;
    }

    // Filled segment body
    gfx.rect(segX, y, segW, segH).fill({ color: fillColor, alpha: fillAlpha });
    // Top highlight pixel
    gfx.rect(segX, y, segW, 1).fill({ color: 0xffffff, alpha: 0.25 });
    // Bottom shadow pixel
    gfx.rect(segX, y + segH - 1, segW, 1).fill({ color: 0x000000, alpha: 0.3 });
  }
}

export class HUDSystem {
  public update(state: GameState, dt: number): void {
    this.layoutHud(state);
    this.updatePlayerHp(state, dt);
    this.updateChargeBar(state);
    this.updateRhythmIndicator(state);
    this.updateCombo(state, dt);
    this.updateEnemyLabels(state);
    this.updateTopRight(state);
  }

  private layoutHud(state: GameState): void {
    const padding = 12;
    const titleY = 10;
    state.hudTitle.position.set(padding, titleY);
    state.hudText.position.set(padding, titleY + state.hudTitle.height + 8);

    const hpTextY = state.hudText.position.y + state.hudText.height + 10;
    state.hudHpText.position.set(padding, hpTextY);

    const chargeLabelY = hpTextY + state.hudHpText.height + 28;
    state.chargeLabel.position.set(padding, chargeLabelY);

    const beatY = state.chargeLabel.position.y + state.chargeLabel.height + 16;
    state.hudBeatLabel.text = `Beat ${state.rhythm.bpm}`;
    state.hudBeatLabel.position.set(padding + 22, beatY - 2);
    state.hudBeatRing.position.set(padding + 8, beatY + 6);

    const elementY = beatY + state.hudBeatLabel.height + 10;
    state.element.hudIcon.position.set(padding + 4, elementY);

    const comboY = elementY + state.element.hudIcon.height + 8;
    state.combo.hudText.position.set(padding + 4, comboY);

    const contentWidth = Math.max(
      state.hudTitle.width,
      state.hudText.width,
      state.hudHpText.width,
      state.chargeLabel.width,
      state.hudBeatLabel.width + 22,
    );
    const hudWidth = Math.max(200, contentWidth + padding * 2);
    const hudHeight =
      state.combo.hudText.position.y + state.combo.hudText.height + padding;
    state.hud.setSize(hudWidth, hudHeight);

    drawSnesPanel(state.hudBg, state.hud.widthPx, state.hud.heightPx);

    const topPadding = 10;
    state.hudLevelText.position.set(12, topPadding);
    state.hudExpText.position.set(12, topPadding + state.hudLevelText.height + 6);
    const topHeight =
      state.hudExpText.position.y + state.hudExpText.height + topPadding;
    const topWidth = Math.max(
      160,
      Math.max(state.hudLevelText.width, state.hudExpText.width) + topPadding * 2,
    );
    state.hudTopRight.setSize(topWidth, topHeight);
    drawSnesPanel(state.hudTopRightBg, state.hudTopRight.widthPx, state.hudTopRight.heightPx);
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
    const x = 12;
    const y = state.hudHpText.position.y + state.hudHpText.height + 4;

    state.hudHpBar.clear();
    drawSegmentedHpBar(state.hudHpBar, x, y, barWidth, ratio, state.playerHpGhostRatio);

    state.hudHpText.text = `${hp}/${maxHp}`;
  }

  private updateChargeBar(state: GameState): void {
    const ratio = state.aim.chargeRatio;
    const barWidth = Math.max(120, state.hud.widthPx - 24);
    const barHeight = 8;
    const x = 12;
    const y = state.chargeLabel.position.y - barHeight - 4;

    state.chargeBar.clear();
    // Outer border
    state.chargeBar.rect(x, y, barWidth, barHeight).fill({ color: 0x0b1220, alpha: 0.8 });
    state.chargeBar.rect(x, y, barWidth, 1).fill({ color: 0x1f2937, alpha: 0.9 });

    if (ratio > 0) {
      const fillColor = ratio >= 1 ? 0xf97316 : 0x38bdf8;
      const fillW = Math.max(2, (barWidth - 2) * ratio);
      state.chargeBar.rect(x + 1, y + 1, fillW, barHeight - 2).fill({ color: fillColor, alpha: 0.95 });
      // Top highlight
      state.chargeBar.rect(x + 1, y + 1, fillW, 1).fill({ color: 0xffffff, alpha: 0.3 });
    }

    state.chargeLabel.text = ratio >= 1 ? "Charged" : "Charging";
  }

  private updateRhythmIndicator(state: GameState): void {
    const pulse = state.rhythm.pulse;
    const onBeat = state.rhythm.onBeat;
    const color = onBeat ? 0xfbbf24 : 0x38bdf8;
    state.hudBeatLabel.tint = onBeat ? 0xfef08a : 0x93c5fd;

    state.hudBeatRing.clear();

    // Pixel-art beat dot: filled square instead of circle
    const dotSize = onBeat ? 4 : 3;
    const alpha = 0.4 + pulse * 0.6;
    state.hudBeatRing.rect(-dotSize / 2, -dotSize / 2, dotSize, dotSize).fill({ color, alpha });

    // Expanding outer square on beat
    if (pulse > 0.05) {
      const outerSize = 8 + pulse * 10;
      state.hudBeatRing
        .rect(-outerSize / 2, -outerSize / 2, outerSize, 1).fill({ color, alpha: pulse * 0.7 });
      state.hudBeatRing
        .rect(-outerSize / 2, outerSize / 2 - 1, outerSize, 1).fill({ color, alpha: pulse * 0.7 });
      state.hudBeatRing
        .rect(-outerSize / 2, -outerSize / 2, 1, outerSize).fill({ color, alpha: pulse * 0.7 });
      state.hudBeatRing
        .rect(outerSize / 2 - 1, -outerSize / 2, 1, outerSize).fill({ color, alpha: pulse * 0.7 });
    }
  }

  private updateTopRight(state: GameState): void {
    state.hudLevelText.text = `LV ${state.playerData.stats.level}`;
    state.hudExpText.text = `EXP ${state.playerData.stats.exp}/${state.playerData.stats.expToNext}`;
  }

  private updateCombo(state: GameState, dt: number): void {
    void dt;
    const combo = state.combo;
    if (combo.count <= 1) {
      combo.hudText.visible = false;
      return;
    }
    combo.hudText.visible = true;
    const multStr = combo.multiplier > 1 ? ` x${combo.multiplier}` : "";
    combo.hudText.text = `${combo.count} hits${multStr}`;
    const scale = 1 + combo.hudPulse * 0.25;
    combo.hudText.scale.set(scale);
    combo.hudText.alpha = 0.6 + combo.hudPulse * 0.4;
    const tiers = combo.count >= 8 ? 0xfacc15 : combo.count >= 4 ? 0xfb923c : 0xf0f9ff;
    combo.hudText.tint = tiers;
  }

  private updateEnemyLabels(state: GameState): void {
    for (const enemy of state.enemies) {
      if (enemy.mapId !== state.currentMapId || enemy.dead) {
        enemy.label.visible = false;
        continue;
      }
      enemy.label.visible = true;
      enemy.label.position.set(
        Math.round(enemy.entity.pos.x),
        Math.round(enemy.entity.pos.y) - enemy.labelOffsetY,
      );
      enemy.label.text = `${enemy.name} ${enemy.hp}/${enemy.maxHp}`;
    }
  }
}
