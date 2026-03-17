import * as PIXI from "pixi.js";
import { moveWithCollision } from "../../core/physics/Move";
import { Projectile } from "../../projectiles/Projectile";
import { ZEntity } from "../../entities/ZEntity";
import type { GameState } from "../types";
import { SoundSystem } from "../audio/SoundSystem";

export class EnemyAISystem {
  private acquireEnemyProjectile(
    state: GameState,
    radius: number
  ): {
    entry: GameState["enemyProjectilePool"][number];
    entity: ZEntity;
    projectile: Projectile;
  } {
    for (const entry of state.enemyProjectilePool) {
      if (!entry.inUse) {
        entry.inUse = true;
        return { entry, entity: entry.entity, projectile: entry.projectile };
      }
    }

    const enemyProjFrames = state.spriteAtlas.enemyProjectile.length > 0
      ? state.spriteAtlas.enemyProjectile
      : [state.enemyProjectileTexture];
    const enemyProjSprite = new PIXI.AnimatedSprite(enemyProjFrames);
    enemyProjSprite.animationSpeed = 0.15;
    enemyProjSprite.blendMode = "add";
    enemyProjSprite.play();
    const entity = new ZEntity({
      sprite: enemyProjSprite,
      gravity: 0,
      mass: 1,
    });
    entity.sprite.anchor.set(0.5);
    const projectile = new Projectile({
      entity,
      radius,
      bounciness: 1,
    });
    const entry = { entity, projectile, inUse: true };
    state.enemyProjectilePool.push(entry);
    return { entry, entity, projectile };
  }

  private spawnEnemyProjectile(state: GameState, enemy: GameState["enemies"][number]): void {
    const dx = state.player.pos.x - enemy.entity.pos.x;
    const dy = state.player.pos.y - enemy.entity.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) {
      return;
    }

    const { entry, entity, projectile } = this.acquireEnemyProjectile(
      state,
      enemy.projectileRadius
    );
    entity.sprite.scale.set(enemy.projectileRadius / 4);
    entity.pos.x = enemy.entity.pos.x;
    entity.pos.y = enemy.entity.pos.y;
    entity.pos.z = 0;
    entity.vel.x = (dx / dist) * enemy.projectileSpeed;
    entity.vel.y = (dy / dist) * enemy.projectileSpeed;
    entity.vel.z = 0;
    entity.visible = true;

    if (!state.world.children.includes(entity)) {
      state.world.addChild(entity);
    }

