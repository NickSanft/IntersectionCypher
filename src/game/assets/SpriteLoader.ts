import * as PIXI from "pixi.js";
import type { AnimationState } from "../animation/AnimationConfig";
import {
  makePlayerFrames,
  makeChaserFrames,
  makeTurretFrames,
  makeShieldFrames,
  makeNpcFrames,
  makePlayerProjectileFrames,
  makeEnemyProjectileFrames,
  makeHitSparkFrames,
} from "./PlaceholderSprites";

export type EntityType = "player" | "chaser" | "turret" | "shield" | "npc" | "npc2";
export type AnimFrameSet = Record<AnimationState, PIXI.Texture[]>;

export interface SpriteAtlas {
  entities: Record<EntityType, AnimFrameSet>;
  playerProjectile: PIXI.Texture[];
  enemyProjectile: PIXI.Texture[];
  hitSpark: PIXI.Texture[];
  hitSparkOnBeat: PIXI.Texture[];
}

export async function loadSprites(renderer: PIXI.Renderer): Promise<SpriteAtlas> {
  // Try loading real assets from public/assets/sprites/*.json
  // On any failure, fall back to procedurally generated placeholders.
  try {
    const atlasUrls: Partial<Record<EntityType, string>> = {
      player: "/assets/sprites/player.json",
      chaser: "/assets/sprites/enemy-chaser.json",
      turret: "/assets/sprites/enemy-turret.json",
      shield: "/assets/sprites/enemy-shield.json",
      npc: "/assets/sprites/npc.json",
      npc2: "/assets/sprites/npc2.json",
    };

    const loaded: Partial<Record<EntityType, AnimFrameSet>> = {};
    for (const [key, url] of Object.entries(atlasUrls) as [EntityType, string][]) {
      try {
        await PIXI.Assets.load(url);
        const sheet = PIXI.Assets.get<PIXI.Spritesheet>(url);
        if (sheet?.data.animations) {
          loaded[key] = {
            idle:   (sheet.data.animations["idle"]   ?? []).map((f: string) => PIXI.Texture.from(f)),
            walk:   (sheet.data.animations["walk"]   ?? []).map((f: string) => PIXI.Texture.from(f)),
            attack: (sheet.data.animations["attack"] ?? []).map((f: string) => PIXI.Texture.from(f)),
            hurt:   (sheet.data.animations["hurt"]   ?? []).map((f: string) => PIXI.Texture.from(f)),
            dead:   (sheet.data.animations["dead"]   ?? []).map((f: string) => PIXI.Texture.from(f)),
          };
        }
      } catch {
        // Silently skip; will be filled by placeholder below
      }
    }

    return buildAtlas(renderer, loaded);
  } catch {
    return buildAtlas(renderer, {});
  }
}

function buildAtlas(
  renderer: PIXI.Renderer,
  overrides: Partial<Record<EntityType, AnimFrameSet>>,
): SpriteAtlas {
  const player   = overrides.player  ?? makePlayerFrames(renderer);
  const chaser   = overrides.chaser  ?? makeChaserFrames(renderer);
  const turret   = overrides.turret  ?? makeTurretFrames(renderer);
  const shield   = overrides.shield  ?? makeShieldFrames(renderer);
  const npc      = overrides.npc     ?? makeNpcFrames(renderer, 0xf472b6, 0xfbbf24);
  const npc2     = overrides.npc2    ?? makeNpcFrames(renderer, 0xa855f7, 0xc084fc);

  return {
    entities: { player, chaser, turret, shield, npc, npc2 },
    playerProjectile: makePlayerProjectileFrames(renderer),
    enemyProjectile:  makeEnemyProjectileFrames(renderer),
    hitSpark:         makeHitSparkFrames(renderer, 0xfbbf24),
    hitSparkOnBeat:   makeHitSparkFrames(renderer, 0xfde047),
  };
}
