import type { GameState, MapState } from "../types";
import { findNearestOpen } from "../../core/world/MapUtils";

export class MapSystem {
  public update(state: GameState, dt: number): void {
    if (state.levelUp.active) {
      return;
    }
    if (state.menu.isOpen || state.dialog.open) {
      state.doorPrompt.visible = false;
      return;
    }
    this.updateTransition(state, dt);
    if (state.transitionPhase !== "idle") {
      return;
    }

    const mapState = state.maps[state.currentMapId];
    if (!mapState || !mapState.door) {
      state.doorPrompt.visible = false;
      return;
    }

    const door = mapState.door;
    const px = state.player.pos.x;
    const py = state.player.pos.y;
    const inDoor = px >= door.xMin && px <= door.xMax && py >= door.yMin && py <= door.yMax;
    state.doorPrompt.visible = inDoor && state.transitionPhase === "idle";
    if (state.doorPrompt.visible) {
      state.doorPromptText.text = "Space: Enter";
      const padding = 10;
      const width = state.doorPromptText.width + padding * 2;
      const height = state.doorPromptText.height + padding * 2;
      state.doorPrompt.setSize(width, height);
      state.doorPromptBg.clear();
      state.doorPromptBg.beginFill(0x0f1720, 0.85);
      state.doorPromptBg.lineStyle(1, 0x2b3440, 1);
      state.doorPromptBg.drawRoundedRect(0, 0, width, height, 6);
      state.doorPromptBg.endFill();
      state.doorPromptText.position.set(width * 0.5, height * 0.5);
    }
    if (inDoor && state.input.isActionPressed("action")) {
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

    for (const enemy of state.enemies) {
      const enemyVisible = enemy.mapId === state.currentMapId && !enemy.dead;
      enemy.entity.visible = enemyVisible;
      enemy.hpBar.visible = enemyVisible;
      enemy.label.visible = enemyVisible;
      if (enemyVisible) {
        const enemySafe = findNearestOpen(state.map, enemy.homeX, enemy.homeY);
        enemy.entity.pos.x = enemySafe.x;
        enemy.entity.pos.y = enemySafe.y;
        enemy.homeX = enemySafe.x;
        enemy.homeY = enemySafe.y;
        enemy.entity.renderUpdate();
      }
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

    state.doorPrompt.visible = false;

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
