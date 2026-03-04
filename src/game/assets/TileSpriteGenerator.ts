import * as PIXI from "pixi.js";
import type { ZonePalette } from "../types";

export interface TileTextureSet {
  floor: PIXI.Texture[];
  floorAlt: PIXI.Texture[];
  wallTop: PIXI.Texture;
  wallFront: PIXI.Texture;
  shadowStrip: PIXI.Texture;
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

/** Darken a color by t (0=original, 1=black) */
function darken(color: number, t: number): number {
  return (
    (Math.round(r(color) * (1 - t)) << 16) |
    (Math.round(g(color) * (1 - t)) << 8) |
    Math.round(b(color) * (1 - t))
  );
}

/** Simple LCG pseudo-random number generator seeded per tile */
function makeLcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Generates a 16×16 floor tile with subtle seeded pixel variation to break
 * up the uniform look. Edge effects are omitted to prevent seams at 3× scale.
 */
function makeFloorTile(
  renderer: PIXI.Renderer,
  base: number,
  alt = false,
  seed = 0,
): PIXI.Texture {
  const SIZE = 16;
  const fill = alt ? lighten(base, 0.08) : base;
  const spotColor = darken(fill, 0.14);
  const rng = makeLcg(seed);

  const gfx = new PIXI.Graphics();
  gfx.rect(0, 0, SIZE, SIZE).fill(fill);

  // 4–6 deterministic darker pixel spots per tile
  const count = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i += 1) {
    const px = Math.floor(rng() * (SIZE - 2));
    const py = Math.floor(rng() * (SIZE - 2));
    const sz = rng() < 0.3 ? 2 : 1;
    gfx.rect(px, py, sz, sz).fill({ color: spotColor, alpha: 0.38 });
  }

  const tex = renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } });
  gfx.destroy();
  return tex;
}

/**
 * Generates a 16×16 wall top tile.
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
  gfx.rect(0, 0, SIZE, 2).fill(topBand);

  const tex = renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } });
  gfx.destroy();
  return tex;
}

/**
 * Generates an 16×8 shadow strip — darker at the top, fading toward the
 * bottom — cast on the floor immediately below a wall's front face.
 */
function makeShadowStripTile(renderer: PIXI.Renderer): PIXI.Texture {
  const W = 16;
  const H = 8;
  const gfx = new PIXI.Graphics();
  // Two-band gradient approximation: darker near wall, lighter away
  gfx.rect(0, 0, W, 3).fill({ color: 0x000000, alpha: 0.28 });
  gfx.rect(0, 3, W, 3).fill({ color: 0x000000, alpha: 0.14 });
  gfx.rect(0, 6, W, 2).fill({ color: 0x000000, alpha: 0.05 });

  const tex = renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } });
  gfx.destroy();
  return tex;
}

export function generateTileTextures(
  renderer: PIXI.Renderer,
  palette: ZonePalette,
): TileTextureSet {
  // Generate 4 floor variants per tile type for visual variety
  const VARIANTS = 4;
  return {
    floor:     Array.from({ length: VARIANTS }, (_, i) => makeFloorTile(renderer, palette.floorFill, false, i * 17 + 3)),
    floorAlt:  Array.from({ length: VARIANTS }, (_, i) => makeFloorTile(renderer, palette.floorFill, true,  i * 31 + 11)),
    wallTop:   makeWallTopTile(renderer, palette.wallTop),
    wallFront: makeWallFrontTile(renderer, palette.wallFront),
    shadowStrip: makeShadowStripTile(renderer),
  };
}
