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
    this.updateLowHpPulse(state, dt);
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
    state.hudAccuracyText.position.set(12, state.hudExpText.position.y + state.hudExpText.height + 6);
    state.hudKillText.position.set(12, state.hudAccuracyText.position.y + state.hudAccuracyText.height + 6);
    const topHeight =
      state.hudKillText.position.y + state.hudKillText.height + topPadding;
    const topWidth = Math.max(
      160,
      Math.max(state.hudLevelText.width, state.hudExpText.width, state.hudAccuracyText.width, state.hudKillText.width) + topPadding * 2,
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
    const tempoBurstActive = state.tempoBurstBeatsLeft > 0;
    const color = tempoBurstActive ? 0xfde047 : onBeat ? 0xfbbf24 : 0x38bdf8;
    state.hudBeatLabel.tint = tempoBurstActive ? 0xfde047 : onBeat ? 0xfef08a : 0x93c5fd;

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
    state.hudKillText.text = `KL:${state.killCount}`;

    const total = state.rhythm.shotsTotal;
    const onBeat = state.rhythm.shotsOnBeat;
    const ratio = total === 0 ? -1 : onBeat / total;
    let grade: string;
    if (ratio < 0) grade = "-";
    else if (ratio >= 0.9) grade = "S";
    else if (ratio >= 0.75) grade = "A";
    else if (ratio >= 0.6) grade = "B";
    else if (ratio >= 0.4) grade = "C";
    else grade = "D";
    state.hudAccuracyText.text = `Acc:${grade}`;

    const gradeColor =
      grade === "S" ? 0xfacc15 :
      grade === "A" ? 0x4ade80 :
      grade === "B" ? 0x38bdf8 :
      grade === "C" ? 0xfb923c :
      grade === "D" ? 0xef4444 : 0x9ca3af;
    state.hudAccuracyText.tint = gradeColor;
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

    // Expiry warning: flash at 8 Hz when less than 1 second left on combo timer
    const expiring = combo.resetTimer > 0 && combo.resetTimer < 1.0;
    if (expiring) {
      combo.hudText.alpha = Math.floor(combo.resetTimer * 8) % 2 === 0 ? 1.0 : 0.2;
    } else {
      combo.hudText.alpha = 0.6 + combo.hudPulse * 0.4;
    }

    const tiers = combo.count >= 8 ? 0xfacc15 : combo.count >= 4 ? 0xfb923c : 0xf0f9ff;
    combo.hudText.tint = expiring ? 0xff4444 : tiers;
  }

  private updateLowHpPulse(state: GameState, dt: number): void {
    void dt;
    const hp = state.playerData.stats.hp;
    const maxHp = state.playerData.stats.maxHp;
    const ratio = maxHp === 0 ? 0 : hp / maxHp;
    const pulse = state.lowHpPulseGfx;

    if (ratio > 0.3 || maxHp === 0) {
      pulse.visible = false;
      return;
    }

    pulse.visible = true;
    // Pulse at ~1.5 Hz, amplitude increases as HP drops
    const danger = 1 - ratio / 0.3; // 0 at 30% HP, 1 at 0 HP
    const pulseSin = (Math.sin(state.rhythm.totalTime * Math.PI * 3) + 1) / 2;
    const alpha = 0.08 + pulseSin * 0.18 * danger;
    const w = state.app.screen.width;
    const h = state.app.screen.height;
    const edgeW = Math.floor(w * 0.06);
    const edgeH = Math.floor(h * 0.06);

    pulse.clear();
    // Four edge bars — red danger vignette
    pulse.rect(0, 0, w, edgeH).fill({ color: 0xff0000, alpha });
    pulse.rect(0, h - edgeH, w, edgeH).fill({ color: 0xff0000, alpha });
    pulse.rect(0, edgeH, edgeW, h - edgeH * 2).fill({ color: 0xff0000, alpha });
    pulse.rect(w - edgeW, edgeH, edgeW, h - edgeH * 2).fill({ color: 0xff0000, alpha });
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
      const elemPrefix =
        enemy.element === "Heat" ? "[H] " :
        enemy.element === "Wave" ? "[W] " : "";
      enemy.label.text = `${elemPrefix}${enemy.name} ${enemy.hp}/${enemy.maxHp}`;
      enemy.label.tint =
        enemy.element === "Heat" ? 0xfb923c :
        enemy.element === "Wave" ? 0x38bdf8 : 0xfbbf24;
    }
  }
}
