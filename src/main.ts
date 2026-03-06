import * as PIXI from "pixi.js";
import { ZEntity } from "./entities/ZEntity";
import type { TileMap } from "./core/world/TileMap";
import { Input } from "./game/Input";
import { PlayerController } from "./game/PlayerController";
import { UIElement } from "./ui/UIElement";
import { MenuSystem } from "./ui/menu/MenuSystem";
import { setupPointerSystem } from "./game/systems/PointerSystem";
import { MenuToggleSystem } from "./game/systems/MenuToggleSystem";
import { DialogSystem } from "./game/systems/DialogSystem";
import { PlayerSystem } from "./game/systems/PlayerSystem";
import { AimSystem } from "./game/systems/AimSystem";
import { CombatSystem } from "./game/systems/CombatSystem";
import { UISystem } from "./game/systems/UISystem";
import { CameraSystem } from "./game/systems/CameraSystem";
import { HUDSystem } from "./game/systems/HUDSystem";
import { EnemyAISystem } from "./game/systems/EnemyAISystem";
import { MapSystem } from "./game/systems/MapSystem";
import { CombatFXSystem } from "./game/systems/CombatFXSystem";
import { MinimapSystem } from "./game/systems/MinimapSystem";
import { AbilitySystem } from "./game/systems/AbilitySystem";
import { TriggerSystem } from "./game/systems/TriggerSystem";
import { RhythmSystem } from "./game/systems/RhythmSystem";
import { ElementSystem } from "./game/systems/ElementSystem";
import { RunSummarySystem } from "./game/systems/RunSummarySystem";
import { SettingsSystem } from "./game/systems/SettingsSystem";
import { AnimationSystem } from "./game/systems/AnimationSystem";
import type { GameState } from "./game/types";
import { defaultPlayerData } from "./game/data/PlayerData";
import { defaultEnemyData, turretEnemyData, shieldEnemyData, type EnemyData } from "./game/data/EnemyData";
import { createAbilityStates } from "./game/abilities/AbilityFactory";
import { findNearestOpen } from "./core/world/MapUtils";
import npcDialog from "./game/dialogs/npc.json";
import npc2Dialog from "./game/dialogs/npc2.json";
import eventDialog from "./game/dialogs/event.json";
import shopDialog from "./game/dialogs/shop.json";
import { DialogEngine } from "./game/dialog/DialogEngine";
import { DialogUI } from "./game/dialog/DialogUI";
import { LevelUpUI } from "./game/level/LevelUpUI";
import { LevelUpSystem } from "./game/systems/LevelUpSystem";
import { RunSummaryUI } from "./game/run/RunSummaryUI";
import { zoneConfigs } from "./game/data/Zones";
import { SettingsUI } from "./game/settings/SettingsUI";
import { zoneMaps } from "./game/data/ZoneMaps";
import { buildTileMap, drawMapSprites, rectToWorld, tileToWorld } from "./game/maps/MapBuilder";
import { generateTileTextures } from "./game/assets/TileSpriteGenerator";
import { addItemById } from "./game/data/InventoryUtils";
import { itemDefs } from "./game/data/Items";
import { ItemSystem } from "./game/systems/ItemSystem";
import { loadSprites } from "./game/assets/SpriteLoader";
import { loadSave } from "./game/SaveSystem";
import { SoundSystem } from "./game/audio/SoundSystem";

const buildMapState = (
  config: (typeof zoneMaps)[keyof typeof zoneMaps],
  map: TileMap,
  view: PIXI.Container,
  mapCatalog: Record<string, TileMap>
): GameState["maps"][string] => {
  const spawn = tileToWorld(map, config.spawn.x, config.spawn.y);
  let door: GameState["maps"][string]["door"];
  if (config.door) {
    const rect = rectToWorld(map, config.door.rect);
    const targetMap = mapCatalog[config.door.to];
    const targetSpawn = tileToWorld(
      targetMap,
      config.door.spawn.x,
      config.door.spawn.y
    );
    door = {
      to: config.door.to,
      xMin: rect.xMin,
      xMax: rect.xMax,
      yMin: rect.yMin,
      yMax: rect.yMax,
      spawnX: targetSpawn.x,
      spawnY: targetSpawn.y,
    };
  }
  return {
    id: config.id,
    map,
    view,
    spawnX: spawn.x,
    spawnY: spawn.y,
    rhythm: zoneConfigs[config.id].rhythm,
    door,
  };
};

