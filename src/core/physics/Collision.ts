import { TileMap, tileIndex } from "../world/TileMap";
import type { Vec3 } from "../../entities/ZEntity";

export type Vec2 = { x: number; y: number };

export interface CollisionHit {
  normal: Vec2;
  tileX: number;
  tileY: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const normalize = (v: Vec2): Vec2 => {
  const len = Math.hypot(v.x, v.y);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / len, y: v.y / len };
};

export const checkCollision = (
  pos: Vec3,
  radius: number,
  map: TileMap
): CollisionHit | null => {
  const { tileSize, width, height, tiles, defs } = map;
  const minX = clamp(
    Math.floor((pos.x - radius) / tileSize),
    0,
    width - 1
  );
  const maxX = clamp(
    Math.floor((pos.x + radius) / tileSize),
    0,
    width - 1
  );
  const minY = clamp(
    Math.floor((pos.y - radius) / tileSize),
    0,
    height - 1
  );
  const maxY = clamp(
    Math.floor((pos.y + radius) / tileSize),
    0,
    height - 1
  );

  for (let ty = minY; ty <= maxY; ty += 1) {
    for (let tx = minX; tx <= maxX; tx += 1) {
      const def = defs[tiles[tileIndex(tx, ty, width)]];
      if (!def || def.solid !== "Solid") {
        continue;
      }
      if (pos.z > def.height) {
        continue;
      }

      const left = tx * tileSize;
      const right = left + tileSize;
      const top = ty * tileSize;
      const bottom = top + tileSize;

      const closestX = clamp(pos.x, left, right);
      const closestY = clamp(pos.y, top, bottom);

      const dx = pos.x - closestX;
      const dy = pos.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq > radius * radius) {
        continue;
      }

      if (dx !== 0 || dy !== 0) {
        return { normal: normalize({ x: dx, y: dy }), tileX: tx, tileY: ty };
      }

      const toLeft = Math.abs(pos.x - left);
      const toRight = Math.abs(right - pos.x);
      const toTop = Math.abs(pos.y - top);
      const toBottom = Math.abs(bottom - pos.y);

      const min = Math.min(toLeft, toRight, toTop, toBottom);
      if (min === toLeft) {
        return { normal: { x: -1, y: 0 }, tileX: tx, tileY: ty };
      }
      if (min === toRight) {
        return { normal: { x: 1, y: 0 }, tileX: tx, tileY: ty };
      }
      if (min === toTop) {
        return { normal: { x: 0, y: -1 }, tileX: tx, tileY: ty };
      }
      return { normal: { x: 0, y: 1 }, tileX: tx, tileY: ty };
    }
  }

  return null;
};
