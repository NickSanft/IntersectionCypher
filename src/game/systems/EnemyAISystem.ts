import * as PIXI from "pixi.js";
import { moveWithCollision } from "../../core/physics/Move";
import { Projectile } from "../../projectiles/Projectile";
import { ZEntity } from "../../entities/ZEntity";
import type { GameState } from "../types";

export class EnemyAISystem {
  private acquireEnemyProjectile(
    state: GameState
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

    const entity = new ZEntity({
      sprite: new PIXI.Sprite(state.enemyProjectileTexture),
      gravity: 0,
      mass: 1,
    });
    entity.sprite.anchor.set(0.5);
    const projectile = new Projectile({
      entity,
      radius: state.enemy.projectileRadius,
      bounciness: 1,
    });
    const entry = { entity, projectile, inUse: true };
    state.enemyProjectilePool.push(entry);
    return { entry, entity, projectile };
  }

  private spawnEnemyProjectile(state: GameState): void {
    const enemy = state.enemy;
    const dx = state.player.pos.x - enemy.entity.pos.x;
    const dy = state.player.pos.y - enemy.entity.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) {
      return;
    }

    const { entry, entity, projectile } = this.acquireEnemyProjectile(state);
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
    });
  }

  public update(state: GameState, dt: number): void {
    const enemy = state.enemy;
    if (enemy.dead || state.menu.isOpen || state.dialog.open) {
      enemy.entity.vel.x = 0;
      enemy.entity.vel.y = 0;
      return;
    }

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
        this.spawnEnemyProjectile(state);
      }
    }
    if (enemy.attackFlashTimer > 0) {
      enemy.attackFlashTimer = Math.max(0, enemy.attackFlashTimer - dt);
      if (enemy.attackFlashTimer === 0 && enemy.hitTimer <= 0) {
        enemy.entity.sprite.tint = 0xffffff;
      }
    }

    enemy.strafeSwitchTimer -= dt;
    if (enemy.strafeSwitchTimer <= 0) {
      enemy.strafeSwitchTimer = enemy.strafeSwitchSeconds;
      enemy.strafeDir *= -1;
    }

    const dx = state.player.pos.x - enemy.entity.pos.x;
    const dy = state.player.pos.y - enemy.entity.pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= enemy.aggroRange) {
      const nx = dist === 0 ? 0 : dx / dist;
      const ny = dist === 0 ? 0 : dy / dist;

      if (enemy.attackTimer > 0) {
        enemy.entity.vel.x = 0;
        enemy.entity.vel.y = 0;
      } else if (dist <= enemy.attackRange) {
        const px = -ny * enemy.strafeDir;
        const py = nx * enemy.strafeDir;
        const desired = enemy.attackRange * 0.75;
        const radial = (dist - desired) / desired;
        enemy.entity.vel.x = px * enemy.strafeSpeed - nx * radial * enemy.speed * 0.5;
        enemy.entity.vel.y = py * enemy.strafeSpeed - ny * radial * enemy.speed * 0.5;

        if (dist <= enemy.attackRange && enemy.attackCooldown <= 0) {
          enemy.attackTimer = enemy.attackWindupSeconds;
          enemy.attackCooldown = enemy.attackCooldownSeconds;
        }
      } else if (dist > enemy.stopRange) {
        enemy.entity.vel.x = nx * enemy.speed;
        enemy.entity.vel.y = ny * enemy.speed;
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
        enemy.entity.vel.x = (pdx / pDist) * enemy.speed * 0.5;
        enemy.entity.vel.y = (pdy / pDist) * enemy.speed * 0.5;
      } else {
        enemy.entity.vel.x = 0;
        enemy.entity.vel.y = 0;
      }
    }

    moveWithCollision(enemy.entity.pos, enemy.entity.vel, dt, enemy.radius, state.map);
    enemy.entity.renderUpdate();
  }
}
