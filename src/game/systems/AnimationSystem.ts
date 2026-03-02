import * as PIXI from "pixi.js";
import type { GameState } from "../types";
import type { AnimationState } from "../animation/AnimationConfig";

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
    if (state.playerHitTimer > 0) {
      next = "hurt";
    } else if (moving) {
      next = "walk";
    }

    if (next !== state.playerAnimState) {
      state.playerAnimState = next;
      this.applyAnim(p.sprite, next);
    }

    // Flip sprite based on horizontal movement
    if (Math.abs(vx) > 5) {
      p.sprite.scale.x = vx < 0 ? -Math.abs(p.sprite.scale.x) : Math.abs(p.sprite.scale.x);
    }
  }

  private updateEnemyAnims(state: GameState): void {
    for (const enemy of state.enemies) {
      if (enemy.dead) {
        if (enemy.animState !== "dead") {
          enemy.animState = "dead";
          this.applyAnim(enemy.entity.sprite, "dead");
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
        this.applyAnim(enemy.entity.sprite, next);
      }

      // Flip based on movement
      if (Math.abs(vx) > 5) {
        enemy.entity.sprite.scale.x = vx < 0 ? -Math.abs(enemy.entity.sprite.scale.x) : Math.abs(enemy.entity.sprite.scale.x);
      }
    }
  }

  private applyAnim(sprite: PIXI.Sprite, state: AnimationState): void {
    if (!(sprite instanceof PIXI.AnimatedSprite)) return;
    sprite.gotoAndPlay(0);
    // Visibility: don't hide on state change
    if (state === "dead") {
      sprite.loop = false;
    }
  }
}
