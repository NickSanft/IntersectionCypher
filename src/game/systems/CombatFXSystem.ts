import type { GameState } from "../types";

export class CombatFXSystem {
  public update(state: GameState, dt: number): void {
    // Charged projectile pulse
    for (const entry of state.projectiles) {
      if (!entry.isCharged) continue;
      const pulse = 2.2 + 0.3 * Math.sin(state.rhythm.totalTime * 12);
      entry.projectile.entity.sprite.scale.set(pulse);
    }

    // Projectile motion trails (G4)
    for (const entry of state.projectiles) {
      const pool = entry.pool;
      const px = entry.projectile.entity.pos.x;
      const py = entry.projectile.entity.pos.y;
      pool.trailPositions.unshift({ x: px, y: py });
      if (pool.trailPositions.length > 4) {
        pool.trailPositions.length = 4;
      }
      pool.trailGfx.clear();
      const baseRadius = entry.isCharged ? 4 : 2;
      for (let i = 1; i < pool.trailPositions.length; i += 1) {
        const tp = pool.trailPositions[i];
        const alpha = (1 - i / pool.trailPositions.length) * 0.45;
        const ghostRadius = baseRadius * (1 - i / (pool.trailPositions.length + 1));
        const trailColor = entry.isCharged ? 0xfff0d0 : 0xaaddff;
        pool.trailGfx.circle(tp.x, tp.y, ghostRadius).fill({ color: trailColor, alpha });
      }
      if (!state.world.children.includes(pool.trailGfx)) {
        state.world.addChild(pool.trailGfx);
      }
    }

    // Impact particles
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

    // Hit markers
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

    // Impact rings (pixel-art square ring)
    for (let i = state.impactRings.length - 1; i >= 0; i -= 1) {
      const ring = state.impactRings[i];
      ring.life -= dt;
      const t = 1 - ring.life / ring.duration;
      const r = Math.round(ring.maxRadius * t);
      const alpha = (1 - t) * 0.75;
      ring.gfx.clear();
      // Draw square ring as 4 line segments (pixel-aligned)
      const a = ring.color;
      ring.gfx.rect(-r, -r, r * 2, 2).fill({ color: a, alpha });
      ring.gfx.rect(-r, r - 2, r * 2, 2).fill({ color: a, alpha });
      ring.gfx.rect(-r, -r, 2, r * 2).fill({ color: a, alpha });
      ring.gfx.rect(r - 2, -r, 2, r * 2).fill({ color: a, alpha });
      if (ring.life <= 0) {
        ring.pool.inUse = false;
        ring.gfx.visible = false;
        state.world.removeChild(ring.gfx);
        state.impactRings.splice(i, 1);
      }
    }
  }
}

