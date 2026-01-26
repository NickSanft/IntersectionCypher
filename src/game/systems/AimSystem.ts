import { checkCollision } from "../../core/physics/Collision";
import type { GameState } from "../types";

export class AimSystem {
  public update(state: GameState): void {
    const aim = state.aim;
    const player = state.player;
    const menuOpen = state.menu.isOpen;
    const dialogOpen = state.dialog.open;
    if (state.levelUp.active) {
      aim.line.clear();
      aim.chargeRing.clear();
      aim.chargeRatio = 0;
      return;
    }

    aim.line.clear();
    if (aim.active && !dialogOpen && !menuOpen) {
      const dx = aim.x - player.pos.x;
      const dy = aim.y - player.pos.y;
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        const dash = 8;
        const gap = 6;
        const lifeSeconds = 1;
        const stepDt = 1 / 60;

        const isCharged = aim.chargeRatio >= 1;
        const radius = isCharged ? 8 : 4;
        const baseSpeed = state.playerData.stats.projectileSpeed;
        const speed = isCharged ? baseSpeed * 0.9 : baseSpeed;
        const bounciness = 1;

        let velX = (dx / len) * speed;
        let velY = (dy / len) * speed;
        let posX = player.pos.x;
        let posY = player.pos.y;

        const points: Array<{ x: number; y: number }> = [{ x: posX, y: posY }];
        const steps = Math.ceil(lifeSeconds / stepDt);

        for (let i = 0; i < steps; i += 1) {
          posX += velX * stepDt;
          posY += velY * stepDt;

          const hit = checkCollision({ x: posX, y: posY, z: 0 }, radius, state.map);
          if (hit) {
            const dot = velX * hit.normal.x + velY * hit.normal.y;
            if (dot < 0) {
              velX = velX - 2 * dot * hit.normal.x;
              velY = velY - 2 * dot * hit.normal.y;
              velX *= bounciness;
              velY *= bounciness;
              posX += hit.normal.x * (radius + 0.5);
              posY += hit.normal.y * (radius + 0.5);
            }
          }

          points.push({ x: posX, y: posY });
        }

        aim.line.lineStyle(3, isCharged ? 0xf97316 : 0xffffff, isCharged ? 0.95 : 0.9);
        const cycle = dash + gap;
        let cyclePos = 0;

        for (let i = 0; i < points.length - 1; i += 1) {
          const p0 = points[i];
          const p1 = points[i + 1];
          const segDx = p1.x - p0.x;
          const segDy = p1.y - p0.y;
          const segLen = Math.hypot(segDx, segDy);
          if (segLen === 0) {
            continue;
          }
          let segPos = 0;
          while (segPos < segLen) {
            const remainingInCycle = cycle - cyclePos;
            const stepLen = Math.min(remainingInCycle, segLen - segPos);
            if (cyclePos < dash) {
              const drawLen = Math.min(stepLen, dash - cyclePos);
              const t0 = segPos / segLen;
              const t1 = (segPos + drawLen) / segLen;
              const sx = p0.x + segDx * t0;
              const sy = p0.y + segDy * t0;
              const ex = p0.x + segDx * t1;
              const ey = p0.y + segDy * t1;
              aim.line.moveTo(sx, sy);
              aim.line.lineTo(ex, ey);
            }
            segPos += stepLen;
            cyclePos += stepLen;
            if (cyclePos >= cycle) {
              cyclePos = 0;
            }
          }
        }

        aim.line.beginFill(isCharged ? 0xf97316 : 0xffffff, 0.95);
        aim.line.drawCircle(aim.x, aim.y, 3);
        aim.line.endFill();
      }
    }

    aim.chargeRatio = 0;
    if (aim.chargeActive && !dialogOpen && !menuOpen) {
      aim.chargeRatio = Math.min(
        1,
        (performance.now() - aim.chargeStartMs) / aim.chargeThresholdMs
      );
    }

    aim.chargeRing.clear();
    if (aim.chargeRatio > 0) {
      const radius = 16 + 8 * aim.chargeRatio;
      aim.chargeRing.beginFill(0x22c55e, 0.12);
      aim.chargeRing.drawCircle(player.pos.x, player.pos.y, radius + 4);
      aim.chargeRing.endFill();
      aim.chargeRing.lineStyle(3, 0x22c55e, 0.95);
      aim.chargeRing.drawCircle(player.pos.x, player.pos.y, radius);
      aim.chargeRing.lineStyle(2, 0xfde047, 0.85);
      aim.chargeRing.drawCircle(player.pos.x, player.pos.y, radius - 5);
    }
  }
}
