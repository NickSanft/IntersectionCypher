import * as PIXI from "pixi.js";

const SPRITE_SIZE = 16;

/** Draw a single 1×1 pixel at (px, py) into a Graphics object */
function px(gfx: PIXI.Graphics, px: number, py: number, color: number, alpha = 1): void {
  gfx.rect(px, py, 1, 1).fill({ color, alpha });
}

function bakeFrames(
  frames: PIXI.Graphics[],
  renderer: PIXI.Renderer,
): PIXI.Texture[] {
  return frames.map((gfx) =>
    renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } })
  );
}

// ─── Player ───────────────────────────────────────────────────────────────────
// 16×16 top-down humanoid. Walk: legs shift left/right per frame.
function makePlayerFrame(
  gfx: PIXI.Graphics,
  legOffset: number,
  hurt: boolean,
): void {
  const body = hurt ? 0xff6666 : 0x4ade80;
  const head = hurt ? 0xffaaaa : 0x86efac;
  const legs = hurt ? 0xdd4444 : 0x16a34a;
  const eye = 0xffffff;

  // Shadow base
  gfx.ellipse(8, 14, 5, 2).fill({ color: 0x000000, alpha: 0.3 });

  // Legs
  gfx.rect(5 + legOffset, 11, 2, 4).fill(legs);
  gfx.rect(9 - legOffset, 11, 2, 4).fill(legs);

  // Body
  gfx.rect(4, 6, 8, 6).fill(body);

  // Head
  gfx.rect(5, 1, 6, 5).fill(head);

  // Eyes
  px(gfx, 6, 2, eye);
  px(gfx, 9, 2, eye);
}

export function makePlayerFrames(renderer: PIXI.Renderer): {
  idle: PIXI.Texture[];
  walk: PIXI.Texture[];
  attack: PIXI.Texture[];
  hurt: PIXI.Texture[];
  dead: PIXI.Texture[];
} {
  const idleFrames: PIXI.Texture[] = [];
  for (let i = 0; i < 4; i++) {
    const gfx = new PIXI.Graphics();
    makePlayerFrame(gfx, i % 2 === 0 ? 0 : 0, false);
    // Subtle idle bob: shift head up/down
    if (i % 2 === 0) {
      gfx.rect(5, 0, 6, 5).fill(0x86efac);
    }
    idleFrames.push(renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } }));
    gfx.destroy();
  }

  const walkFrames: PIXI.Texture[] = [];
  const walkLegOffsets = [1, 0, -1, 0, 1, 0];
  for (let i = 0; i < 6; i++) {
    const gfx = new PIXI.Graphics();
    makePlayerFrame(gfx, walkLegOffsets[i]!, false);
    walkFrames.push(renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } }));
    gfx.destroy();
  }

  const attackFrames: PIXI.Texture[] = [];
  for (let i = 0; i < 4; i++) {
    const gfx = new PIXI.Graphics();
    makePlayerFrame(gfx, 0, false);
    // Attack: draw sword arc
    const atkColors = [0xfbbf24, 0xfde68a, 0xfef3c7, 0xfbbf24];
    gfx.rect(12, 4 + i, 3, 1).fill(atkColors[i]!);
    attackFrames.push(renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } }));
    gfx.destroy();
  }

  const hurtFrames: PIXI.Texture[] = [];
  for (let i = 0; i < 2; i++) {
    const gfx = new PIXI.Graphics();
    makePlayerFrame(gfx, 0, true);
    // Flash white on frame 0
    if (i === 0) gfx.rect(4, 1, 8, 14).fill({ color: 0xffffff, alpha: 0.5 });
    hurtFrames.push(renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } }));
    gfx.destroy();
  }

  const deadFrames: PIXI.Texture[] = [];
  for (let i = 0; i < 6; i++) {
    const gfx = new PIXI.Graphics();
    const alpha = 1 - i / 6;
    // Flatten: draw horizontal squished figure
    gfx.rect(2, 8, 12, 4).fill({ color: 0x4ade80, alpha });
    gfx.rect(5, 7, 6, 2).fill({ color: 0x86efac, alpha });
    deadFrames.push(renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } }));
    gfx.destroy();
  }

  return { idle: idleFrames, walk: walkFrames, attack: attackFrames, hurt: hurtFrames, dead: deadFrames };
}