const bootstrap = async (): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }
  PIXI.AbstractRenderer.defaultOptions.roundPixels = true;
  const app = new PIXI.Application();
  await app.init({
    background: zoneConfigs.map1.rhythm.palette.floorFill,
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: false,
  });

  const host = document.querySelector<HTMLDivElement>("#app");
  if (!host) {
    throw new Error("Missing #app host element");
  }
  host.appendChild(app.canvas);

  // ResizeObserver is more reliable than resizeTo:window for keeping the
  // renderer pixel dimensions in sync with the actual viewport size.
  const overlayRef = { scanline: null as PIXI.TilingSprite | null };
  const resizeObserver = new ResizeObserver(() => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    if (overlayRef.scanline) {
      overlayRef.scanline.width = window.innerWidth;
      overlayRef.scanline.height = window.innerHeight;
    }
  });
  resizeObserver.observe(document.documentElement);

  app.stage.sortableChildren = true;
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  const world = new PIXI.Container();
  world.sortableChildren = true;
  world.zIndex = 0;
  app.stage.addChild(world);

  // World-space background — a large sprite behind the map tiles so the renderer
  // clear color never shows around the map edges on any screen size.
  const worldBg = new PIXI.Sprite(PIXI.Texture.WHITE);
  worldBg.tint = zoneConfigs.map1.rhythm.palette.floorFill;
  worldBg.position.set(-3000, -2000);
  worldBg.width = 6000;
  worldBg.height = 4000;
  worldBg.zIndex = -1;
  world.addChild(worldBg);

  const map1 = buildTileMap(zoneMaps.map1.layout);
  const map2 = buildTileMap(zoneMaps.map2.layout);

  // Load sprite atlas (falls back to placeholders if real assets are absent)
  const spriteAtlas = await loadSprites(app.renderer as PIXI.Renderer);

  // Build tile texture sets per zone and render maps as tile sprites
  const map1Tiles = generateTileTextures(app.renderer as PIXI.Renderer, zoneConfigs.map1.rhythm.palette);
  const map2Tiles = generateTileTextures(app.renderer as PIXI.Renderer, zoneConfigs.map2.rhythm.palette);
  const mapView1 = drawMapSprites(map1, map1Tiles);
  const mapView2 = drawMapSprites(map2, map2Tiles);
  mapView1.zIndex = 0;
  mapView2.zIndex = 0;
  world.addChild(mapView1);
  const mapCatalog = { map1, map2 };
  const mapStates = {
    map1: buildMapState(zoneMaps.map1, map1, mapView1, mapCatalog),
    map2: buildMapState(zoneMaps.map2, map2, mapView2, mapCatalog),
  };

  function makeAnim(frames: PIXI.Texture[], speed = 0.1, autoPlay = true): PIXI.AnimatedSprite {
    const anim = new PIXI.AnimatedSprite(frames.length > 0 ? frames : [PIXI.Texture.WHITE]);
    anim.animationSpeed = speed;
    if (autoPlay) anim.play();
    return anim;
  }

  const playerSprite = makeAnim(spriteAtlas.entities.player.idle, 0.08);
  playerSprite.scale.set(3); // 16px → 48px
  const player = new ZEntity({
    sprite: playerSprite,
    gravity: 0,
    mass: 1,
    shadowRadiusX: 10,
    shadowRadiusY: 5,
    shadowOffsetY: 8,
  });
  player.zIndex = 2;
  player.sprite.anchor.set(0.5);
  player.pos.x = mapStates.map1.spawnX;
  player.pos.y = mapStates.map1.spawnY;
  player.pos.z = 0;
  world.addChild(player);

  const input = new Input();
  input.attach();
  const playerController = new PlayerController({
    entity: player,
    input,
    moveSpeed: 220,
    radius: 10,
  });
  const playerData = defaultPlayerData;
  playerController.setMoveSpeed(playerData.stats.moveSpeed);
  const playerRadius = 10;
  const npcRadius = 10;

  // Use atlas pixel-art projectile frames
  const projectileFrames = spriteAtlas.playerProjectile;
  const enemyProjectileTexture = spriteAtlas.enemyProjectile[0] ?? PIXI.Texture.WHITE;


  const createEnemyState = (
    data: EnemyData,
    frames: PIXI.Texture[],
    map: TileMap,
    mapId: string,
    type: "chaser" | "turret" | "shield",
    spawnX: number,
    spawnY: number
  ) => {
    const enemySprite = makeAnim(frames, 0.08);
    enemySprite.scale.set(3); // 16px → 48px
    const entity = new ZEntity({
      sprite: enemySprite,
      gravity: 0,
      mass: 1,
      shadowRadiusX: data.radius,
      shadowRadiusY: Math.round(data.radius * 0.45),
      shadowOffsetY: Math.round(data.radius * 0.7),
    });
    entity.zIndex = 2;
    entity.sprite.anchor.set(0.5);
    const spawn = findNearestOpen(map, spawnX, spawnY);
    entity.pos.x = spawn.x;
    entity.pos.y = spawn.y;
    entity.pos.z = 0;
    entity.renderUpdate();
    entity.visible = mapId === "map1";
    world.addChild(entity);

    const hpBar = new PIXI.Graphics();
    hpBar.zIndex = 3;
    hpBar.visible = mapId === "map1";
    world.addChild(hpBar);

    const label = new PIXI.Text({
      text: data.name,
      style: {
        fill: 0xf8fafc,
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 16,
        fontWeight: "700",
        stroke: { color: 0x0b1220, width: 3 },
        dropShadow: { alpha: 0.8, angle: Math.PI / 4, blur: 0, color: 0x000000, distance: 1 },
      },
    });
    label.anchor.set(0.5);
    label.zIndex = 3;
    label.visible = mapId === "map1";
    world.addChild(label);

    let shieldGfx: PIXI.Graphics | undefined;
    if (type === "shield") {
      shieldGfx = new PIXI.Graphics();
      shieldGfx.zIndex = 2;
      shieldGfx.visible = mapId === "map1";
      world.addChild(shieldGfx);
    }

    const aggroText = new PIXI.Text({
      text: "!",
      style: {
        fill: 0xfbbf24,
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 16,
        fontWeight: "700",
        stroke: { color: 0x000000, width: 3 },
        dropShadow: { alpha: 0.8, angle: Math.PI / 4, blur: 0, color: 0x000000, distance: 1 },
      },
    });
    aggroText.anchor.set(0.5);
    aggroText.zIndex = 4;
    aggroText.visible = false;
    world.addChild(aggroText);

    const telegraphGfx = new PIXI.Graphics();
    telegraphGfx.zIndex = 1;
    telegraphGfx.visible = false;
    world.addChild(telegraphGfx);

    return {
      entity,
      name: data.name,
      type,
      animState: "idle" as const,
      element: data.element,
      shieldAngle: type === "shield" ? 0 : undefined,
      shieldArcDeg: type === "shield" ? 120 : undefined,
      shieldGfx,
      radius: data.radius,
      maxHp: data.maxHp,
      hp: data.maxHp,
      hitTimer: 0,
      dead: false,
      deathTimer: 0,
      expGranted: false,
      respawnTimer: 0,
      respawnSeconds: data.respawnSeconds,
      hitFlashSeconds: data.hitFlashSeconds,
      labelOffsetY: data.labelOffsetY,
      mapId,
      speed: data.speed,
      aggroRange: data.aggroRange,
      stopRange: data.stopRange,
      patrolRadius: data.patrolRadius,
      attackRange: data.attackRange,
      attackWindupSeconds: data.attackWindupSeconds,
      attackCooldownSeconds: data.attackCooldownSeconds,
      attackCooldown: 0,
      attackTimer: 0,
      attackFlashTimer: 0,
      strafeSpeed: data.strafeSpeed,
      strafeSwitchSeconds: data.strafeSwitchSeconds,
      strafeSwitchTimer: data.strafeSwitchSeconds,
      strafeDir: 1,
      projectileSpeed: data.projectileSpeed,
      projectileDamage: data.projectileDamage,
      projectileRadius: data.projectileRadius,
      projectileLifetime: data.projectileLifetime,
      patrolAngle: 0,
      homeX: spawn.x,
      homeY: spawn.y,
      hpBar,
      label,
      aggroTimer: 0,
      wasAggro: false,
      aggroText,
      telegraphGfx,
      respawnFadeTimer: 0,
    };
  };

  const chaserSpawn = tileToWorld(map2, 12, 5);
  const turretSpawn = tileToWorld(map2, 5, 7);
  const shieldSpawn = tileToWorld(map2, 14, 7);
  const map1Chaser1Spawn = tileToWorld(map1, 15, 2);
  const map1Chaser2Spawn = tileToWorld(map1, 5, 10);
  const enemies = [
    createEnemyState(
      defaultEnemyData,
      spriteAtlas.entities.chaser.idle,
      map1,
      "map1",
      "chaser",
      map1Chaser1Spawn.x,
      map1Chaser1Spawn.y
    ),
    createEnemyState(
      defaultEnemyData,
      spriteAtlas.entities.chaser.idle,
      map1,
      "map1",
      "chaser",
      map1Chaser2Spawn.x,
      map1Chaser2Spawn.y
    ),
    createEnemyState(
      defaultEnemyData,
      spriteAtlas.entities.chaser.idle,
      map2,
      "map2",
      "chaser",
      chaserSpawn.x,
      chaserSpawn.y
    ),
    createEnemyState(
      turretEnemyData,
      spriteAtlas.entities.turret.idle,
      map2,
      "map2",
      "turret",
      turretSpawn.x,
      turretSpawn.y
    ),
    createEnemyState(
      shieldEnemyData,
      spriteAtlas.entities.shield.idle,
      map2,
      "map2",
      "shield",
      shieldSpawn.x,
      shieldSpawn.y
    ),
  ];

  const npcSprite = makeAnim(spriteAtlas.entities.npc.idle, 0.07);
  npcSprite.scale.set(3);
  const npc = new ZEntity({
    sprite: npcSprite,
    gravity: 0,
    mass: 1,
    shadowRadiusX: 10,
    shadowRadiusY: 5,
    shadowOffsetY: 8,
  });
  npc.sprite.anchor.set(0.5);
  const npc1Pos = tileToWorld(map1, 12, 6);
  npc.pos.x = npc1Pos.x;
  npc.pos.y = npc1Pos.y;
  npc.pos.z = 0;
  npc.renderUpdate();
  world.addChild(npc);

  const npc2Sprite = makeAnim(spriteAtlas.entities.npc2.idle, 0.07);
  npc2Sprite.scale.set(3);
  const npc2 = new ZEntity({
    sprite: npc2Sprite,
    gravity: 0,
    mass: 1,
    shadowRadiusX: 10,
    shadowRadiusY: 5,
    shadowOffsetY: 8,
  });
  npc2.sprite.anchor.set(0.5);
  const npc2Pos = tileToWorld(map2, 6, 6);
  npc2.pos.x = npc2Pos.x;
  npc2.pos.y = npc2Pos.y;
  npc2.pos.z = 0;
  npc2.renderUpdate();
  npc2.visible = false;
  world.addChild(npc2);

  const map1DoorRect = zoneMaps.map1.door
    ? rectToWorld(map1, zoneMaps.map1.door.rect)
    : null;
  const map2DoorRect = zoneMaps.map2.door
    ? rectToWorld(map2, zoneMaps.map2.door.rect)
    : null;

  const doorMarker1 = new PIXI.Container();
  const doorFrame1 = new PIXI.Graphics();
  doorFrame1.roundRect(0, 0, 18, 36, 6).stroke({ width: 2, color: 0x38bdf8, alpha: 0.9 });
  doorMarker1.addChild(doorFrame1);
  const doorLabel1 = new PIXI.Text({
    text: "Door",
    style: {
      fill: 0x93c5fd,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
    },
  });
  doorLabel1.position.set(-6, -14);
  doorMarker1.addChild(doorLabel1);
  if (map1DoorRect) {
    doorMarker1.position.set(
      map1DoorRect.xMin,
      map1DoorRect.centerY - map1.tileSize * 0.5
    );
  }
  world.addChild(doorMarker1);

  const doorMarker2 = new PIXI.Container();
  const doorFrame2 = new PIXI.Graphics();
  doorFrame2.roundRect(0, 0, 18, 36, 6).stroke({ width: 2, color: 0x38bdf8, alpha: 0.9 });
  doorMarker2.addChild(doorFrame2);
  const doorLabel2 = new PIXI.Text({
    text: "Door",
    style: {
      fill: 0x93c5fd,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
    },
  });
  doorLabel2.position.set(-6, -14);
  doorMarker2.addChild(doorLabel2);
  if (map2DoorRect) {
    doorMarker2.position.set(
      map2DoorRect.xMin,
      map2DoorRect.centerY - map2.tileSize * 0.5
    );
  }
  doorMarker2.visible = false;
  world.addChild(doorMarker2);

  const chestMarker = new PIXI.Container();
  const chestBox = new PIXI.Graphics();
  chestBox.roundRect(-8, -6, 16, 12, 3).fill({ color: 0xf59e0b, alpha: 0.9 });
  chestMarker.addChild(chestBox);
  const chestPos = tileToWorld(map1, 8, 8);
  chestMarker.position.set(chestPos.x, chestPos.y);
  world.addChild(chestMarker);

  const checkpointMarker = new PIXI.Container();
  const checkpointRing = new PIXI.Graphics();
  checkpointRing.circle(0, 0, 10).stroke({ width: 2, color: 0x22c55e, alpha: 0.9 });
  checkpointMarker.addChild(checkpointRing);
  const checkpointPos = tileToWorld(map1, 5, 9);
  checkpointMarker.position.set(checkpointPos.x, checkpointPos.y);
  world.addChild(checkpointMarker);

  const shopMarker = new PIXI.Container();
  const shopBox = new PIXI.Graphics();
  shopBox.roundRect(-10, -8, 20, 16, 4).fill({ color: 0xf472b6, alpha: 0.9 });
  shopMarker.addChild(shopBox);
  const shopPos = tileToWorld(map1, 14, 3);
  shopMarker.position.set(shopPos.x, shopPos.y);
  world.addChild(shopMarker);

  const eventMarker = new PIXI.Container();
  const eventOrb = new PIXI.Graphics();
  eventOrb.circle(0, 0, 8).fill({ color: 0x60a5fa, alpha: 0.85 });
  eventMarker.addChild(eventOrb);
  const eventPos = tileToWorld(map2, 10, 2);
  eventMarker.position.set(eventPos.x, eventPos.y);
  eventMarker.visible = false;
  world.addChild(eventMarker);

  const finishMarker = new PIXI.Container();
  const finishStar = new PIXI.Graphics();
  finishStar.poly([0, -10, 6, 0, 0, 10, -6, 0]).fill({ color: 0xfacc15, alpha: 0.9 });
  finishMarker.addChild(finishStar);
  const finishPos = tileToWorld(map2, 14, 8);
  finishMarker.position.set(finishPos.x, finishPos.y);
  finishMarker.visible = false;
  world.addChild(finishMarker);

  const uiLayer = new PIXI.Container();
  uiLayer.sortableChildren = true;
  uiLayer.zIndex = 10;
  app.stage.addChild(uiLayer);


  const rhythmOverlay = new PIXI.Graphics();
  rhythmOverlay.zIndex = -1;
  rhythmOverlay.visible = false;
  uiLayer.addChild(rhythmOverlay);

  const hud = new UIElement({
    width: 260,
    height: 140,
    anchor: "TopLeft",
    offsetX: 16,
    offsetY: 16,
  });
  const hudBg = new PIXI.Graphics();
  hudBg.roundRect(0, 0, hud.widthPx, hud.heightPx, 8).fill({ color: 0x0f1720, alpha: 0.7 }).stroke({ width: 1, color: 0x2b3440, alpha: 1 });
  hud.addChild(hudBg);

  const hudText = new PIXI.Text({
    text: "WASD / Arrows to move\nSpace to interact\nH: use item\nM/Esc for menu",
    style: {
      fill: 0xcbd5f5,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
    },
  });
  hudText.position.set(12, 28);
  hud.addChild(hudText);
  uiLayer.addChild(hud);

  const hudTitle = new PIXI.Text({
    text: "SYSTEMS",
    style: {
      fill: 0xe2e8f0,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 2,
    },
  });
  hudTitle.position.set(12, 8);
  hud.addChild(hudTitle);

  const hudHpBar = new PIXI.Graphics();
  hud.addChild(hudHpBar);

  const hudHpText = new PIXI.Text({
    text: "120/120",
    style: {
      fill: 0xf8fafc,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
    },
  });
  hudHpText.position.set(12, 60);
  hud.addChild(hudHpText);

  const chargeBar = new PIXI.Graphics();
  hud.addChild(chargeBar);

  const chargeLabel = new PIXI.Text({
    text: "Charging",
    style: {
      fill: 0x93c5fd,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
    },
  });
  chargeLabel.position.set(12, 116);
  hud.addChild(chargeLabel);

  const hudBeatRing = new PIXI.Graphics();
  hud.addChild(hudBeatRing);

  const hudBeatLabel = new PIXI.Text({
    text: "Beat 120",
    style: {
      fill: 0x93c5fd,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
    },
  });
  hud.addChild(hudBeatLabel);

  const topRight = new UIElement({
    width: 200,
    height: 54,
    anchor: "TopRight",
    offsetX: -16,
    offsetY: 16,
  });
  const topRightBg = new PIXI.Graphics();
  topRightBg.roundRect(0, 0, topRight.widthPx, topRight.heightPx, 8).fill({ color: 0x0f1720, alpha: 0.7 }).stroke({ width: 1, color: 0x2b3440, alpha: 1 });
  topRight.addChild(topRightBg);

  const hudLevelText = new PIXI.Text({
    text: "LV 1",
    style: {
      fill: 0xf8fafc,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
      fontWeight: "700",
    },
  });
  hudLevelText.position.set(12, 10);
  topRight.addChild(hudLevelText);

  const hudAccuracyText = new PIXI.Text({
    text: "Acc: -",
    style: {
      fill: 0x6ee7b7,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
    },
  });
  hudAccuracyText.position.set(12, 50);
  topRight.addChild(hudAccuracyText);

  const hudKillText = new PIXI.Text({
    text: "KL: 0",
    style: {
      fill: 0xfca5a5,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
    },
  });
  hudKillText.position.set(12, 70);
  topRight.addChild(hudKillText);

  const hudExpText = new PIXI.Text({
    text: "EXP 0/10",
    style: {
      fill: 0x93c5fd,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
    },
  });
  hudExpText.position.set(12, 30);
  topRight.addChild(hudExpText);

  uiLayer.addChild(topRight);

  const doorPrompt = new UIElement({
    width: 160,
    height: 36,
    anchor: "BottomCenter",
    offsetY: -24,
  });
  const doorPromptBg = new PIXI.Graphics();
  doorPromptBg.roundRect(0, 0, doorPrompt.widthPx, doorPrompt.heightPx, 6).fill({ color: 0x0f1720, alpha: 0.85 }).stroke({ width: 1, color: 0x2b3440, alpha: 1 });
  doorPrompt.addChild(doorPromptBg);

  const doorPromptText = new PIXI.Text({
    text: "Space: Enter",
    style: {
      fill: 0xf8fafc,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
      fontWeight: "600",
    },
  });
  doorPromptText.anchor.set(0.5);
  doorPromptText.position.set(doorPrompt.widthPx * 0.5, doorPrompt.heightPx * 0.5);
  doorPrompt.addChild(doorPromptText);
  doorPrompt.visible = false;
  uiLayer.addChild(doorPrompt);

  const triggerPrompt = new UIElement({
    width: 200,
    height: 36,
    anchor: "BottomCenter",
    offsetY: -64,
  });
  const triggerPromptBg = new PIXI.Graphics();
  triggerPromptBg.roundRect(0, 0, triggerPrompt.widthPx, triggerPrompt.heightPx, 6).fill({ color: 0x0f1720, alpha: 0.85 }).stroke({ width: 1, color: 0x2b3440, alpha: 1 });
  triggerPrompt.addChild(triggerPromptBg);

  const triggerPromptText = new PIXI.Text({
    text: "Space: Activate",
    style: {
      fill: 0xf8fafc,
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 16,
      fontWeight: "600",
    },
  });
  triggerPromptText.anchor.set(0.5);
  triggerPromptText.position.set(
    triggerPrompt.widthPx * 0.5,
    triggerPrompt.heightPx * 0.5
  );
  triggerPrompt.addChild(triggerPromptText);
  triggerPrompt.visible = false;
  uiLayer.addChild(triggerPrompt);

  const minimap = new UIElement({
    width: 140,
    height: 90,
    anchor: "TopRight",
    offsetX: -16,
    offsetY: 84,
  });
  const minimapBg = new PIXI.Graphics();
  minimapBg.roundRect(0, 0, minimap.widthPx, minimap.heightPx, 8).fill({ color: 0x0b1220, alpha: 0.65 }).stroke({ width: 1, color: 0x1f2937, alpha: 1 });
  minimap.addChild(minimapBg);
  const minimapView = new PIXI.Graphics();
  minimapView.position.set(8, 8);
  minimap.addChild(minimapView);
  minimap.visible = true;
  uiLayer.addChild(minimap);

  const abilityBar = new UIElement({
    width: 200,
    height: 64,
    anchor: "BottomLeft",
    offsetX: 16,
    offsetY: -16,
  });
  const abilitySlotBgs: PIXI.Graphics[] = [];
  const abilitySlotCooldowns: PIXI.Graphics[] = [];
  const abilitySlotCasts: PIXI.Graphics[] = [];
  const abilitySlotLabels: PIXI.Text[] = [];
  const abilitySlotKeys: PIXI.Text[] = [];

  for (let i = 0; i < 3; i += 1) {
    const bg = new PIXI.Graphics();
    abilityBar.addChild(bg);
    abilitySlotBgs.push(bg);

    const cooldown = new PIXI.Graphics();
    abilityBar.addChild(cooldown);
    abilitySlotCooldowns.push(cooldown);

    const cast = new PIXI.Graphics();
    abilityBar.addChild(cast);
    abilitySlotCasts.push(cast);

    const label = new PIXI.Text({
      text: "",
      style: {
        fill: 0xe2e8f0,
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 16,
        fontWeight: "600",
      },
    });
    label.anchor.set(0.5, 0.5);
    abilityBar.addChild(label);
    abilitySlotLabels.push(label);

    const keyLabel = new PIXI.Text({
      text: "",
      style: {
        fill: 0x93c5fd,
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 16,
        fontWeight: "700",
      },
    });
    keyLabel.anchor.set(1, 1);
    abilityBar.addChild(keyLabel);
    abilitySlotKeys.push(keyLabel);
  }

  uiLayer.addChild(abilityBar);

  const runSummaryUI = new RunSummaryUI(360, 220);
  runSummaryUI.root.zIndex = 20;
  runSummaryUI.setVisible(false);
  uiLayer.addChild(runSummaryUI.root);

  const settingsSystem = new SettingsSystem();
  let state: GameState;
  const settingsUI = new SettingsUI(
    360,
    200,
    () => settingsSystem.toggleMetronome(state),
    () => settingsSystem.cycleVolume(state)
  );
  settingsUI.root.zIndex = 30;
  settingsUI.setVisible(false);
  uiLayer.addChild(settingsUI.root);

  const menu = new MenuSystem();
  menu.registerTabs(defaultPlayerData);
  uiLayer.addChild(menu);

  const dialogEngine = new DialogEngine(npcDialog, {
    openShop: () => {
      menu.open();
    },
    buyPotion: () => {
      if (playerData.credits < itemDefs.potion.price) {
        return;
      }
      playerData.credits -= itemDefs.potion.price;
      addItemById(playerData, itemDefs.potion.id, 1);
    },
    buyTonic: () => {
      if (playerData.credits < itemDefs.tonic.price) {
        return;
      }
      playerData.credits -= itemDefs.tonic.price;
      addItemById(playerData, itemDefs.tonic.id, 1);
    },
    buyKit: () => {
      if (playerData.credits < itemDefs.kit.price) {
        return;
      }
      playerData.credits -= itemDefs.kit.price;
      addItemById(playerData, itemDefs.kit.id, 1);
    },
    onGreet: () => {
      player.sprite.tint = 0x93c5fd;
      setTimeout(() => {
        player.sprite.tint = 0xffffff;
      }, 180);
    },
    unlockPath: () => {
      eventOrb.tint = 0xffffff;
    },
  });
  const dialogUI = new DialogUI(300, 140);
  dialogUI.setVisible(false);
  uiLayer.addChild(dialogUI.root);

  const levelUpUI = new LevelUpUI(360, 200);
  levelUpUI.setVisible(false);
  uiLayer.addChild(levelUpUI.root);

  const aimLine = new PIXI.Graphics();
  aimLine.zIndex = 4;
  world.addChild(aimLine);

  const lockIndicator = new PIXI.Graphics();
  lockIndicator.zIndex = 5;
  world.addChild(lockIndicator);

  const chargeRing = new PIXI.Graphics();
  chargeRing.zIndex = 6;
  chargeRing.blendMode = "add";
  world.addChild(chargeRing);

  const elementHudIcon = new PIXI.Text({
    text: "Neutral",
    style: { fill: 0xfbbf24, fontFamily: '"Press Start 2P", monospace', fontSize: 16, fontWeight: "700" },
  });
  elementHudIcon.anchor.set(0, 0.5);
  hud.addChild(elementHudIcon);

  const comboHudText = new PIXI.Text({
    text: "",
    style: { fill: 0xffffff, fontFamily: '"Press Start 2P", monospace', fontSize: 16, fontWeight: "900" },
  });
  comboHudText.anchor.set(0, 0.5);
  comboHudText.visible = false;
  hud.addChild(comboHudText);

  const transitionOverlay = new PIXI.Graphics();
  transitionOverlay.zIndex = 999;
  transitionOverlay.visible = false;
  uiLayer.addChild(transitionOverlay);

  // Screen flash: full-stage rect above UI, triggered by hits/deaths
  const screenFlashGfx = new PIXI.Graphics();
  screenFlashGfx.zIndex = 20;
  app.stage.addChild(screenFlashGfx);

  // Scanline CRT overlay: tile a 2-row texture (transparent row + dark line row).
  // frame is specified explicitly so generateTexture captures the full 2px height
  // even though row 0 is empty (transparent).
  const scanlinePatternGfx = new PIXI.Graphics();
  scanlinePatternGfx.rect(0, 1, 2, 1).fill({ color: 0x000000, alpha: 1 });
  const scanlineTex = (app.renderer as PIXI.Renderer).generateTexture({
    target: scanlinePatternGfx,
    frame: new PIXI.Rectangle(0, 0, 2, 2),
    textureSourceOptions: { scaleMode: "nearest" },
  });
  overlayRef.scanline = new PIXI.TilingSprite({
    texture: scanlineTex,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  overlayRef.scanline.alpha = 0.18;
  overlayRef.scanline.zIndex = 30;
  app.stage.addChild(overlayRef.scanline);

  const levelUpSystem = new LevelUpSystem();

  state = {
    app,
    world,
    worldBg,
    map: mapStates.map1.map,
    mapView: mapStates.map1.view,
    maps: mapStates,
    currentMapId: "map1",
    input,
    player,
    playerAnimState: "idle",
    playerController,
    playerRadius,
    playerHitTimer: 0,
    playerKnockbackTimer: 0,
    hitStopTimer: 0,
    hitStopDuration: 0.06,
    playerDamageMult: 1,
    playerDamageMultTimer: 0,
    playerHpGhostRatio: 1,
    dodgeRoll: {
      active: false,
      timer: 0,
      duration: 0.35,
      invincStart: 0.075,
      invincEnd: 0.275,
      invincActive: false,
      dirX: 0,
      dirY: 0,
      speed: 560,
    },
    checkpoint: null,
    npcs: [
      { entity: npc, radius: npcRadius, dialogId: "npc", mapId: "map1" },
      { entity: npc2, radius: npcRadius, dialogId: "npc2", mapId: "map2" },
    ],
    menu,
    hud,
    hudBg,
    hudText,
    hudTopRight: topRight,
    hudTopRightBg: topRightBg,
    hudTitle,
    hudHpBar,
    hudHpText,
    hudLevelText,
    hudExpText,
    hudAccuracyText,
    hudKillText,
    footstepTimer: 0,
    killCount: 0,
    chargeBar,
    chargeLabel,
    hudBeatRing,
    hudBeatLabel,
    rhythmOverlay,
    abilities: [],
    abilityBar: {
      root: abilityBar,
      slotBgs: abilitySlotBgs,
      slotLabels: abilitySlotLabels,
      slotKeys: abilitySlotKeys,
      slotCooldowns: abilitySlotCooldowns,
      slotCasts: abilitySlotCasts,
    },
    dialog: {
      open: false,
      dialogs: { npc: npcDialog, npc2: npc2Dialog, event: eventDialog, shop: shopDialog },
      activeId: null,
      engine: dialogEngine,
      ui: dialogUI,
      charIndex: 0,
      charTimer: 0,
      charsPerSecond: 28,
    },
    aim: {
      line: aimLine,
      active: false,
      x: 0,
      y: 0,
      chargeActive: false,
      chargeStartMs: 0,
      chargeRatio: 0,
      chargeThresholdMs: 2000,
      chargeRing,
      lockedEnemyIndex: null,
      lockRange: 200,
      lockConeHalfAngle: Math.PI / 6,
      lockIndicator,
    },
    rhythm: {
      bpm: zoneConfigs.map1.rhythm.bpm,
      beatInterval: 60 / zoneConfigs.map1.rhythm.bpm,
      time: 0,
      totalTime: 0,
      windowSeconds: zoneConfigs.map1.rhythm.windowSeconds,
      onBeat: false,
      pulse: 0,
      pulseDecay: 6,
      lastBeat: -1,
      onBeatDamageMult: zoneConfigs.map1.rhythm.onBeatDamageMult,
      startTimeMs: null,
      overlayAlpha: 0,
      overlayDecay: 2.5,
      audioEnabled: true,
      audioUnlocked: false,
      audioContext: null,
      tickVolume: 0.12,
      shotsOnBeat: 0,
      shotsTotal: 0,
      bgLoopStarted: false,
      audioBeatOrigin: null,
      bgLoopGeneration: 0,
    },
    camera: {
      world,
      shakeTime: 0,
      shakeAmp: 0,
      shakeFreq: 26,
    },
    levelUpSystem,
    levelUp: {
      active: false,
      options: [],
      selectedIndex: 0,
      ui: levelUpUI,
    },
    projectiles: [],
    projectilePool: [],
    enemyProjectiles: [],
    enemyProjectilePool: [],
    enemyProjectileTexture,
    enemies,
    spriteAtlas,
    damageTexts: [],
    damageTextPool: [],
    impactParticles: [],
    impactParticlePool: [],
    hitMarkers: [],
    hitMarkerPool: [],
    impactRings: [],
    impactRingPool: [],
    comboPops: [],
    playerData,
    doorMarkers: [
      { mapId: "map1", view: doorMarker1 },
      { mapId: "map2", view: doorMarker2 },
    ],
    doorPrompt,
    doorPromptBg,
    doorPromptText,
    triggers: [],
    triggerPrompt,
    triggerPromptBg,
    triggerPromptText,
    minimap,
    minimapBg,
    minimapView,
    minimapScale: 0.15,
    transitionOverlay,
    transitionPhase: "idle",
    transitionTime: 0,
    transitionDuration: 0.4,
    transitionTargetMapId: null,
    transitionTargetSpawn: null,
    runSummary: {
      open: false,
      ui: runSummaryUI,
    },
    settings: {
      open: false,
      ui: settingsUI,
    },
    element: {
      current: "Neutral",
      hudIcon: elementHudIcon,
    },
    combo: {
      count: 0,
      multiplier: 1,
      resetTimer: 0,
      hudText: comboHudText,
      hudPulse: 0,
    },
    screenFlash: { gfx: screenFlashGfx, alpha: 0, color: 0xffffff },
  };

  state.abilities = createAbilityStates(state);
  state.triggers = [
    {
      id: "chest-1",
      mapId: "map1",
      type: "loot",
      xMin: chestMarker.position.x - 14,
      xMax: chestMarker.position.x + 14,
      yMin: chestMarker.position.y - 14,
      yMax: chestMarker.position.y + 14,
      prompt: "Space: Open Chest",
      once: true,
      triggered: false,
      view: chestMarker,
      rewards: {
        credits: 30,
        items: [
          { id: "coil", name: "Flux Coil", rarity: "Rare", quantity: 1 },
          { id: "kit", name: "Repair Kit", rarity: "Common", quantity: 2 },
        ],
      },
      onTrigger: () => {
        chestBox.clear();
        chestBox.roundRect(-8, -6, 16, 12, 3).fill({ color: 0x92400e, alpha: 0.9 });
      },
    },
    {
      id: "checkpoint-1",
      mapId: "map1",
      type: "checkpoint",
      xMin: checkpointMarker.position.x - 16,
      xMax: checkpointMarker.position.x + 16,
      yMin: checkpointMarker.position.y - 16,
      yMax: checkpointMarker.position.y + 16,
      prompt: "Space: Save Checkpoint",
      once: false,
      triggered: false,
      view: checkpointMarker,
      rewards: {
        flags: ["checkpoint-1"],
      },
      onTrigger: () => {
        checkpointRing.tint = 0x86efac;
      },
    },
    {
      id: "event-1",
      mapId: "map2",
      type: "event",
      xMin: eventMarker.position.x - 16,
      xMax: eventMarker.position.x + 16,
      yMin: eventMarker.position.y - 16,
      yMax: eventMarker.position.y + 16,
      prompt: "Space: Activate Console",
      once: true,
      triggered: false,
      view: eventMarker,
      dialogId: "event",
      rewards: {
        flags: ["console-activated"],
      },
      onTrigger: () => {
        eventOrb.tint = 0x94a3b8;
      },
    },
    {
      id: "shop-1",
      mapId: "map1",
      type: "shop",
      xMin: shopMarker.position.x - 16,
      xMax: shopMarker.position.x + 16,
      yMin: shopMarker.position.y - 16,
      yMax: shopMarker.position.y + 16,
      prompt: "Space: Shop",
      once: false,
      triggered: false,
      view: shopMarker,
      dialogId: "shop",
    },
    {
      id: "run-end",
      mapId: "map2",
      type: "runEnd",
      xMin: finishMarker.position.x - 16,
      xMax: finishMarker.position.x + 16,
      yMin: finishMarker.position.y - 16,
      yMax: finishMarker.position.y + 16,
      prompt: "Space: Finish Run",
      once: true,
      triggered: false,
      view: finishMarker,
      onTrigger: () => {
        finishStar.tint = 0xfde047;
      },
    },
  ];

  setupPointerSystem(state, projectileFrames);

  const menuToggleSystem = new MenuToggleSystem();
  const triggerSystem = new TriggerSystem();
  const dialogSystem = new DialogSystem();
  const playerSystem = new PlayerSystem();
  const itemSystem = new ItemSystem();
  const abilitySystem = new AbilitySystem();
  const rhythmSystem = new RhythmSystem();
  const runSummarySystem = new RunSummarySystem();
  const elementSystem = new ElementSystem();
  const aimSystem = new AimSystem();
  const combatSystem = new CombatSystem();
  const combatFXSystem = new CombatFXSystem();
  const uiSystem = new UISystem();
  const cameraSystem = new CameraSystem();
  const hudSystem = new HUDSystem();
  const enemyAISystem = new EnemyAISystem();
  const animationSystem = new AnimationSystem();
  const mapSystem = new MapSystem();
  const minimapSystem = new MinimapSystem();

  // Apply saved progress
  const saved = loadSave();
  if (saved) {
    state.playerData.stats.level = saved.level;
    state.playerData.stats.exp = saved.exp;
    state.killCount = saved.killCount;
  }

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    if (state.hitStopTimer > 0) {
      state.hitStopTimer = Math.max(0, state.hitStopTimer - dt);
    }
    const simDt = state.hitStopTimer > 0 ? 0 : dt;

    // Start background music once audio is unlocked
    if (state.rhythm.audioUnlocked && !state.rhythm.bgLoopStarted) {
      SoundSystem.startBackgroundTrack(state);
    }
    menuToggleSystem.update(state);
    triggerSystem.update(state);
    dialogSystem.update(state, simDt);
    playerSystem.update(state, simDt);
    itemSystem.update(state);
    abilitySystem.update(state, simDt);
    rhythmSystem.update(state, simDt);
    runSummarySystem.update(state);
    settingsSystem.update(state);
    mapSystem.update(state, simDt);
    enemyAISystem.update(state, simDt);
    animationSystem.update(state, simDt);
    elementSystem.update(state);
    aimSystem.update(state);
    combatSystem.update(state, simDt);
    combatFXSystem.update(state, simDt);
    levelUpSystem.update(state);
    cameraSystem.update(state, simDt);
    uiSystem.update(state, dt);
    minimapSystem.update(state);
    hudSystem.update(state, dt);

    // Screen flash decay
    const sf = state.screenFlash;
    if (sf.alpha > 0) {
      sf.alpha = Math.max(0, sf.alpha - dt * 5);
      sf.gfx.clear();
      sf.gfx
        .rect(0, 0, app.renderer.width, app.renderer.height)
        .fill({ color: sf.color, alpha: sf.alpha });
    } else if (sf.gfx.alpha !== 0) {
      sf.gfx.clear();
    }
  });
};

if (typeof window !== "undefined") {
  void bootstrap();
}
