import { checkCollision } from "../../core/physics/Collision";
import type { GameState } from "../types";

export class AimSystem {
  public update(state: GameState): void {
    const aim = state.aim;
    const player = state.player;
    const menuOpen = state.menu.isOpen;
    const dialogOpen = state.dialog.open;

    aim.line.clear();
    if (aim.active && !dialogOpen && !menuOpen) {
      const dx = aim.x - player.pos.x;
      const dy = aim.y - player.pos.y;
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        const dash = 8;
        const gap = 6;
        const maxLen = 260;
        const radius = 4;
        const step = 4;
        const maxBounces = 2;

        let dirX = dx / len;
        let dirY = dy / len;
        let posX = player.pos.x;
        let posY = player.pos.y;
        let remaining = maxLen;
        let bounceCount = 0;

        const points: Array<{ x: number; y: number }> = [{ x: posX, y: posY }];

        while (remaining > 0 && bounceCount <= maxBounces) {
          const stepSize = Math.min(step, remaining);
          const nextX = posX + dirX * stepSize;
          const nextY = posY + dirY * stepSize;
          const hit = checkCollision({ x: nextX, y: nextY, z: 0 }, radius, state.map);

          if (hit) {
            const dot = dirX * hit.normal.x + dirY * hit.normal.y;
            dirX = dirX - 2 * dot * hit.normal.x;
            dirY = dirY - 2 * dot * hit.normal.y;
            bounceCount += 1;
            posX += hit.normal.x * (radius + 1);
            posY += hit.normal.y * (radius + 1);
            points.push({ x: posX, y: posY });
            continue;
          }

          posX = nextX;
          posY = nextY;
          remaining -= stepSize;
          points.push({ x: posX, y: posY });
        }

        const isCharged = aim.chargeRatio >= 1;
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