// ─── Chaser Enemy ─────────────────────────────────────────────────────────────
function makeChaserFrame(gfx: PIXI.Graphics, frame: number, hurt: boolean): void {
  const col = hurt ? 0xff8888 : 0xef4444;
  const dark = hurt ? 0xdd4444 : 0x991b1b;
  const spike = hurt ? 0xffaaaa : 0xfca5a5;

  // Body diamond
  const cx = 8, cy = 8;
  for (let y = 0; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      const dist = Math.abs(x - cx) + Math.abs(y - cy);
      if (dist < 6) px(gfx, x, y, dist < 3 ? dark : col);
    }
  }
  // Spikes
  const spikePos = frame % 2 === 0 ? 0 : 1;
  px(gfx, 8, 0 + spikePos, spike);
  px(gfx, 8, 15 - spikePos, spike);
  px(gfx, 0 + spikePos, 8, spike);
  px(gfx, 15 - spikePos, 8, spike);
}

export function makeChaserFrames(renderer: PIXI.Renderer): {
  idle: PIXI.Texture[];
  walk: PIXI.Texture[];
  attack: PIXI.Texture[];
  hurt: PIXI.Texture[];
  dead: PIXI.Texture[];
} {
  const mkFrames = (count: number, hurt = false) =>
    bakeFrames(
      Array.from({ length: count }, (_, i) => {
        const g = new PIXI.Graphics();
        makeChaserFrame(g, i, hurt);
        return g;
      }),
      renderer
    );

  return {
    idle: mkFrames(2),
    walk: mkFrames(4),
    attack: mkFrames(3),
    hurt: mkFrames(2, true),
    dead: bakeFrames(
      Array.from({ length: 4 }, (_, i) => {
        const g = new PIXI.Graphics();
        const alpha = 1 - i / 4;
        g.rect(3, 3, 10, 10).fill({ color: 0xef4444, alpha });
        return g;
      }),
      renderer
    ),
  };
}

// ─── Turret Enemy ─────────────────────────────────────────────────────────────
function makeTurretFrame(gfx: PIXI.Graphics, frame: number, hurt: boolean): void {
  const base = hurt ? 0x93c5fd : 0x38bdf8;
  const dark = hurt ? 0x60a5fa : 0x0369a1;

  // Square base
  gfx.rect(3, 3, 10, 10).fill(dark);
  gfx.rect(4, 4, 8, 8).fill(base);

  // Rotating barrel indicator
  const angle = (frame / 2) * Math.PI * 0.5;
  const bx = Math.round(8 + Math.cos(angle) * 4);
  const by = Math.round(8 + Math.sin(angle) * 4);
  gfx.rect(bx - 1, by - 1, 2, 2).fill(0xffffff);

  // Center dot
  gfx.rect(7, 7, 2, 2).fill(dark);
}

export function makeTurretFrames(renderer: PIXI.Renderer): {
  idle: PIXI.Texture[];
  walk: PIXI.Texture[];
  attack: PIXI.Texture[];
  hurt: PIXI.Texture[];
  dead: PIXI.Texture[];
} {
  const mkFrames = (count: number, hurt = false) =>
    bakeFrames(
      Array.from({ length: count }, (_, i) => {
        const g = new PIXI.Graphics();
        makeTurretFrame(g, i, hurt);
        return g;
      }),
      renderer
    );

  return {
    idle: mkFrames(2),
    walk: mkFrames(2),
    attack: mkFrames(3),
    hurt: mkFrames(2, true),
    dead: bakeFrames(
      Array.from({ length: 4 }, (_, i) => {
        const g = new PIXI.Graphics();
        const s = 4 + i * 2;
        g.rect(8 - s / 2, 8 - s / 2, s, s).fill({ color: 0x38bdf8, alpha: 1 - i / 4 });
        return g;
      }),
      renderer
    ),
  };
}

// ─── Shield Enemy ─────────────────────────────────────────────────────────────
function makeShieldFrame(gfx: PIXI.Graphics, frame: number, hurt: boolean): void {
  const body = hurt ? 0x93c5fd : 0x0ea5e9;
  const shield = hurt ? 0xbfdbfe : 0x7dd3fc;
  const dark = 0x075985;

  // Body
  gfx.rect(4, 3, 8, 10).fill(body);
  gfx.rect(5, 1, 6, 3).fill(hurt ? 0xbfdbfe : 0x38bdf8); // head

  // Shield on left side
  const shieldX = 1 + (frame % 2);
  gfx.rect(shieldX, 4, 3, 8).fill(dark);
  gfx.rect(shieldX + 1, 5, 1, 6).fill(shield);

  // Eyes
  px(gfx, 6, 2, 0xffffff);
  px(gfx, 9, 2, 0xffffff);
}

