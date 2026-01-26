import { moveWithCollision } from "../../core/physics/Move";
import type { GameState } from "../types";

export class EnemyAISystem {
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
