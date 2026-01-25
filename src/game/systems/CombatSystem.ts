import * as PIXI from "pixi.js";
import type { GameState } from "../types";

export class CombatSystem {
  private acquireDamageText(state: GameState): GameState["damageTextPool"][number] {
    for (const entry of state.damageTextPool) {
      if (!entry.inUse) {
        entry.inUse = true;
        return entry;
      }
    }

    const text = new PIXI.Text({
      text: "",
      style: {
        fill: 0xf97316,
        fontFamily: "Arial",
        fontSize: 14,
        fontWeight: "700",
      },
    });
    text.anchor.set(0.5);
    const entry = { text, inUse: true };
    state.damageTextPool.push(entry);
    return entry;
  }

  public update(state: GameState, dt: number): void {
    const enemy = state.enemy;

    if (!enemy.dead && enemy.hitTimer > 0) {
      enemy.hitTimer -= dt;
      if (enemy.hitTimer <= 0) {
        enemy.entity.sprite.tint = 0xffffff;
      }
    }

    if (enemy.dead) {
      enemy.respawnTimer -= dt;
      if (enemy.respawnTimer <= 0) {
        enemy.dead = false;
        enemy.hp = enemy.maxHp;
        enemy.entity.visible = true;
        enemy.entity.sprite.tint = 0xffffff;
        this.drawEnemyHp(enemy);
      }
    }

    for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
      const entry = state.projectiles[i];
      entry.projectile.update(dt, state.map);
      entry.projectile.renderUpdate();
      entry.life -= dt;

      if (!enemy.dead) {
        const dx = entry.projectile.entity.pos.x - enemy.entity.pos.x;
        const dy = entry.projectile.entity.pos.y - enemy.entity.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= enemy.radius + entry.projectile.radius) {
          enemy.entity.sprite.tint = 0xffc2c2;
          enemy.hitTimer = enemy.hitFlashSeconds;
          enemy.hp = Math.max(0, enemy.hp - entry.damage);
          if (enemy.hp === 0) {
            enemy.dead = true;
            enemy.entity.visible = false;
            enemy.respawnTimer = enemy.respawnSeconds;
          }
          this.drawEnemyHp(enemy);

          const damagePoolEntry = this.acquireDamageText(state);
          damagePoolEntry.text.text = `-${entry.damage}`;
          damagePoolEntry.text.position.set(enemy.entity.pos.x, enemy.entity.pos.y - 36);
          damagePoolEntry.text.alpha = 1;
          damagePoolEntry.text.visible = true;
          if (!state.app.stage.children.includes(damagePoolEntry.text)) {
          state.world.addChild(damagePoolEntry.text);
          }
          state.damageTexts.push({
            text: damagePoolEntry.text,
            life: 0.6,
            velY: -20,
            pool: damagePoolEntry,
          });

          entry.pool.inUse = false;
          entry.projectile.entity.visible = false;
          state.world.removeChild(entry.projectile.entity);
          state.camera.shakeTime = Math.max(state.camera.shakeTime, 0.12);
          state.camera.shakeAmp = Math.max(state.camera.shakeAmp, 6);
          state.projectiles.splice(i, 1);
          continue;
        }
      }

      if (entry.life <= 0) {
        entry.pool.inUse = false;
        entry.projectile.entity.visible = false;
        state.world.removeChild(entry.projectile.entity);
        state.projectiles.splice(i, 1);
      }
    }

    for (let i = state.damageTexts.length - 1; i >= 0; i -= 1) {
      const entry = state.damageTexts[i];
      entry.life -= dt;
      entry.text.alpha = Math.max(0, entry.life / 0.6);
      entry.text.position.y += entry.velY * dt;
      if (entry.life <= 0) {
        entry.pool.inUse = false;
        entry.text.visible = false;
        state.world.removeChild(entry.text);
        state.damageTexts.splice(i, 1);
      }
    }

    if (!enemy.dead) {
      this.drawEnemyHp(enemy);
    }
  }

  private drawEnemyHp(enemy: GameState["enemy"]): void {
    enemy.hpBar.clear();
    if (enemy.dead) {
      return;
    }
    const barWidth = 40;
    const barHeight = 6;
    const x = enemy.entity.pos.x - barWidth / 2;
    const y = enemy.entity.pos.y - 28;
    enemy.hpBar.beginFill(0x111827, 0.9);
    enemy.hpBar.drawRoundedRect(x, y, barWidth, barHeight, 3);
    enemy.hpBar.endFill();

    const ratio = Math.max(0, enemy.hp) / enemy.maxHp;
    enemy.hpBar.beginFill(0x22c55e, 0.95);
    enemy.hpBar.drawRoundedRect(
      x + 1,
      y + 1,
      (barWidth - 2) * ratio,
      barHeight - 2,
      2
    );
    enemy.hpBar.endFill();
  }
}
