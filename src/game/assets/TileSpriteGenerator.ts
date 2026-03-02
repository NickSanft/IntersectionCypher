import * as PIXI from "pixi.js";
import type { ZonePalette } from "../types";

export interface TileTextureSet {
  floor: PIXI.Texture;
  floorAlt: PIXI.Texture;
  wallTop: PIXI.Texture;
  wallFront: PIXI.Texture;
}

/** Extract RGB components from a packed hex color */
function r(c: number): number { return (c >> 16) & 0xff; }
function g(c: number): number { return (c >> 8) & 0xff; }
function b(c: number): number { return c & 0xff; }

/** Blend color with white by t (0=original, 1=white) */
function lighten(color: number, t: number): number {
  return (
    (Math.round(r(color) + (255 - r(color)) * t) << 16) |
    (Math.round(g(color) + (255 - g(color)) * t) << 8) |
    Math.round(b(color) + (255 - b(color)) * t)
  );
}

/** Blend color with black by t */
function darken(color: number, t: number): number {
  return (
    (Math.round(r(color) * (1 - t)) << 16) |
    (Math.round(g(color) * (1 - t)) << 8) |
    Math.round(b(color) * (1 - t))
  );
}

/**
 * Generates a 16×16 floor tile with SNES-style edge highlights.
 * Top/left edge: 1px brighter; bottom/right: 1px darker.
 */
function makeFloorTile(
  renderer: PIXI.Renderer,
  base: number,
  alt = false,
): PIXI.Texture {
  const SIZE = 16;
  const fill = alt ? lighten(base, 0.07) : base;
  const hi = lighten(fill, 0.18);
  const sh = darken(fill, 0.25);

  const gfx = new PIXI.Graphics();

  // Base fill
  gfx.rect(0, 0, SIZE, SIZE).fill(fill);

  // Top edge highlight
  gfx.rect(0, 0, SIZE, 1).fill(hi);
  // Left edge highlight
  gfx.rect(0, 0, 1, SIZE).fill(hi);
  // Bottom shadow
  gfx.rect(0, SIZE - 1, SIZE, 1).fill(sh);
  // Right shadow
  gfx.rect(SIZE - 1, 0, 1, SIZE).fill(sh);

  const tex = renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } });
  gfx.destroy();
  return tex;
}

/**
 * Generates a 16×16 wall top tile with flat pixel border.
 */
function makeWallTopTile(renderer: PIXI.Renderer, wallTopColor: number): PIXI.Texture {
  const SIZE = 16;
  const border = darken(wallTopColor, 0.3);
  const inner = lighten(wallTopColor, 0.1);

  const gfx = new PIXI.Graphics();
  gfx.rect(0, 0, SIZE, SIZE).fill(border);
  gfx.rect(2, 2, SIZE - 4, SIZE - 4).fill(inner);

  const tex = renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } });
  gfx.destroy();
  return tex;
}

/**
 * Generates a 16×16 wall front (south face) tile with a 2px lighter top band.
 */
function makeWallFrontTile(renderer: PIXI.Renderer, wallFrontColor: number): PIXI.Texture {
  const SIZE = 16;
  const topBand = lighten(wallFrontColor, 0.2);

  const gfx = new PIXI.Graphics();
  gfx.rect(0, 0, SIZE, SIZE).fill(wallFrontColor);
  // Lighter top band for depth illusion
  gfx.rect(0, 0, SIZE, 2).fill(topBand);

  const tex = renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } });
  gfx.destroy();
  return tex;
}

export function generateTileTextures(
  renderer: PIXI.Renderer,
  palette: ZonePalette,
): TileTextureSet {
  return {
    floor:     makeFloorTile(renderer, palette.floorFill, false),
    floorAlt:  makeFloorTile(renderer, palette.floorFill, true),
    wallTop:   makeWallTopTile(renderer, palette.wallTop),
    wallFront: makeWallFrontTile(renderer, palette.wallFront),
  };
}
