import * as PIXI from "pixi.js";
import type { TileDef, TileMap } from "../../core/world/TileMap";
import { tileIndex } from "../../core/world/TileMap";
import type { ZonePalette } from "../types";
import type { TileTextureSet } from "../assets/TileSpriteGenerator";

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

const DEFAULT_PALETTE: ZonePalette = {
  floorFill: 0x0d1f2d,
  floorGrid: 0x0f2336,
  wallTop: 0x1e3d52,
  wallFront: 0x08121a,
  ambientTint: 0xffffff,
};

export const drawMap = (map: TileMap, palette: ZonePalette = DEFAULT_PALETTE): PIXI.Container => {
  const container = new PIXI.Container();
  const gfx = new PIXI.Graphics();
  const frontFaceH = Math.round(map.tileSize * 0.35);

  // Floor fill
  gfx.beginFill(palette.floorFill);
  gfx.drawRect(0, 0, map.width * map.tileSize, map.height * map.tileSize);
  gfx.endFill();

  // Checker floor variation — every other open tile is slightly lighter
  gfx.beginFill(palette.floorFill + 0x050810, 0.45);
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if ((x + y) % 2 !== 0) continue;
      const def = map.defs[map.tiles[tileIndex(x, y, map.width)]];
      if (def.solid === "Solid") continue;
      gfx.drawRect(x * map.tileSize, y * map.tileSize, map.tileSize, map.tileSize);
    }
  }
  gfx.endFill();

  // Wall top faces
  gfx.beginFill(palette.wallTop);
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const def = map.defs[map.tiles[tileIndex(x, y, map.width)]];
      if (def.solid !== "Solid") continue;
      gfx.drawRect(x * map.tileSize, y * map.tileSize, map.tileSize, map.tileSize);
    }
  }
  gfx.endFill();

  // Wall front faces — drawn below south-exposed walls to create depth
  gfx.beginFill(palette.wallFront);
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const def = map.defs[map.tiles[tileIndex(x, y, map.width)]];
      if (def.solid !== "Solid") continue;
      const belowIdx = y + 1 < map.height ? map.tiles[tileIndex(x, y + 1, map.width)] : 0;
      if (map.defs[belowIdx]?.solid === "Solid") continue;
      gfx.drawRect(
        x * map.tileSize,
        (y + 1) * map.tileSize,
        map.tileSize,
        frontFaceH
      );
    }
  }
  gfx.endFill();

  // Grid lines
  gfx.lineStyle(1, palette.floorGrid, 0.4);
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

/**
 * Tile-sprite based map rendering — replaces drawMap() with crisp 16×16 pixel tiles
 * displayed at tileSize×tileSize (3× scale for 16→48px tiles).
 */
export const drawMapSprites = (
  map: TileMap,
  tiles: TileTextureSet,
): PIXI.Container => {
  const container = new PIXI.Container();
  const frontFaceH = Math.round(map.tileSize * 0.35);
  const scale = map.tileSize / 16; // e.g. 48/16 = 3

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const idx = tileIndex(x, y, map.width);
      const def = map.defs[map.tiles[idx]];
      const wx = x * map.tileSize;
      const wy = y * map.tileSize;

      if (def.solid === "Solid") {
        // Wall top face
        const wallTop = new PIXI.Sprite(tiles.wallTop);
        wallTop.scale.set(scale);
        wallTop.position.set(wx, wy);
        container.addChild(wallTop);

        // Wall front face — only south-exposed walls
        const belowIdx = y + 1 < map.height ? map.tiles[tileIndex(x, y + 1, map.width)] : 0;
        if (map.defs[belowIdx]?.solid !== "Solid") {
          const frontSprite = new PIXI.Sprite(tiles.wallFront);
          frontSprite.scale.set(scale, frontFaceH / 16);
          frontSprite.position.set(wx, (y + 1) * map.tileSize);
          container.addChild(frontSprite);

          // Cast shadow on floor below the front face
          const shadowSprite = new PIXI.Sprite(tiles.shadowStrip);
          shadowSprite.scale.set(scale, scale);
          shadowSprite.position.set(wx, (y + 1) * map.tileSize + frontFaceH);
          container.addChild(shadowSprite);
        }
      } else {
        // Floor tile — deterministic variant by position for subtle texture variety
        const variantIdx = (x * 3 + y * 7) % 4;
        const isAlt = (x + y) % 2 === 0;

        // ~12% of floor tiles get a slow animated shimmer (AnimatedSprite, 4-frame cycle)
        if (isAlt && variantIdx === 0) {
          const shimmer = new PIXI.AnimatedSprite(tiles.floorShimmer[variantIdx]);
          shimmer.animationSpeed = 0.012; // ≈ one cycle per 5 seconds at 60fps
          shimmer.play();
          shimmer.scale.set(scale);
          shimmer.position.set(wx, wy);
          container.addChild(shimmer);
        } else {
          const floorSprite = new PIXI.Sprite(isAlt ? tiles.floorAlt[variantIdx] : tiles.floor[variantIdx]);
          floorSprite.scale.set(scale);
          floorSprite.position.set(wx, wy);
          container.addChild(floorSprite);
        }
      }
    }
  }

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
