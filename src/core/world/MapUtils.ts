import { tileIndex, type TileMap } from "./TileMap";

export interface Point {
  x: number;
  y: number;
}

export const isWalkable = (map: TileMap, tileX: number, tileY: number): boolean => {
  if (tileX < 0 || tileY < 0 || tileX >= map.width || tileY >= map.height) {
    return false;
  }
  const def = map.defs[map.tiles[tileIndex(tileX, tileY, map.width)]];
  return !def || def.solid !== "Solid";
};

export const findNearestOpen = (map: TileMap, x: number, y: number): Point => {
  const tileX = Math.floor(x / map.tileSize);
  const tileY = Math.floor(y / map.tileSize);
  if (isWalkable(map, tileX, tileY)) {
    return {
      x: tileX * map.tileSize + map.tileSize * 0.5,
      y: tileY * map.tileSize + map.tileSize * 0.5,
    };
  }

  const maxRadius = Math.max(map.width, map.height);
  for (let r = 1; r <= maxRadius; r += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) {
          continue;
        }
        const tx = tileX + dx;
        const ty = tileY + dy;
        if (isWalkable(map, tx, ty)) {
          return {
            x: tx * map.tileSize + map.tileSize * 0.5,
            y: ty * map.tileSize + map.tileSize * 0.5,
          };
        }
      }
    }
  }

  return {
    x: map.tileSize * 1.5,
    y: map.tileSize * 1.5,
  };
};
