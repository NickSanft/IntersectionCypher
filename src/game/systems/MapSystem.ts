import type { GameState, MapState } from "../types";
import { findNearestOpen } from "../../core/world/MapUtils";

export class MapSystem {
  public update(state: GameState, dt: number): void {
    this.updateTransition(state, dt);
    if (state.transitionPhase !== "idle") {
      return;
    }

    const mapState = state.maps[state.currentMapId];
    if (!mapState || !mapState.door) {
      return;
    }

    const door = mapState.door;
    const px = state.player.pos.x;
    const py = state.player.pos.y;
    if (px >= door.xMin && px <= door.xMax && py >= door.yMin && py <= door.yMax) {
      state.transitionPhase = "fadeOut";
      state.transitionTime = 0;
      state.transitionTargetMapId = door.to;
      state.transitionTargetSpawn = { x: door.spawnX, y: door.spawnY };
    }
  }

  public switchMap(
    state: GameState,
    mapId: string,
    spawnX?: number,
    spawnY?: number
  ): void {
    const next = state.maps[mapId];
    if (!next || state.currentMapId === mapId) {
      return;
    }

    state.world.removeChild(state.mapView);
    state.mapView = next.view;
    state.world.addChildAt(state.mapView, 0);
    state.map = next.map;
    state.currentMapId = mapId;

    const desiredX = spawnX ?? next.spawnX;
    const desiredY = spawnY ?? next.spawnY;
    const safe = findNearestOpen(next.map, desiredX, desiredY);
    state.player.pos.x = safe.x;
    state.player.pos.y = safe.y;
    state.player.renderUpdate();

    for (const npc of state.npcs) {
      npc.entity.visible = npc.mapId === state.currentMapId;
    }

    const enemyVisible = state.enemyMapId === state.currentMapId;
    state.enemy.entity.visible = enemyVisible;
    state.enemy.hpBar.visible = enemyVisible;
    state.enemy.label.visible = enemyVisible;
    if (enemyVisible) {
      const enemySafe = findNearestOpen(state.map, state.enemy.homeX, state.enemy.homeY);
      state.enemy.entity.pos.x = enemySafe.x;
      state.enemy.entity.pos.y = enemySafe.y;
      state.enemy.homeX = enemySafe.x;
      state.enemy.homeY = enemySafe.y;
      state.enemy.entity.renderUpdate();
    }

    for (const entry of state.projectiles) {
      entry.pool.inUse = false;
      entry.projectile.entity.visible = false;
      state.world.removeChild(entry.projectile.entity);
    }
    state.projectiles.length = 0;

    for (const entry of state.enemyProjectiles) {
      entry.pool.inUse = false;
      entry.projectile.entity.visible = false;
      state.world.removeChild(entry.projectile.entity);
    }
    state.enemyProjectiles.length = 0;

    for (const marker of state.doorMarkers) {
      marker.view.visible = marker.mapId === state.currentMapId;
    }
  }

  private updateTransition(state: GameState, dt: number): void {
    if (state.transitionPhase === "idle") {
      state.transitionOverlay.visible = false;
      return;
    }

    const width = state.app.renderer.width;
    const height = state.app.renderer.height;
    state.transitionOverlay.clear();
    state.transitionOverlay.beginFill(0x020617, 1);
    state.transitionOverlay.drawRect(0, 0, width, height);
    state.transitionOverlay.endFill();
    state.transitionOverlay.visible = true;

    state.transitionTime += dt;
    const t = Math.min(1, state.transitionTime / state.transitionDuration);

    if (state.transitionPhase === "fadeOut") {
      state.transitionOverlay.alpha = t;
      if (t >= 1) {
        const targetId = state.transitionTargetMapId;
        const spawn = state.transitionTargetSpawn;
        if (targetId) {
          this.switchMap(state, targetId, spawn?.x, spawn?.y);
        }
        state.transitionPhase = "fadeIn";
        state.transitionTime = 0;
      }
      return;
    }

    state.transitionOverlay.alpha = 1 - t;
    if (t >= 1) {
      state.transitionPhase = "idle";
      state.transitionTime = 0;
      state.transitionTargetMapId = null;
      state.transitionTargetSpawn = null;
    }
  }
}
