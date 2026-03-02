import * as PIXI from "pixi.js";
import type { Element, GameState, ImpactParticlePoolEntry, HitMarkerPoolEntry, ImpactRingPoolEntry } from "../types";

const ELEMENT_COLORS: Record<Element, number> = {
  Neutral: 0xfbbf24,
  Heat: 0xf97316,
  Wave: 0x38bdf8,
};

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
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 10,
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

  private acquireImpactRing(state: GameState): ImpactRingPoolEntry {
    for (const entry of state.impactRingPool) {
      if (!entry.inUse) {
        entry.inUse = true;
        return entry;
      }
    }
    const gfx = new PIXI.Graphics();
    const entry = { gfx, inUse: true };
    state.impactRingPool.push(entry);
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

  private spawnImpactFx(
    state: GameState,
    x: number,
    y: number,
    color: number,
    markerColor: number,
    isCharged = false
  ): void {
    // Pixel-art impact particles: small square sparks instead of circles
    const particleCount = isCharged ? 10 : 5;
    const particleSize = isCharged ? 4 : 2;
    for (let i = 0; i < particleCount; i += 1) {
      const particle = this.acquireImpactParticle(state);
      particle.gfx.clear();
      // Draw a pixel-cross spark
      particle.gfx.rect(-particleSize / 2, -1, particleSize, 2).fill({ color, alpha: 0.9 });
      particle.gfx.rect(-1, -particleSize / 2, 2, particleSize).fill({ color, alpha: 0.9 });
      particle.gfx.position.set(Math.round(x), Math.round(y));
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

    // SNES-style hit marker: pixel cross
    const marker = this.acquireHitMarker(state);
    const mSize = isCharged ? 8 : 5;
    marker.gfx.clear();
    marker.gfx.rect(-mSize, -1, mSize * 2, 2).fill({ color: markerColor, alpha: 0.95 });
    marker.gfx.rect(-1, -mSize, 2, mSize * 2).fill({ color: markerColor, alpha: 0.95 });
    // Corner dots
    marker.gfx.rect(-mSize, -mSize, 2, 2).fill({ color: markerColor, alpha: 0.7 });
    marker.gfx.rect(mSize - 2, -mSize, 2, 2).fill({ color: markerColor, alpha: 0.7 });
    marker.gfx.rect(-mSize, mSize - 2, 2, 2).fill({ color: markerColor, alpha: 0.7 });
    marker.gfx.rect(mSize - 2, mSize - 2, 2, 2).fill({ color: markerColor, alpha: 0.7 });
    marker.gfx.position.set(Math.round(x), Math.round(y));
    marker.gfx.alpha = 1;
    marker.gfx.visible = true;
    if (!state.world.children.includes(marker.gfx)) {
      state.world.addChild(marker.gfx);
    }
    state.hitMarkers.push({ gfx: marker.gfx, life: 0.2, pool: marker });

    const ring = this.acquireImpactRing(state);
    const ringDuration = 0.35;
    ring.gfx.position.set(x, y);
    ring.gfx.visible = true;
    if (!state.world.children.includes(ring.gfx)) {
      state.world.addChild(ring.gfx);
    }
    state.impactRings.push({
      gfx: ring.gfx,
      life: ringDuration,
      duration: ringDuration,
      maxRadius: isCharged ? 42 : 28,
      color,
      pool: ring,
    });

    state.hitStopTimer = state.hitStopDuration;
  }

  public update(state: GameState, dt: number): void {
    if (state.levelUp.active) {
      return;
    }

    // Combo decay
    if (state.combo.resetTimer > 0) {
      state.combo.resetTimer -= dt;
      if (state.combo.resetTimer <= 0) {
        state.combo.count = 0;
        state.combo.multiplier = 1;
      }
    }
    if (state.combo.hudPulse > 0) {
      state.combo.hudPulse = Math.max(0, state.combo.hudPulse - dt * 5);
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
          if (enemy.shieldGfx) {
            enemy.shieldGfx.visible = visible;
          }
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
      if (entry.projectile.bounced) {
        entry.bouncesRemaining -= 1;
      }

      for (const enemy of state.enemies) {
        if (enemy.mapId !== state.currentMapId || enemy.dead) {
          continue;
        }
        const dx = entry.projectile.entity.pos.x - enemy.entity.pos.x;
        const dy = entry.projectile.entity.pos.y - enemy.entity.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= enemy.radius + entry.projectile.radius) {
          // Shield block check
          if (
            enemy.type === "shield" &&
            (enemy.shieldArcDeg ?? 0) > 0 &&
            enemy.shieldAngle !== undefined
          ) {
            const vx = entry.projectile.entity.vel.x;
            const vy = entry.projectile.entity.vel.y;
            const isElementMatch = entry.element !== "Neutral" && entry.element === enemy.element;
            if (!isElementMatch) {
              // Check if shot arrives from the shielded direction
              const projAngle = Math.atan2(vy, vx);
              let diff = projAngle - (enemy.shieldAngle + Math.PI);
              while (diff > Math.PI) diff -= 2 * Math.PI;
              while (diff < -Math.PI) diff += 2 * Math.PI;
              const arcHalf = ((enemy.shieldArcDeg ?? 120) / 2) * (Math.PI / 180);
              if (Math.abs(diff) <= arcHalf) {
                // Reflect off the shield normal
                const nx = Math.cos(enemy.shieldAngle);
                const ny = Math.sin(enemy.shieldAngle);
                const dot = vx * nx + vy * ny;
                entry.projectile.entity.vel.x = vx - 2 * dot * nx;
                entry.projectile.entity.vel.y = vy - 2 * dot * ny;
                // Push shot out of collision zone
                entry.projectile.entity.pos.x += nx * (enemy.radius + entry.projectile.radius + 2);
                entry.projectile.entity.pos.y += ny * (enemy.radius + entry.projectile.radius + 2);
                enemy.entity.sprite.tint = 0x88ccff;
                enemy.hitTimer = 0.08;
                continue; // deflected — no damage
              }
            }
          }

          const elementMatch = entry.element !== "Neutral" && entry.element === enemy.element;
          const elementBonus = elementMatch ? 1.5 : 1;
          const comboBonus = state.combo.multiplier;
          const finalDamage = Math.max(1, Math.round(entry.damage * elementBonus * comboBonus));
          enemy.entity.sprite.tint = 0xffc2c2;
          enemy.hitTimer = enemy.hitFlashSeconds;
          enemy.hp = Math.max(0, enemy.hp - finalDamage);
          if (enemy.hp === 0 && !enemy.expGranted) {
            enemy.dead = true;
            enemy.entity.visible = false;
            if (enemy.shieldGfx) {
              enemy.shieldGfx.clear();
              enemy.shieldGfx.visible = false;
            }
            enemy.respawnTimer = enemy.respawnSeconds;
            enemy.expGranted = true;
            state.levelUpSystem.addExperience(state, 5);
          }
          this.drawEnemyHp(enemy);

          // Combo
          state.combo.count += 1;
          state.combo.resetTimer = 4;
          state.combo.multiplier = state.combo.count >= 8 ? 2 : state.combo.count >= 4 ? 1.5 : 1;
          state.combo.hudPulse = 1;

          const onBeat = entry.onBeat;
          const impactColor = elementMatch
            ? ELEMENT_COLORS[entry.element]
            : onBeat ? 0xfacc15 : 0xfbbf24;
          const markerColor = elementMatch
            ? ELEMENT_COLORS[entry.element]
            : onBeat ? 0xfde047 : 0xfef08a;
          this.spawnImpactFx(state, enemy.entity.pos.x, enemy.entity.pos.y, impactColor, markerColor, entry.isCharged);

          const damagePoolEntry = this.acquireDamageText(state);
          damagePoolEntry.text.text = `-${finalDamage}`;
          damagePoolEntry.text.style.fill = elementMatch
            ? ELEMENT_COLORS[entry.element]
            : onBeat ? 0xfacc15 : 0xf97316;
          damagePoolEntry.text.position.set(enemy.entity.pos.x, enemy.entity.pos.y - 36);
          damagePoolEntry.text.alpha = 1;
          damagePoolEntry.text.visible = true;
          if (!state.world.children.includes(damagePoolEntry.text)) {
            state.world.addChild(damagePoolEntry.text);
          }
          damagePoolEntry.text.scale.set(1.4);
          state.damageTexts.push({
            text: damagePoolEntry.text,
            life: 0.6,
            velY: -20,
            pool: damagePoolEntry,
            scaleTimer: 0.12,
          });

          entry.pool.inUse = false;
          entry.projectile.entity.visible = false;
          state.world.removeChild(entry.projectile.entity);
          entry.pool.trailPositions = [];
          entry.pool.trailGfx.clear();
          if (state.world.children.includes(entry.pool.trailGfx)) {
            state.world.removeChild(entry.pool.trailGfx);
          }
          const shakeAmp = entry.isCharged ? 12 : 6;
          const shakeTime = entry.isCharged ? 0.2 : 0.12;
          state.camera.shakeTime = Math.max(state.camera.shakeTime, shakeTime);
          state.camera.shakeAmp = Math.max(state.camera.shakeAmp, shakeAmp);
          state.projectiles.splice(i, 1);
          break;
        }
      }

      if (entry.bouncesRemaining <= 0 || entry.life <= 0) {
        entry.pool.inUse = false;
        entry.projectile.entity.visible = false;
        state.world.removeChild(entry.projectile.entity);
        entry.pool.trailPositions = [];
        entry.pool.trailGfx.clear();
        if (state.world.children.includes(entry.pool.trailGfx)) {
          state.world.removeChild(entry.pool.trailGfx);
        }
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
        state.combo.count = 0;
        state.combo.multiplier = 1;
        state.combo.resetTimer = 0;
        state.combo.hudPulse = 0;
        state.camera.shakeTime = Math.max(state.camera.shakeTime, 0.12);
        state.camera.shakeAmp = Math.max(state.camera.shakeAmp, 5);
        const nx = dist === 0 ? 0 : dx / dist;
        const ny = dist === 0 ? 0 : dy / dist;
        const knockback = 260;
        state.player.vel.x = nx * knockback;
        state.player.vel.y = ny * knockback;
        state.playerKnockbackTimer = 0.2;
        this.spawnImpactFx(state, state.player.pos.x, state.player.pos.y, 0xfbbf24, 0xfef08a);

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
      if (entry.scaleTimer > 0) {
        entry.scaleTimer -= dt;
        const s = 1 + 0.4 * Math.max(0, entry.scaleTimer / 0.12);
        entry.text.scale.set(s);
      } else {
        entry.text.scale.set(1);
      }
      if (entry.life <= 0) {
        entry.pool.inUse = false;
        entry.text.visible = false;
        entry.text.scale.set(1);
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

    // Element badge (G8)
    const badgeColor = ELEMENT_COLORS[enemy.element];
    const badgeX = x + barWidth + 5;
    const badgeY = y + barHeight / 2;
    enemy.hpBar.beginFill(badgeColor, 0.9);
    enemy.hpBar.drawPolygon([
      badgeX, badgeY - 4,
      badgeX + 4, badgeY,
      badgeX, badgeY + 4,
      badgeX - 4, badgeY,
    ]);
    enemy.hpBar.endFill();
  }
}
