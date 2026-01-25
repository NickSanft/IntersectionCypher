import type { GameState } from "../types";

export class HUDSystem {
  public update(state: GameState): void {
    this.updateChargeBar(state);
    this.updateEnemyLabel(state);
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
