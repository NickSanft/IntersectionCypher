import * as PIXI from "pixi.js";
import { ZEntity } from "./entities/ZEntity";
import type { TileMap, TileDef } from "./core/world/TileMap";
import { tileIndex } from "./core/world/TileMap";
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
import type { GameState } from "./game/types";
import { defaultPlayerData } from "./game/data/PlayerData";
import { defaultEnemyData, turretEnemyData, type EnemyData } from "./game/data/EnemyData";
import { findNearestOpen } from "./core/world/MapUtils";
import npcDialog from "./game/dialogs/npc.json";
import npc2Dialog from "./game/dialogs/npc2.json";
import { DialogEngine } from "./game/dialog/DialogEngine";
import { DialogUI } from "./game/dialog/DialogUI";
import { LevelUpUI } from "./game/level/LevelUpUI";
import { LevelUpSystem } from "./game/systems/LevelUpSystem";

const buildTestMap = (tileSize: number): TileMap => {
  const width = 20;
  const height = 12;
  const defs: TileDef[] = [
    { id: 0, solid: "None", height: 0 },
    { id: 1, solid: "Solid", height: 96 },
  ];
  const tiles = new Uint16Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      tiles[tileIndex(x, y, width)] = isBorder ? 1 : 0;
    }
  }

  const pillars = [
    { x: 6, y: 4 },
    { x: 13, y: 7 },
    { x: 9, y: 2 },
  ];
  for (const pillar of pillars) {
    tiles[tileIndex(pillar.x, pillar.y, width)] = 1;
  }

  return { width, height, tileSize, tiles, defs };
};

const buildTestMap2 = (tileSize: number): TileMap => {
  const width = 18;
  const height = 10;
  const defs: TileDef[] = [
    { id: 0, solid: "None", height: 0 },
    { id: 1, solid: "Solid", height: 96 },
  ];
  const tiles = new Uint16Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      tiles[tileIndex(x, y, width)] = isBorder ? 1 : 0;
    }
  }

  for (let x = 3; x < 15; x += 1) {
    tiles[tileIndex(x, 4, width)] = 1;
  }

  return { width, height, tileSize, tiles, defs };
};

const drawMap = (map: TileMap): PIXI.Container => {
  const container = new PIXI.Container();
  const gfx = new PIXI.Graphics();

  gfx.beginFill(0x15202b);
  gfx.drawRect(0, 0, map.width * map.tileSize, map.height * map.tileSize);
  gfx.endFill();

  gfx.beginFill(0x2c3e50);
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const def = map.defs[map.tiles[tileIndex(x, y, map.width)]];
      if (def.solid !== "Solid") {
        continue;
      }
      gfx.drawRect(x * map.tileSize, y * map.tileSize, map.tileSize, map.tileSize);
    }
  }
  gfx.endFill();

  gfx.lineStyle(1, 0x0f141a, 0.6);
  for (let y = 0; y <= map.height; y += 1) {
    gfx.moveTo(0, y * map.tileSize);
    gfx.lineTo(map.width * map.tileSize, y * map.tileSize);
  }
  for (let x = 0; x <= map.width; x += 1) {
    gfx.moveTo(x * map.tileSize, 0);
    gfx.lineTo(x * map.tileSize, map.height * map.tileSize);
  }

  container.addChild(gfx);
  return container;
};

