import * as PIXI from "pixi.js";
import type { GameState, ImpactParticlePoolEntry, HitMarkerPoolEntry } from "../types";

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

  private acquireImpactParticle(state: GameState): ImpactParticlePoolEntry {
    for (const entry of state.impactParticlePool) {
      if (!entry.inUse) {
        entry.inUse = true;
        return entry;
      }
    }
    const gfx = new PIXI.Graphics();
    const entry = { gfx, inUse: true };
    state.impactParticlePool.push(entry);
    return entry;
  }

  private acquireHitMarker(state: GameState): HitMarkerPoolEntry {
    for (const entry of state.hitMarkerPool) {
      if (!entry.inUse) {
        entry.inUse = true;
        return entry;
      }
    }
    const gfx = new PIXI.Graphics();
    const entry = { gfx, inUse: true };
    state.hitMarkerPool.push(entry);
    return entry;
  }

  private spawnImpactFx(state: GameState, x: number, y: number): void {
    for (let i = 0; i < 6; i += 1) {
      const particle = this.acquireImpactParticle(state);
      particle.gfx.clear();
      particle.gfx.beginFill(0xfbbf24, 0.9);
      particle.gfx.drawCircle(0, 0, 2);
      particle.gfx.endFill();
      particle.gfx.position.set(x, y);
      particle.gfx.alpha = 1;
      particle.gfx.visible = true;
      if (!state.world.children.includes(particle.gfx)) {
        state.world.addChild(particle.gfx);
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      state.impactParticles.push({
        gfx: particle.gfx,
        life: 0.3,
        velX: Math.cos(angle) * speed,
        velY: Math.sin(angle) * speed,
        pool: particle,
      });
    }

    const marker = this.acquireHitMarker(state);
    marker.gfx.clear();
    marker.gfx.lineStyle(2, 0xfef08a, 0.9);
    marker.gfx.moveTo(-5, 0);
    marker.gfx.lineTo(5, 0);
    marker.gfx.moveTo(0, -5);
    marker.gfx.lineTo(0, 5);
    marker.gfx.position.set(x, y);
    marker.gfx.alpha = 1;
    marker.gfx.visible = true;
    if (!state.world.children.includes(marker.gfx)) {
      state.world.addChild(marker.gfx);
    }
    state.hitMarkers.push({ gfx: marker.gfx, life: 0.2, pool: marker });

    state.hitStopTimer = state.hitStopDuration;
  }

  public update(state: GameState, dt: number): void {
    if (state.levelUp.active) {
      return;
    }
    if (state.playerHitTimer > 0) {
      state.playerHitTimer -= dt;
      if (state.playerHitTimer <= 0) {
        state.player.sprite.tint = 0xffffff;
      }
    }

    for (const enemy of state.enemies) {
      if (enemy.mapId !== state.currentMapId) {
        continue;
      }
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
          enemy.expGranted = false;
          enemy.hp = enemy.maxHp;
          const visible = enemy.mapId === state.currentMapId;
          enemy.entity.visible = visible;
          enemy.hpBar.visible = visible;
          enemy.label.visible = visible;
          enemy.entity.sprite.tint = 0xffffff;
          this.drawEnemyHp(enemy);
        }
      }
    }

    for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
      const entry = state.projectiles[i];
      entry.projectile.update(dt, state.map);
      entry.projectile.renderUpdate();
      entry.life -= dt;

      for (const enemy of state.enemies) {
        if (enemy.mapId !== state.currentMapId || enemy.dead) {
          continue;
        }
        const dx = entry.projectile.entity.pos.x - enemy.entity.pos.x;
        const dy = entry.projectile.entity.pos.y - enemy.entity.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= enemy.radius + entry.projectile.radius) {
          enemy.entity.sprite.tint = 0xffc2c2;
          enemy.hitTimer = enemy.hitFlashSeconds;
          enemy.hp = Math.max(0, enemy.hp - entry.damage);
          if (enemy.hp === 0 && !enemy.expGranted) {
            enemy.dead = true;
            enemy.entity.visible = false;
            enemy.respawnTimer = enemy.respawnSeconds;
            enemy.expGranted = true;
            state.levelUpSystem.addExperience(state, 5);
          }
          this.drawEnemyHp(enemy);
          this.spawnImpactFx(state, enemy.entity.pos.x, enemy.entity.pos.y);

          const damagePoolEntry = this.acquireDamageText(state);
          damagePoolEntry.text.text = `-${entry.damage}`;
          damagePoolEntry.text.position.set(enemy.entity.pos.x, enemy.entity.pos.y - 36);
          damagePoolEntry.text.alpha = 1;
          damagePoolEntry.text.visible = true;
          if (!state.world.children.includes(damagePoolEntry.text)) {
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
          break;
        }
      }

      if (entry.life <= 0) {
        entry.pool.inUse = false;
        entry.projectile.entity.visible = false;
        state.world.removeChild(entry.projectile.entity);
        state.projectiles.splice(i, 1);
      }
    }

    for (let i = state.enemyProjectiles.length - 1; i >= 0; i -= 1) {
      const entry = state.enemyProjectiles[i];
      entry.projectile.update(dt, state.map);
      entry.projectile.renderUpdate();
      entry.life -= dt;

      const dx = state.player.pos.x - entry.projectile.entity.pos.x;
      const dy = state.player.pos.y - entry.projectile.entity.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= state.playerRadius + entry.projectile.radius) {
        state.player.sprite.tint = 0xfca5a5;
        state.playerHitTimer = 0.2;
        const damage = Math.max(0, entry.damage * state.playerDamageMult);
        state.playerData.stats.hp = Math.max(0, state.playerData.stats.hp - damage);
        state.camera.shakeTime = Math.max(state.camera.shakeTime, 0.12);
        state.camera.shakeAmp = Math.max(state.camera.shakeAmp, 5);
        const nx = dist === 0 ? 0 : dx / dist;
        const ny = dist === 0 ? 0 : dy / dist;
        const knockback = 260;
        state.player.vel.x = nx * knockback;
        state.player.vel.y = ny * knockback;
        state.playerKnockbackTimer = 0.2;
        this.spawnImpactFx(state, state.player.pos.x, state.player.pos.y);

        entry.pool.inUse = false;
        entry.projectile.entity.visible = false;
        state.world.removeChild(entry.projectile.entity);
        state.enemyProjectiles.splice(i, 1);
        continue;
      }

      if (entry.life <= 0) {
        entry.pool.inUse = false;
        entry.projectile.entity.visible = false;
        state.world.removeChild(entry.projectile.entity);
        state.enemyProjectiles.splice(i, 1);
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

    for (const enemy of state.enemies) {
      if (enemy.mapId !== state.currentMapId) {
        continue;
      }
      if (!enemy.dead) {
        this.drawEnemyHp(enemy);
      }
    }
  }

  private drawEnemyHp(enemy: GameState["enemies"][number]): void {
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
