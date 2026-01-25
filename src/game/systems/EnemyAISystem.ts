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

    const dx = state.player.pos.x - enemy.entity.pos.x;
    const dy = state.player.pos.y - enemy.entity.pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= enemy.aggroRange) {
      if (dist > enemy.stopRange) {
        const nx = dx / dist;
        const ny = dy / dist;
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