const bootstrap = async (): Promise<void> => {
  const app = new PIXI.Application();
  await app.init({
    background: "#0b0f14",
    resizeTo: window,
    antialias: true,
  });

  const host = document.querySelector<HTMLDivElement>("#app");
  if (!host) {
    throw new Error("Missing #app host element");
  }
  host.appendChild(app.canvas);
  app.stage.sortableChildren = true;
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  const world = new PIXI.Container();
  world.sortableChildren = true;
  world.zIndex = 0;
  app.stage.addChild(world);

  const map1 = buildTestMap(48);
  const map2 = buildTestMap2(48);
  const mapView1 = drawMap(map1);
  const mapView2 = drawMap(map2);
  mapView1.zIndex = 0;
  mapView2.zIndex = 0;
  world.addChild(mapView1);

  const playerTexture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0x4ade80);
    gfx.drawCircle(0, 0, 10);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
  })();

  const player = new ZEntity({
    sprite: new PIXI.Sprite(playerTexture),
    gravity: 0,
    mass: 1,
  });
  player.zIndex = 2;
  player.sprite.anchor.set(0.5);
  player.pos.x = map1.tileSize * 4;
  player.pos.y = map1.tileSize * 4;
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
  playerController.setMoveSpeed(defaultPlayerData.stats.moveSpeed);
  const playerRadius = 10;
  const npcRadius = 10;

  const projectileTexture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0xfbbf24);
    gfx.drawCircle(0, 0, 4);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
  })();

  const enemyProjectileTexture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0x38bdf8);
    gfx.drawCircle(0, 0, 5);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
  })();

  const enemyTexture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0xef4444);
    gfx.drawRoundedRect(0, 0, 26, 26, 6);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
  })();

  const turretTexture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0x38bdf8);
    gfx.drawRoundedRect(0, 0, 24, 24, 6);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
  })();

  const createEnemyState = (
    data: EnemyData,
    texture: PIXI.Texture,
    map: TileMap,
    mapId: string,
    type: "chaser" | "turret",
    spawnX: number,
    spawnY: number
  ) => {
    const entity = new ZEntity({
      sprite: new PIXI.Sprite(texture),
      gravity: 0,
      mass: 1,
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
        fontFamily: "Arial",
        fontSize: 12,
        fontWeight: "700",
        stroke: 0x0b1220,
        strokeThickness: 3,
      },
    });
    label.anchor.set(0.5);
    label.zIndex = 3;
    label.visible = mapId === "map1";
    world.addChild(label);

    return {
      entity,
      name: data.name,
      type,
      radius: data.radius,
      maxHp: data.maxHp,
      hp: data.maxHp,
      hitTimer: 0,
      dead: false,
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
    };
  };

  const enemies = [
    createEnemyState(
      defaultEnemyData,
      enemyTexture,
      map2,
      "map2",
      "chaser",
      map2.tileSize * 12,
      map2.tileSize * 5
    ),
    createEnemyState(
      turretEnemyData,
      turretTexture,
      map2,
      "map2",
      "turret",
      map2.tileSize * 5,
      map2.tileSize * 7
    ),
  ];

  const npcTexture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0xf472b6);
    gfx.drawCircle(0, 0, 10);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
  })();

  const npc = new ZEntity({
    sprite: new PIXI.Sprite(npcTexture),
    gravity: 0,
    mass: 1,
  });
  npc.sprite.anchor.set(0.5);
  npc.pos.x = map1.tileSize * 12;
  npc.pos.y = map1.tileSize * 6;
  npc.pos.z = 0;
  npc.renderUpdate();
  world.addChild(npc);

  const npc2Texture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0xa855f7);
    gfx.drawCircle(0, 0, 10);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
  })();

  const npc2 = new ZEntity({
    sprite: new PIXI.Sprite(npc2Texture),
    gravity: 0,
    mass: 1,
  });
  npc2.sprite.anchor.set(0.5);
  npc2.pos.x = map2.tileSize * 6;
  npc2.pos.y = map2.tileSize * 6;
  npc2.pos.z = 0;
  npc2.renderUpdate();
  npc2.visible = false;
  world.addChild(npc2);

  const doorMarker1 = new PIXI.Container();
  const doorFrame1 = new PIXI.Graphics();
  doorFrame1.lineStyle(2, 0x38bdf8, 0.9);
  doorFrame1.drawRoundedRect(0, 0, 18, 36, 6);
  doorFrame1.endFill();
  doorMarker1.addChild(doorFrame1);
  const doorLabel1 = new PIXI.Text({
    text: "Door",
    style: {
      fill: 0x93c5fd,
      fontFamily: "Arial",
      fontSize: 10,
    },
  });
  doorLabel1.position.set(-6, -14);
  doorMarker1.addChild(doorLabel1);
  doorMarker1.position.set(map1.tileSize * (map1.width - 2), map1.tileSize * 5);
  world.addChild(doorMarker1);

  const doorMarker2 = new PIXI.Container();
  const doorFrame2 = new PIXI.Graphics();
  doorFrame2.lineStyle(2, 0x38bdf8, 0.9);
  doorFrame2.drawRoundedRect(0, 0, 18, 36, 6);
  doorFrame2.endFill();
  doorMarker2.addChild(doorFrame2);
  const doorLabel2 = new PIXI.Text({
    text: "Door",
    style: {
      fill: 0x93c5fd,
      fontFamily: "Arial",
      fontSize: 10,
    },
  });
  doorLabel2.position.set(-6, -14);
  doorMarker2.addChild(doorLabel2);
  doorMarker2.position.set(map2.tileSize * 1, map2.tileSize * 5);
  doorMarker2.visible = false;
  world.addChild(doorMarker2);

  const uiLayer = new PIXI.Container();
  uiLayer.sortableChildren = true;
  uiLayer.zIndex = 10;
  app.stage.addChild(uiLayer);

  const hud = new UIElement({
    width: 260,
    height: 140,
    anchor: "TopLeft",
    offsetX: 16,
    offsetY: 16,
  });
  const hudBg = new PIXI.Graphics();
  hudBg.beginFill(0x0f1720, 0.7);
  hudBg.lineStyle(1, 0x2b3440, 1);
  hudBg.drawRoundedRect(0, 0, hud.widthPx, hud.heightPx, 8);
  hudBg.endFill();
  hud.addChild(hudBg);

  const hudText = new PIXI.Text({
    text: "WASD / Arrows to move\nSpace to interact\nM/Esc for menu",
    style: {
      fill: 0xcbd5f5,
      fontFamily: "Arial",
      fontSize: 12,
    },
  });
  hudText.position.set(12, 28);
  hud.addChild(hudText);
  uiLayer.addChild(hud);

  const hudTitle = new PIXI.Text({
    text: "SYSTEMS",
    style: {
      fill: 0xe2e8f0,
      fontFamily: "Arial",
      fontSize: 12,
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
      fontFamily: "Arial",
      fontSize: 11,
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
      fontFamily: "Arial",
      fontSize: 11,
    },
  });
  chargeLabel.position.set(12, 116);
  hud.addChild(chargeLabel);

  const topRight = new UIElement({
    width: 200,
    height: 54,
    anchor: "TopRight",
    offsetX: -16,
    offsetY: 16,
  });
  const topRightBg = new PIXI.Graphics();
  topRightBg.beginFill(0x0f1720, 0.7);
  topRightBg.lineStyle(1, 0x2b3440, 1);
  topRightBg.drawRoundedRect(0, 0, topRight.widthPx, topRight.heightPx, 8);
  topRightBg.endFill();
  topRight.addChild(topRightBg);

  const hudLevelText = new PIXI.Text({
    text: "LV 1",
    style: {
      fill: 0xf8fafc,
      fontFamily: "Arial",
      fontSize: 12,
      fontWeight: "700",
    },
  });
  hudLevelText.position.set(12, 10);
  topRight.addChild(hudLevelText);

  const hudExpText = new PIXI.Text({
    text: "EXP 0/10",
    style: {
      fill: 0x93c5fd,
      fontFamily: "Arial",
      fontSize: 11,
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
  doorPromptBg.beginFill(0x0f1720, 0.85);
  doorPromptBg.lineStyle(1, 0x2b3440, 1);
  doorPromptBg.drawRoundedRect(0, 0, doorPrompt.widthPx, doorPrompt.heightPx, 6);
  doorPromptBg.endFill();
  doorPrompt.addChild(doorPromptBg);

  const doorPromptText = new PIXI.Text({
    text: "Space: Enter",
    style: {
      fill: 0xf8fafc,
      fontFamily: "Arial",
      fontSize: 11,
      fontWeight: "600",
    },
  });
  doorPromptText.anchor.set(0.5);
  doorPromptText.position.set(doorPrompt.widthPx * 0.5, doorPrompt.heightPx * 0.5);
  doorPrompt.addChild(doorPromptText);
  doorPrompt.visible = false;
  uiLayer.addChild(doorPrompt);

  const minimap = new UIElement({
    width: 140,
    height: 90,
    anchor: "TopRight",
    offsetX: -16,
    offsetY: 84,
  });
  const minimapBg = new PIXI.Graphics();
  minimapBg.beginFill(0x0b1220, 0.65);
  minimapBg.lineStyle(1, 0x1f2937, 1);
  minimapBg.drawRoundedRect(0, 0, minimap.widthPx, minimap.heightPx, 8);
  minimapBg.endFill();
  minimap.addChild(minimapBg);
  const minimapView = new PIXI.Graphics();
  minimapView.position.set(8, 8);
  minimap.addChild(minimapView);
  minimap.visible = false;
  uiLayer.addChild(minimap);

  const menu = new MenuSystem();
  menu.registerTabs(defaultPlayerData);
  uiLayer.addChild(menu);

  const dialogEngine = new DialogEngine(npcDialog, {
    openShop: () => {
      menu.open();
    },
    onGreet: () => {
      player.sprite.tint = 0x93c5fd;
      setTimeout(() => {
        player.sprite.tint = 0xffffff;
      }, 180);
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

  const chargeRing = new PIXI.Graphics();
  chargeRing.zIndex = 6;
  chargeRing.blendMode = "add";
  world.addChild(chargeRing);

  const transitionOverlay = new PIXI.Graphics();
  transitionOverlay.zIndex = 999;
  transitionOverlay.visible = false;
  uiLayer.addChild(transitionOverlay);

  const levelUpSystem = new LevelUpSystem();

  const state: GameState = {
    app,
    world,
    map: map1,
    mapView: mapView1,
    maps: {
      map1: {
        id: "map1",
        map: map1,
        view: mapView1,
        spawnX: map1.tileSize * 4,
        spawnY: map1.tileSize * 4,
        door: {
          to: "map2",
          xMin: map1.tileSize * (map1.width - 2),
          xMax: map1.tileSize * (map1.width - 1),
          yMin: map1.tileSize * 4,
          yMax: map1.tileSize * 7,
          spawnX: map2.tileSize * 3,
          spawnY: map2.tileSize * 3,
        },
      },
      map2: {
        id: "map2",
        map: map2,
        view: mapView2,
        spawnX: map2.tileSize * 2,
        spawnY: map2.tileSize * 5,
        door: {
          to: "map1",
          xMin: map2.tileSize * 1,
          xMax: map2.tileSize * 2,
          yMin: map2.tileSize * 4,
          yMax: map2.tileSize * 6,
          spawnX: map1.tileSize * 3,
          spawnY: map1.tileSize * 5,
        },
      },
    },
    currentMapId: "map1",
    input,
    player,
    playerController,
    playerRadius,
    playerHitTimer: 0,
    playerKnockbackTimer: 0,
    hitStopTimer: 0,
    hitStopDuration: 0.06,
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
    chargeBar,
    chargeLabel,
    dialog: {
      open: false,
      dialogs: { npc: npcDialog, npc2: npc2Dialog },
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
    damageTexts: [],
    damageTextPool: [],
    impactParticles: [],
    impactParticlePool: [],
    hitMarkers: [],
    hitMarkerPool: [],
    playerData: defaultPlayerData,
    doorMarkers: [
      { mapId: "map1", view: doorMarker1 },
      { mapId: "map2", view: doorMarker2 },
    ],
    doorPrompt,
    doorPromptBg,
    doorPromptText,
    minimap,
    minimapBg,
    minimapView,
    minimapScale: 0.15,
    transitionOverlay,
    transitionPhase: "idle",
    transitionTime: 0,
    transitionDuration: 0.25,
    transitionTargetMapId: null,
    transitionTargetSpawn: null,
  };

  setupPointerSystem(state, projectileTexture);

  const menuToggleSystem = new MenuToggleSystem();
  const dialogSystem = new DialogSystem();
  const playerSystem = new PlayerSystem();
  const aimSystem = new AimSystem();
  const combatSystem = new CombatSystem();
  const combatFXSystem = new CombatFXSystem();
  const uiSystem = new UISystem();
  const cameraSystem = new CameraSystem();
  const hudSystem = new HUDSystem();
  const enemyAISystem = new EnemyAISystem();
  const mapSystem = new MapSystem();

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    if (state.hitStopTimer > 0) {
      state.hitStopTimer = Math.max(0, state.hitStopTimer - dt);
    }
    const simDt = state.hitStopTimer > 0 ? 0 : dt;
    menuToggleSystem.update(state);
    dialogSystem.update(state, simDt);
    playerSystem.update(state, simDt);
    mapSystem.update(state, simDt);
    enemyAISystem.update(state, simDt);
    aimSystem.update(state);
    combatSystem.update(state, simDt);
    combatFXSystem.update(state, simDt);
    levelUpSystem.update(state);
    cameraSystem.update(state, simDt);
    uiSystem.update(state, dt);
    hudSystem.update(state);
  });
};

void bootstrap();