export function makeShieldFrames(renderer: PIXI.Renderer): {
  idle: PIXI.Texture[];
  walk: PIXI.Texture[];
  attack: PIXI.Texture[];
  hurt: PIXI.Texture[];
  dead: PIXI.Texture[];
} {
  const mkFrames = (count: number, hurt = false) =>
    bakeFrames(
      Array.from({ length: count }, (_, i) => {
        const g = new PIXI.Graphics();
        makeShieldFrame(g, i, hurt);
        return g;
      }),
      renderer
    );

  return {
    idle: mkFrames(2),
    walk: mkFrames(4),
    attack: mkFrames(3),
    hurt: mkFrames(2, true),
    dead: bakeFrames(
      Array.from({ length: 4 }, (_, i) => {
        const g = new PIXI.Graphics();
        g.rect(4, 8, 8, 3).fill({ color: 0x0ea5e9, alpha: 1 - i / 4 });
        return g;
      }),
      renderer
    ),
  };
}

// ─── NPC ──────────────────────────────────────────────────────────────────────
function makeNpcFrame(
  gfx: PIXI.Graphics,
  frame: number,
  bodyColor: number,
  headColor: number,
): void {
  // Idle bob
  const yOff = frame % 2 === 0 ? 0 : 1;

  gfx.ellipse(8, 14, 4, 1.5).fill({ color: 0x000000, alpha: 0.25 });
  gfx.rect(5, 6 + yOff, 6, 6).fill(bodyColor);
  gfx.rect(5, 1 + yOff, 6, 5).fill(headColor);
  px(gfx, 6, 2 + yOff, 0xffffff);
  px(gfx, 9, 2 + yOff, 0xffffff);
}

export function makeNpcFrames(
  renderer: PIXI.Renderer,
  bodyColor: number,
  headColor: number,
): {
  idle: PIXI.Texture[];
  walk: PIXI.Texture[];
  attack: PIXI.Texture[];
  hurt: PIXI.Texture[];
  dead: PIXI.Texture[];
} {
  const idleFrames = bakeFrames(
    Array.from({ length: 4 }, (_, i) => {
      const g = new PIXI.Graphics();
      makeNpcFrame(g, i, bodyColor, headColor);
      return g;
    }),
    renderer
  );

  return {
    idle: idleFrames,
    walk: idleFrames,
    attack: idleFrames.slice(0, 2),
    hurt: idleFrames.slice(0, 2),
    dead: idleFrames.slice(0, 2),
  };
}

// ─── Projectile orb (8×8) ─────────────────────────────────────────────────────
export function makePlayerProjectileFrames(renderer: PIXI.Renderer): PIXI.Texture[] {
  return Array.from({ length: 4 }, (_, i) => {
    const gfx = new PIXI.Graphics();
    const rot = (i / 4) * Math.PI * 2;
    // Core
    gfx.circle(4, 4, 3).fill(0xfbbf24);
    // Shine
    const sx = Math.round(4 + Math.cos(rot) * 1.5);
    const sy = Math.round(4 + Math.sin(rot) * 1.5);
    gfx.rect(sx, sy, 1, 1).fill(0xfef9c3);
    const tex = renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } });
    gfx.destroy();
    return tex;
  });
}

export function makeEnemyProjectileFrames(renderer: PIXI.Renderer): PIXI.Texture[] {
  return Array.from({ length: 2 }, (_, i) => {
    const gfx = new PIXI.Graphics();
    const size = i === 0 ? 4 : 3;
    // Diamond shape
    const cx = 4, cy = 4;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (Math.abs(x - cx) + Math.abs(y - cy) <= size) {
          px(gfx, x, y, i === 0 ? 0x38bdf8 : 0x7dd3fc);
        }
      }
    }
    const tex = renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } });
    gfx.destroy();
    return tex;
  });
}

// ─── Hit spark (8×8, 4 frames) ────────────────────────────────────────────────
export function makeHitSparkFrames(renderer: PIXI.Renderer, color: number): PIXI.Texture[] {
  const sizes = [8, 12, 8, 4];
  return sizes.map((sz) => {
    const gfx = new PIXI.Graphics();
    const half = sz / 2;
    // Cross pattern
    gfx.rect(half - 1, 0, 2, sz).fill(color);
    gfx.rect(0, half - 1, sz, 2).fill(color);
    // Corner pixels
    px(gfx, 0, 0, color);
    px(gfx, sz - 1, 0, color);
    px(gfx, 0, sz - 1, color);
    px(gfx, sz - 1, sz - 1, color);
    const tex = renderer.generateTexture({ target: gfx, textureSourceOptions: { scaleMode: "nearest" } });
    gfx.destroy();
    return tex;
  });
}
