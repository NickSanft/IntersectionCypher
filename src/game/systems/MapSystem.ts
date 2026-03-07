import type { GameState, MapState } from "../types";
import { findNearestOpen } from "../../core/world/MapUtils";
import { SoundSystem } from "../audio/SoundSystem";
import { writeSave } from "../SaveSystem";

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
    const enemiesRemaining = state.enemies.filter(
      e => e.mapId === state.currentMapId && !e.dead
    ).length;
    const cleared = enemiesRemaining === 0;

    state.doorPrompt.visible = inDoor && state.transitionPhase === "idle";
    if (state.doorPrompt.visible) {
      state.doorPromptText.text = cleared
        ? "Space: Enter"
        : `Defeat all enemies (${enemiesRemaining} left)`;
      const padding = 10;
      const width = state.doorPromptText.width + padding * 2;
      const height = state.doorPromptText.height + padding * 2;
      state.doorPrompt.setSize(width, height);
      state.doorPromptBg.clear();
      state.doorPromptBg.beginFill(0x0f1720, 0.85);
      state.doorPromptBg.lineStyle(1, cleared ? 0x2b3440 : 0x7f1d1d, 1);
      state.doorPromptBg.drawRoundedRect(0, 0, width, height, 6);
      state.doorPromptBg.endFill();
      state.doorPromptText.position.set(width * 0.5, height * 0.5);
      state.doorPromptText.tint = cleared ? 0xffffff : 0xfca5a5;
    }
    if (inDoor && cleared && state.input.isActionPressed("action")) {
      state.transitionPhase = "fadeOut";
      state.transitionTime = 0;
      state.transitionTargetMapId = door.to;
      state.transitionTargetSpawn = { x: door.spawnX, y: door.spawnY };
      SoundSystem.playDoorTransition(state);
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
    state.rhythm.bpm = next.rhythm.bpm;
    state.rhythm.beatInterval = 60 / next.rhythm.bpm;
    state.rhythm.windowSeconds = next.rhythm.windowSeconds;
    state.rhythm.onBeatDamageMult = next.rhythm.onBeatDamageMult;
    state.world.tint = next.rhythm.palette.ambientTint;
    state.worldBg.tint = next.rhythm.palette.floorFill;
    (state.app.renderer as import("pixi.js").Renderer).background.color = next.rhythm.palette.floorFill;
    state.rhythm.time = 0;
    state.rhythm.lastBeat = -1;
    state.rhythm.pulse = 0;
    state.rhythm.onBeat = false;
    state.rhythm.startTimeMs = performance.now();

    // Invalidate the old background loop and schedule a restart on the new map.
    // bgLoopGeneration being incremented causes the old setTimeout chain to
    // self-terminate on its next callback.  bgLoopStarted = false lets the
    // main.ts ticker call startBackgroundTrack() again on the very next frame.
    // audioBeatOrigin is reset to the current audio time so that beat 0 of the
    // new map aligns perfectly with startTimeMs above.
    state.rhythm.bgLoopStarted = false;
    state.rhythm.bgLoopGeneration += 1;
    state.rhythm.audioBeatOrigin = state.rhythm.audioContext?.currentTime ?? null;

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
      if (enemy.shieldGfx) {
        enemy.shieldGfx.visible = enemyVisible;
      }
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

    for (const trigger of state.triggers) {
      trigger.view.visible = trigger.mapId === state.currentMapId && !trigger.triggered;
    }

    writeSave(state);
  }

  private updateTransition(state: GameState, dt: number): void {
    if (state.transitionPhase === "idle") {
      state.transitionOverlay.visible = false;
      return;
    }

    state.doorPrompt.visible = false;
    state.transitionTime += dt;
    const t = Math.min(1, state.transitionTime / state.transitionDuration);

    const width = state.app.renderer.width;
    const height = state.app.renderer.height;
    // SNES-style horizontal scanline wipe: 12 bands staggered top-to-bottom
    const BANDS = 12;
    const bandH = Math.ceil(height / BANDS);
    const staggerRange = 0.3;

    state.transitionOverlay.clear();
    state.transitionOverlay.visible = true;
    state.transitionOverlay.alpha = 1;

    for (let i = 0; i < BANDS; i += 1) {
      const stagger = (i / BANDS) * staggerRange;
      let progress: number;
      if (state.transitionPhase === "fadeOut") {
        progress = Math.min(1, Math.max(0, (t - stagger) / (1 - staggerRange)));
      } else {
        progress = 1 - Math.min(1, Math.max(0, (t - stagger) / (1 - staggerRange)));
      }
      const bandW = Math.round(progress * width);
      if (bandW > 0) {
        state.transitionOverlay
          .rect(0, i * bandH, bandW, bandH)
          .fill({ color: 0x020617, alpha: 1 });
      }
    }

    if (state.transitionPhase === "fadeOut" && t >= 1) {
      const targetId = state.transitionTargetMapId;
      const spawn = state.transitionTargetSpawn;
      if (targetId) {
        this.switchMap(state, targetId, spawn?.x, spawn?.y);
      }
      state.transitionPhase = "fadeIn";
      state.transitionTime = 0;
      return;
    }

    if (state.transitionPhase === "fadeIn" && t >= 1) {
      state.transitionPhase = "idle";
      state.transitionTime = 0;
      state.transitionTargetMapId = null;
      state.transitionTargetSpawn = null;
    }
  }
}
