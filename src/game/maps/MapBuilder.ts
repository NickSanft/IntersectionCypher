import * as PIXI from "pixi.js";
import type { TileDef, TileMap } from "../../core/world/TileMap";
import { tileIndex } from "../../core/world/TileMap";

export interface TileLayout {
  tileSize: number;
  rows: string[];
  defs?: ReadonlyArray<TileDef>;
}

export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const buildTileMap = (layout: TileLayout): TileMap => {
  const defs: ReadonlyArray<TileDef> =
    layout.defs ?? [
      { id: 0, solid: "None", height: 0 },
      { id: 1, solid: "Solid", height: 96 },
    ];

  const height = layout.rows.length;
  const width = layout.rows[0]?.length ?? 0;
  const tiles = new Uint16Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const row = layout.rows[y] ?? "";
    for (let x = 0; x < width; x += 1) {
      const cell = row[x] ?? ".";
      tiles[tileIndex(x, y, width)] = cell === "#" ? 1 : 0;
    }
  }

  return { width, height, tileSize: layout.tileSize, tiles, defs };
};

export const drawMap = (map: TileMap): PIXI.Container => {
  const container = new PIXI.Container();
  const gfx = new PIXI.Graphics();

  gfx.beginFill(0x15202b);
  gfx.drawRect(0, 0, map.width * map.tileSize, map.height * map.tileSize);
  gfx.endFill();

  gfx.beginFill(0x2c3e50);
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const def = map.defs[map.tiles[tileIndex(x, y, map.width)]];
      if (def.solid !== "Solid") {
        continue;
      }
      gfx.drawRect(x * map.tileSize, y * map.tileSize, map.tileSize, map.tileSize);
    }
  }
  gfx.endFill();

  gfx.lineStyle(1, 0x0f141a, 0.6);
  for (let y = 0; y <= map.height; y += 1) {
    gfx.moveTo(0, y * map.tileSize);
    gfx.lineTo(map.width * map.tileSize, y * map.tileSize);
  }
  for (let x = 0; x <= map.width; x += 1) {
    gfx.moveTo(x * map.tileSize, 0);
    gfx.lineTo(x * map.tileSize, map.height * map.tileSize);
  }

  container.addChild(gfx);
  return container;
};

export const tileToWorld = (map: TileMap, x: number, y: number): { x: number; y: number } => {
  return {
    x: x * map.tileSize + map.tileSize * 0.5,
    y: y * map.tileSize + map.tileSize * 0.5,
  };
};

export const rectToWorld = (
  map: TileMap,
  rect: TileRect
): {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  centerX: number;
  centerY: number;
} => {
  const xMin = rect.x * map.tileSize;
  const xMax = (rect.x + rect.w) * map.tileSize;
  const yMin = rect.y * map.tileSize;
  const yMax = (rect.y + rect.h) * map.tileSize;
  return {
    xMin,
    xMax,
    yMin,
    yMax,
    centerX: (xMin + xMax) * 0.5,
    centerY: (yMin + yMax) * 0.5,
  };
};
