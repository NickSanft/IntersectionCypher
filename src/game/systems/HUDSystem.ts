import type { GameState } from "../types";

export class HUDSystem {
  public update(state: GameState): void {
    this.updatePlayerHp(state);
    this.updateChargeBar(state);
    this.updateEnemyLabel(state);
  }

  private updatePlayerHp(state: GameState): void {
    const hp = state.playerData.stats.hp;
    const maxHp = state.playerData.stats.maxHp;
    const ratio = maxHp === 0 ? 0 : hp / maxHp;
    const barWidth = 180;
    const barHeight = 10;
    const x = 12;
    const y = 68;

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
    const y = 88;

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

  private updateEnemyLabel(state: GameState): void {
    const enemy = state.enemy;
    if (enemy.dead) {
      enemy.label.visible = false;
      return;
    }
    enemy.label.visible = true;
    enemy.label.position.set(enemy.entity.pos.x, enemy.entity.pos.y - enemy.labelOffsetY);
    enemy.label.text = `${enemy.name} ${enemy.hp}/${enemy.maxHp}`;
  }
}
