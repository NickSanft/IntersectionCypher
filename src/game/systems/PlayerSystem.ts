import * as PIXI from "pixi.js";
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

    const inInvincWindow = elapsed >= roll.invincStart && elapsed <= roll.invincEnd;
    state.dodgeRoll.invincActive = inInvincWindow;
    if (inInvincWindow) {
      state.playerHitTimer = Math.max(state.playerHitTimer, dt + 0.01);
      // Flicker cyan to signal invincibility frames
      state.player.sprite.tint = Math.floor(elapsed * 16) % 2 === 0 ? 0x88eeff : 0xffffff;
    } else {
      state.player.sprite.tint = 0xffffff;
    }

    if (roll.timer <= 0) {
      roll.active = false;
      roll.invincActive = false;
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

    // Footstep dust particles
    const speed = Math.hypot(state.player.vel.x, state.player.vel.y);
    if (speed > 10) {
      state.footstepTimer -= dt;
      if (state.footstepTimer <= 0) {
        state.footstepTimer = 0.09;
        const px = state.player.pos.x + (Math.random() - 0.5) * 8;
        const py = state.player.pos.y + (Math.random() - 0.5) * 8;
        const dustGfx = new PIXI.Graphics();
        dustGfx.rect(-2, -2, 4, 4).fill({ color: 0xa8a29e, alpha: 0.6 });
        dustGfx.position.set(Math.round(px), Math.round(py));
        state.world.addChild(dustGfx);
        const poolEntry = { gfx: dustGfx, inUse: true };
        state.impactParticlePool.push(poolEntry);
        state.impactParticles.push({
          gfx: dustGfx,
          life: 0.35,
          velX: (Math.random() - 0.5) * 20,
          velY: (Math.random() - 0.5) * 20,
          pool: poolEntry,
        });
      }
    }
  }
}
