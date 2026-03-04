import { moveWithCollision } from "../../core/physics/Move";
import type { GameState } from "../types";

export class PlayerSystem {
  private updateDodgeRoll(state: GameState, dt: number): void {
    const roll = state.dodgeRoll;
    roll.timer -= dt;
    const elapsed = roll.duration - roll.timer;
    const t = Math.max(0, Math.min(1, elapsed / roll.duration));

    state.player.pos.z = Math.sin(t * Math.PI) * 18;
    const baseScaleY = Math.abs(state.player.sprite.scale.x);
    state.player.sprite.scale.y = baseScaleY * (1 - 0.25 * Math.sin(t * Math.PI));

    const vel = { x: roll.dirX * roll.speed, y: roll.dirY * roll.speed, z: 0 };
    moveWithCollision(state.player.pos, vel, dt, state.playerRadius, state.map);
    state.player.renderUpdate();

    if (elapsed >= roll.invincStart && elapsed <= roll.invincEnd) {
      state.playerHitTimer = Math.max(state.playerHitTimer, dt + 0.01);
      // Flicker cyan to signal invincibility frames
      state.player.sprite.tint = Math.floor(elapsed * 16) % 2 === 0 ? 0x88eeff : 0xffffff;
    } else {
      state.player.sprite.tint = 0xffffff;
    }

    if (roll.timer <= 0) {
      roll.active = false;
      state.player.pos.z = 0;
      state.player.sprite.scale.y = Math.abs(state.player.sprite.scale.x);
      state.player.sprite.tint = 0xffffff;
      state.player.renderUpdate();
    }
  }

  public update(state: GameState, dt: number): void {
    if (state.dodgeRoll.active) {
      this.updateDodgeRoll(state, dt);
      return;
    }

    if (state.playerKnockbackTimer > 0) {
      state.playerKnockbackTimer = Math.max(0, state.playerKnockbackTimer - dt);
      state.player.vel.x *= 0.9;
      state.player.vel.y *= 0.9;
      moveWithCollision(state.player.pos, state.player.vel, dt, state.playerRadius, state.map);
      state.player.renderUpdate();
      return;
    }

    if (state.dialog.open || state.menu.isOpen || state.levelUp.active) {
      state.player.vel.x = 0;
      state.player.vel.y = 0;
      return;
    }

    state.playerController.update(dt, state.map);

    for (const npc of state.npcs) {
      if (npc.mapId !== state.currentMapId) {
        continue;
      }
      const dx = state.player.pos.x - npc.entity.pos.x;
      const dy = state.player.pos.y - npc.entity.pos.y;
      const dist = Math.hypot(dx, dy);
      const minDist = state.playerRadius + npc.radius;
      if (dist > 0 && dist < minDist) {
        const push = (minDist - dist) / dist;
        state.player.pos.x += dx * push;
        state.player.pos.y += dy * push;
        state.player.renderUpdate();
      }
    }
  }
}