    state.enemyProjectiles.push({
      projectile,
      life: enemy.projectileLifetime,
      damage: enemy.projectileDamage,
      pool: entry,
      reflected: false,
    });
  }

  public update(state: GameState, dt: number): void {
    const paused = state.levelUp.active || state.menu.isOpen || state.dialog.open;
    for (const enemy of state.enemies) {
      if (enemy.mapId !== state.currentMapId) {
        enemy.entity.vel.x = 0;
        enemy.entity.vel.y = 0;
        continue;
      }
      if (enemy.dead) {
        enemy.entity.vel.x = 0;
        enemy.entity.vel.y = 0;
        enemy.aggroText.visible = false;
        enemy.telegraphGfx.visible = false;
        continue;
      }
      if (paused) {
        enemy.entity.vel.x = 0;
        enemy.entity.vel.y = 0;
        continue;
      }

      // Burn DOT: 2 damage every 0.5 s for 1.5 s
      if (enemy.burnTimer > 0) {
        enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
        enemy.burnTickTimer -= dt;
        if (enemy.burnTickTimer <= 0) {
          enemy.burnTickTimer = 0.5;
          enemy.hp = Math.max(0, enemy.hp - 2);
          enemy.entity.sprite.tint = 0xff6600;
          enemy.hitTimer = Math.max(enemy.hitTimer, 0.12);
          if (enemy.hp === 0 && !enemy.expGranted) {
            enemy.dead = true;
            enemy.deathTimer = 0.25;
            enemy.respawnTimer = enemy.respawnSeconds;
            enemy.expGranted = true;
            state.killCount += 1;
            SoundSystem.playEnemyDeath(state, false);
            state.levelUpSystem.addExperience(state, 5);
            continue;
          }
        }
      }
      if (enemy.slowTimer > 0) {
        enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      }
      const effectiveSpeed = enemy.slowTimer > 0 ? enemy.speed * 0.6 : enemy.speed;

      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      }
      if (enemy.attackTimer > 0) {
        enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
        if (enemy.attackTimer === 0) {
          enemy.attackFlashTimer = 0.12;
          enemy.entity.sprite.tint = 0xfbbf24;
          state.camera.shakeTime = Math.max(state.camera.shakeTime, 0.1);
          state.camera.shakeAmp = Math.max(state.camera.shakeAmp, 4);
          this.spawnEnemyProjectile(state, enemy);
        }
      }
      if (enemy.attackFlashTimer > 0) {
        enemy.attackFlashTimer = Math.max(0, enemy.attackFlashTimer - dt);
        if (enemy.attackFlashTimer === 0 && enemy.hitTimer <= 0) {
          enemy.entity.sprite.tint = 0xffffff;
        }
      }

      // Status effect tints — only applied when no hit/attack flash is overriding
      if (enemy.hitTimer <= 0 && enemy.attackFlashTimer <= 0) {
        if (enemy.slowTimer > 0) {
          enemy.entity.sprite.tint = 0x8899ff;
        } else if (enemy.burnTimer > 0) {
          // Flicker orange to indicate active burn
          enemy.entity.sprite.tint = Math.floor(enemy.burnTimer * 6) % 2 === 0 ? 0xff8844 : 0xffffff;
        } else {
          enemy.entity.sprite.tint = 0xffffff;
        }
      }

      const dx = state.player.pos.x - enemy.entity.pos.x;
      const dy = state.player.pos.y - enemy.entity.pos.y;
      const dist = Math.hypot(dx, dy);

      const nowAggro = dist <= enemy.aggroRange;
      if (nowAggro && !enemy.wasAggro) {
        enemy.aggroTimer = 0.7;
        SoundSystem.playAggroBlip(state);
      }
      enemy.wasAggro = nowAggro;
      if (enemy.aggroTimer > 0) {
        enemy.aggroTimer = Math.max(0, enemy.aggroTimer - dt);
        enemy.aggroText.visible = enemy.mapId === state.currentMapId;
        enemy.aggroText.position.set(
          Math.round(enemy.entity.pos.x),
          Math.round(enemy.entity.pos.y) - enemy.labelOffsetY - 20,
        );
        const bounce = 1 + Math.sin(enemy.aggroTimer * 20) * 0.2;
        enemy.aggroText.scale.set(bounce);
        enemy.aggroText.alpha = Math.min(1, enemy.aggroTimer / 0.3);
      } else {
        enemy.aggroText.visible = false;
      }

      if (enemy.type === "shield") {
        // Rotate shield to always face the player
        enemy.shieldAngle = Math.atan2(dy, dx);

        // Draw shield arc in world-space
        if (enemy.shieldGfx) {
          enemy.shieldGfx.clear();
          const arcHalf = ((enemy.shieldArcDeg ?? 120) / 2) * (Math.PI / 180);
          const sa = enemy.shieldAngle;
          const r = enemy.radius + 7;
          const shieldColor = enemy.hitTimer > 0 ? 0xffffff : 0x38bdf8;
          enemy.shieldGfx.lineStyle(4, shieldColor, 0.92);
          enemy.shieldGfx.arc(enemy.entity.pos.x, enemy.entity.pos.y, r, sa - arcHalf, sa + arcHalf);
          // End-caps
          enemy.shieldGfx.lineStyle(0);
          enemy.shieldGfx.beginFill(shieldColor, 0.5);
          enemy.shieldGfx.drawCircle(
            enemy.entity.pos.x + Math.cos(sa - arcHalf) * r,
            enemy.entity.pos.y + Math.sin(sa - arcHalf) * r,
            3
          );
          enemy.shieldGfx.drawCircle(
            enemy.entity.pos.x + Math.cos(sa + arcHalf) * r,
            enemy.entity.pos.y + Math.sin(sa + arcHalf) * r,
            3
          );
          enemy.shieldGfx.endFill();
        }

        // Slow approach toward player when in aggro range
        enemy.entity.vel.x = 0;
        enemy.entity.vel.y = 0;
        if (dist <= enemy.aggroRange && dist > enemy.stopRange && dist > 0) {
          enemy.entity.vel.x = (dx / dist) * effectiveSpeed;
          enemy.entity.vel.y = (dy / dist) * effectiveSpeed;
        }
        moveWithCollision(enemy.entity.pos, enemy.entity.vel, dt, enemy.radius, state.map);
        { const eBase = Math.abs(enemy.entity.sprite.scale.x); enemy.entity.sprite.scale.x = dx < 0 ? -eBase : eBase; }
        enemy.entity.renderUpdate();
        enemy.telegraphGfx.clear();
        enemy.telegraphGfx.visible = false;
        continue;
      }

      if (enemy.type === "phaseguard") {
        // Cycle invulnerability: 1.5s active, 2.5s vulnerable
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.phaseActive = !enemy.phaseActive;
          enemy.phaseTimer = enemy.phaseActive ? 1.5 : 2.5;
        }
        // Draw ring when invulnerable
        if (enemy.phaseActive) {
          enemy.telegraphGfx.visible = enemy.mapId === state.currentMapId;
          enemy.telegraphGfx.clear();
          const r = enemy.radius + 6;
          enemy.telegraphGfx.rect(
            enemy.entity.pos.x - r, enemy.entity.pos.y - r, r * 2, r * 2
          ).stroke({ width: 2, color: 0x38bdf8, alpha: 0.85 });
        } else {
          enemy.telegraphGfx.clear();
          enemy.telegraphGfx.visible = false;
        }
        // Behave like a chaser otherwise
        if (dist <= enemy.aggroRange && !enemy.phaseActive) {
          const nx = dist === 0 ? 0 : dx / dist;
          const ny = dist === 0 ? 0 : dy / dist;
          if (dist > enemy.stopRange) {
            enemy.entity.vel.x = nx * effectiveSpeed;
            enemy.entity.vel.y = ny * effectiveSpeed;
          } else {
            enemy.entity.vel.x = 0;
            enemy.entity.vel.y = 0;
          }
          if (enemy.attackCooldown <= 0 && dist <= enemy.attackRange && enemy.attackTimer <= 0) {
            enemy.attackTimer = enemy.attackWindupSeconds;
            enemy.attackCooldown = enemy.attackCooldownSeconds;
          }
        } else {
          enemy.entity.vel.x = 0;
          enemy.entity.vel.y = 0;
        }
        moveWithCollision(enemy.entity.pos, enemy.entity.vel, dt, enemy.radius, state.map);
        { const eBase = Math.abs(enemy.entity.sprite.scale.x); enemy.entity.sprite.scale.x = dx < 0 ? -eBase : eBase; }
        enemy.entity.renderUpdate();
        continue;
      }

      if (enemy.type === "turret") {
        enemy.entity.vel.x = 0;
        enemy.entity.vel.y = 0;
        if (dist <= enemy.attackRange && enemy.attackTimer <= 0 && enemy.attackCooldown <= 0) {
          enemy.attackTimer = enemy.attackWindupSeconds;
          enemy.attackCooldown = enemy.attackCooldownSeconds;
        }
        // Telegraph danger line during windup
        if (enemy.attackTimer > 0) {
          const windupRatio = enemy.attackTimer / enemy.attackWindupSeconds;
          enemy.telegraphGfx.visible = enemy.mapId === state.currentMapId;
          enemy.telegraphGfx.clear();
          const tlen = Math.hypot(dx, dy);
          if (tlen > 0) {
            const nx2 = dx / tlen;
            const ny2 = dy / tlen;
            const dashLen = 8;
            const gapLen = 6;
            const totalLen = Math.min(tlen, 200);
            let pos = 0;
            let dash = true;
            while (pos < totalLen) {
              const segLen = Math.min(dash ? dashLen : gapLen, totalLen - pos);
              if (dash) {
                const sx = enemy.entity.pos.x + nx2 * pos;
                const sy = enemy.entity.pos.y + ny2 * pos;
                const ex = enemy.entity.pos.x + nx2 * (pos + segLen);
                const ey = enemy.entity.pos.y + ny2 * (pos + segLen);
                const midX = (sx + ex) / 2;
                const midY = (sy + ey) / 2;
                enemy.telegraphGfx
                  .rect(midX - 1, midY - 1, 2, 2)
                  .fill({ color: 0xfbbf24, alpha: 0.5 * windupRatio });
              }
              pos += dash ? dashLen : gapLen;
              dash = !dash;
            }
          }
        } else {
          enemy.telegraphGfx.clear();
          enemy.telegraphGfx.visible = false;
        }
        { const eBase = Math.abs(enemy.entity.sprite.scale.x); enemy.entity.sprite.scale.x = dx < 0 ? -eBase : eBase; }
        enemy.entity.renderUpdate();
        continue;
      }

      enemy.strafeSwitchTimer -= dt;
      if (enemy.strafeSwitchTimer <= 0) {
        enemy.strafeSwitchTimer = enemy.strafeSwitchSeconds;
        enemy.strafeDir *= -1;
      }

      if (dist <= enemy.aggroRange) {
        const nx = dist === 0 ? 0 : dx / dist;
        const ny = dist === 0 ? 0 : dy / dist;

        if (enemy.attackTimer > 0) {
          enemy.entity.vel.x = 0;
          enemy.entity.vel.y = 0;
          // Telegraph danger line during windup
          const windupRatio = enemy.attackTimer / enemy.attackWindupSeconds;
          enemy.telegraphGfx.visible = enemy.mapId === state.currentMapId;
          enemy.telegraphGfx.clear();
          const tlen = Math.hypot(dx, dy);
          if (tlen > 0) {
            const nx2 = dx / tlen;
            const ny2 = dy / tlen;
            const dashLen = 8;
            const gapLen = 6;
            const totalLen = Math.min(tlen, 200);
            let cpos = 0;
            let cdash = true;
            while (cpos < totalLen) {
              const segLen = Math.min(cdash ? dashLen : gapLen, totalLen - cpos);
              if (cdash) {
                const sx = enemy.entity.pos.x + nx2 * cpos;
                const sy = enemy.entity.pos.y + ny2 * cpos;
                const ex = enemy.entity.pos.x + nx2 * (cpos + segLen);
                const ey = enemy.entity.pos.y + ny2 * (cpos + segLen);
                const midX = (sx + ex) / 2;
                const midY = (sy + ey) / 2;
                enemy.telegraphGfx
                  .rect(midX - 1, midY - 1, 2, 2)
                  .fill({ color: 0xfbbf24, alpha: 0.5 * windupRatio });
              }
              cpos += cdash ? dashLen : gapLen;
              cdash = !cdash;
            }
          }
        } else if (dist <= enemy.attackRange) {
          const px = -ny * enemy.strafeDir;
          const py = nx * enemy.strafeDir;
          const desired = enemy.attackRange * 0.75;
          const radial = (dist - desired) / desired;
          enemy.entity.vel.x = px * enemy.strafeSpeed - nx * radial * effectiveSpeed * 0.5;
          enemy.entity.vel.y = py * enemy.strafeSpeed - ny * radial * effectiveSpeed * 0.5;

          if (enemy.attackCooldown <= 0) {
            enemy.attackTimer = enemy.attackWindupSeconds;
            enemy.attackCooldown = enemy.attackCooldownSeconds;
          }
        } else if (dist > enemy.stopRange) {
          enemy.entity.vel.x = nx * effectiveSpeed;
          enemy.entity.vel.y = ny * effectiveSpeed;
        } else {
          enemy.entity.vel.x = 0;
          enemy.entity.vel.y = 0;
        }
      } else {
        enemy.patrolAngle += dt * 0.6;
        const targetX = enemy.homeX + Math.cos(enemy.patrolAngle) * enemy.patrolRadius;
        const targetY = enemy.homeY + Math.sin(enemy.patrolAngle) * enemy.patrolRadius;
        const pdx = targetX - enemy.entity.pos.x;
        const pdy = targetY - enemy.entity.pos.y;
        const pDist = Math.hypot(pdx, pdy);
        if (pDist > 2) {
          enemy.entity.vel.x = (pdx / pDist) * effectiveSpeed * 0.5;
          enemy.entity.vel.y = (pdy / pDist) * effectiveSpeed * 0.5;
        } else {
          enemy.entity.vel.x = 0;
          enemy.entity.vel.y = 0;
        }
      }

      if (enemy.attackTimer <= 0) {
        enemy.telegraphGfx.clear();
        enemy.telegraphGfx.visible = false;
      }
      moveWithCollision(enemy.entity.pos, enemy.entity.vel, dt, enemy.radius, state.map);
      if (Math.abs(enemy.entity.vel.x) > 2) {
        const eBase = Math.abs(enemy.entity.sprite.scale.x);
        enemy.entity.sprite.scale.x = enemy.entity.vel.x < 0 ? -eBase : eBase;
      }
      enemy.entity.renderUpdate();
    }
  }
}
