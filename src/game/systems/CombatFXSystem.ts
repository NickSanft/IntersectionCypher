import type { GameState } from "../types";

export class CombatFXSystem {
  public update(state: GameState, dt: number): void {
    for (let i = state.impactParticles.length - 1; i >= 0; i -= 1) {
      const p = state.impactParticles[i];
      p.life -= dt;
      p.gfx.alpha = Math.max(0, p.life / 0.3);
      p.gfx.position.x += p.velX * dt;
      p.gfx.position.y += p.velY * dt;
      if (p.life <= 0) {
        p.pool.inUse = false;
        p.gfx.visible = false;
        state.world.removeChild(p.gfx);
        state.impactParticles.splice(i, 1);
      }
    }

    for (let i = state.hitMarkers.length - 1; i >= 0; i -= 1) {
      const h = state.hitMarkers[i];
      h.life -= dt;
      h.gfx.alpha = Math.max(0, h.life / 0.2);
      if (h.life <= 0) {
        h.pool.inUse = false;
        h.gfx.visible = false;
        state.world.removeChild(h.gfx);
        state.hitMarkers.splice(i, 1);
      }
    }
  }
}
