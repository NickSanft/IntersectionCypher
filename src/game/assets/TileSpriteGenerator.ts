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


/**
 * Generates a 16×16 floor tile. Flat fill — edge effects are omitted to
 * prevent visible seams when tiles are displayed at integer scales.
 */
function makeFloorTile(
  renderer: PIXI.Renderer,
  base: number,
  alt = false,
): PIXI.Texture {
  const SIZE = 16;
  const fill = alt ? lighten(base, 0.08) : base;

  const gfx = new PIXI.Graphics();
  gfx.rect(0, 0, SIZE, SIZE).fill(fill);

  const tex = renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } });
  gfx.destroy();
  return tex;
}

/**
 * Generates a 16×16 wall top tile. Flat fill to avoid seams between
 * adjacent wall tiles at integer scales.
 */
function makeWallTopTile(renderer: PIXI.Renderer, wallTopColor: number): PIXI.Texture {
  const SIZE = 16;
  const gfx = new PIXI.Graphics();
  gfx.rect(0, 0, SIZE, SIZE).fill(wallTopColor);

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
