import * as PIXI from "pixi.js";
import { Projectile } from "../../projectiles/Projectile";
import { ZEntity } from "../../entities/ZEntity";
import type { GameState } from "../types";

export const setupPointerSystem = (
  state: GameState,
  projectileTexture: PIXI.Texture
): void => {
  const acquireProjectile = (radius: number): {
    entry: GameState["projectilePool"][number];
    entity: ZEntity;
    projectile: Projectile;
  } => {
    for (const entry of state.projectilePool) {
      if (!entry.inUse && entry.projectile.radius === radius) {
        entry.inUse = true;
        return { entry, entity: entry.entity, projectile: entry.projectile };
      }
    }

    const entity = new ZEntity({
      sprite: new PIXI.Sprite(projectileTexture),
      gravity: 0,
      mass: 1,
    });
    entity.sprite.anchor.set(0.5);
    const projectile = new Projectile({ entity, radius, bounciness: 1 });
    const entry = { entity, projectile, inUse: true };
    state.projectilePool.push(entry);
    return { entry, entity, projectile };
  };

  const spawnProjectile = (
    dirX: number,
    dirY: number,
    radius: number,
    speed: number,
    damage: number
  ): void => {
    const { entry, entity, projectile } = acquireProjectile(radius);
    entity.sprite.scale.set(radius / 4);
    entity.pos.x = state.player.pos.x;
    entity.pos.y = state.player.pos.y;
    entity.pos.z = 0;
    entity.vel.x = dirX * speed;
    entity.vel.y = dirY * speed;
    entity.vel.z = 0;
    entity.visible = true;

    if (!state.app.stage.children.includes(entity)) {
      state.app.stage.addChild(entity);
    }
    state.projectiles.push({
      projectile,
      life: 1,
      damage,
      pool: entry,
    });
  };

  state.app.stage.on("pointerdown", (event: PIXI.FederatedPointerEvent) => {
    if (event.button !== 0) {
      return;
    }
    if (state.dialog.open || state.menu.isOpen) {
      return;
    }
    state.aim.x = event.global.x;
    state.aim.y = event.global.y;
    state.aim.active = true;
    state.aim.chargeStartMs = performance.now();
    state.aim.chargeActive = true;
  });

  window.addEventListener("pointerup", (event) => {
    if (event.button !== 0) {
      return;
    }
    if (!state.aim.chargeActive) {
      return;
    }
    if (state.dialog.open || state.menu.isOpen) {
      state.aim.chargeActive = false;
      return;
    }

    const rect = state.app.canvas.getBoundingClientRect();
    const scaleX = state.app.renderer.width / rect.width;
    const scaleY = state.app.renderer.height / rect.height;
    const targetX = (event.clientX - rect.left) * scaleX;
    const targetY = (event.clientY - rect.top) * scaleY;

    const dirX = targetX - state.player.pos.x;
    const dirY = targetY - state.player.pos.y;
    const len = Math.hypot(dirX, dirY);
    if (len === 0) {
      state.aim.chargeActive = false;
      return;
    }

    const isCharged =
      performance.now() - state.aim.chargeStartMs >= state.aim.chargeThresholdMs;
    const normX = dirX / len;
    const normY = dirY / len;
    if (isCharged) {
      spawnProjectile(normX, normY, 8, 380, 3);
    } else {
      spawnProjectile(normX, normY, 4, 420, 1);
    }
    state.aim.chargeActive = false;
  });

  state.app.stage.on("pointermove", (event: PIXI.FederatedPointerEvent) => {
    state.aim.x = event.global.x;
    state.aim.y = event.global.y;
    state.aim.active = true;
  });

  state.app.stage.on("pointerout", () => {
    state.aim.active = false;
  });
};
