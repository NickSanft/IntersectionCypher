import { moveWithCollision } from "../../core/physics/Move";
import type { GameState } from "../types";

export class PlayerSystem {
  public update(state: GameState, dt: number): void {
    if (state.playerKnockbackTimer > 0) {
      state.playerKnockbackTimer = Math.max(0, state.playerKnockbackTimer - dt);
      state.player.vel.x *= 0.9;
      state.player.vel.y *= 0.9;
      moveWithCollision(state.player.pos, state.player.vel, dt, state.playerRadius, state.map);
      state.player.renderUpdate();
      return;
    }

    if (state.dialog.open || state.menu.isOpen) {
      state.player.vel.x = 0;
      state.player.vel.y = 0;
      return;
    }

    state.playerController.update(dt, state.map);

    const dx = state.player.pos.x - state.npc.pos.x;
    const dy = state.player.pos.y - state.npc.pos.y;
    const dist = Math.hypot(dx, dy);
    const minDist = state.playerRadius + state.npcRadius;
    if (dist > 0 && dist < minDist) {
      const push = (minDist - dist) / dist;
      state.player.pos.x += dx * push;
      state.player.pos.y += dy * push;
      state.player.renderUpdate();
    }
  }
}
