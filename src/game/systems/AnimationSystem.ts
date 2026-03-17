import * as PIXI from "pixi.js";
import type { GameState, EnemyState } from "../types";
import {
  type AnimationState,
  type AnimSet,
  playerAnims,
  chaserAnims,
  turretAnims,
  shieldAnims,
} from "../animation/AnimationConfig";
import type { AnimFrameSet, EntityType } from "../assets/SpriteLoader";

const ENEMY_TYPE_TO_ENTITY: Record<EnemyState["type"], EntityType> = {
  chaser: "chaser",
  turret: "turret",
  shield: "shield",
  splitter: "chaser",
  phaseguard: "chaser",
};

const ENEMY_ANIM_CONFIGS: Record<EnemyState["type"], AnimSet> = {
  chaser: chaserAnims,
  turret: turretAnims,
  shield: shieldAnims,
  splitter: chaserAnims,
  phaseguard: chaserAnims,
};

export class AnimationSystem {
  public update(state: GameState, _dt: number): void {
    this.updatePlayerAnim(state);
    this.updateEnemyAnims(state);
  }

  private updatePlayerAnim(state: GameState): void {
    const p = state.player;
    const vx = p.vel.x;
    const vy = p.vel.y;
    const moving = Math.abs(vx) > 5 || Math.abs(vy) > 5;

    let next: AnimationState = "idle";
    if (state.dodgeRoll.active) {
      next = "walk"; // roll uses walk frames (squish handled by PlayerSystem)
    } else if (state.playerHitTimer > 0) {
      next = "hurt";
    } else if (moving) {
      next = "walk";
    }

    if (next !== state.playerAnimState) {
      state.playerAnimState = next;
      this.applyAnim(
        p.sprite,
        next,
        state.spriteAtlas.entities.player,
        playerAnims,
      );
    }

    // Flip sprite based on horizontal movement (preserve base scale magnitude)
    if (Math.abs(vx) > 5) {
      const mag = Math.abs(p.sprite.scale.x);
      p.sprite.scale.x = vx < 0 ? -mag : mag;
    }
  }

  private updateEnemyAnims(state: GameState): void {
    for (const enemy of state.enemies) {
      const entityType = ENEMY_TYPE_TO_ENTITY[enemy.type];
      const frameSet = state.spriteAtlas.entities[entityType];
      const animConfig = ENEMY_ANIM_CONFIGS[enemy.type];

      if (enemy.dead) {
        if (enemy.animState !== "dead") {
          enemy.animState = "dead";
          this.applyAnim(enemy.entity.sprite, "dead", frameSet, animConfig);
        }
        continue;
      }

      const e = enemy.entity;
      const vx = e.vel.x;
      const vy = e.vel.y;
      const moving = Math.abs(vx) > 5 || Math.abs(vy) > 5;

      let next: AnimationState = "idle";
      if (enemy.hitTimer > 0) {
        next = "hurt";
      } else if (enemy.attackTimer > 0) {
        next = "attack";
      } else if (moving) {
        next = "walk";
      }

      if (next !== enemy.animState) {
        enemy.animState = next;
        this.applyAnim(enemy.entity.sprite, next, frameSet, animConfig);
      }

      // Flip based on movement
      if (Math.abs(vx) > 5) {
        const mag = Math.abs(enemy.entity.sprite.scale.x);
        enemy.entity.sprite.scale.x = vx < 0 ? -mag : mag;
      }
    }
  }

  private applyAnim(
    sprite: PIXI.Sprite,
    animState: AnimationState,
    frameSet: AnimFrameSet,
    config: AnimSet,
  ): void {
    if (!(sprite instanceof PIXI.AnimatedSprite)) return;

    const frames = frameSet[animState];
    if (!frames || frames.length === 0) return;

    const clip = config[animState];
    sprite.textures = frames;
    sprite.animationSpeed = clip.speed;
    sprite.loop = clip.loop;
    sprite.gotoAndPlay(0);
  }
}
