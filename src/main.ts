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
import type { GameState } from "./game/types";
import { defaultPlayerData } from "./game/data/PlayerData";
import { defaultEnemyData } from "./game/data/EnemyData";
import npcDialog from "./game/dialogs/npc.json";
import { DialogEngine } from "./game/dialog/DialogEngine";
import { DialogUI } from "./game/dialog/DialogUI";

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

  const map = buildTestMap(48);
  const mapView = drawMap(map);
  mapView.zIndex = 0;
  world.addChild(mapView);

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
  player.pos.x = map.tileSize * 4;
  player.pos.y = map.tileSize * 4;
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

  const enemy = new ZEntity({
    sprite: new PIXI.Sprite(enemyTexture),
    gravity: 0,
    mass: 1,
  });
  enemy.zIndex = 2;
  enemy.sprite.anchor.set(0.5);
  enemy.pos.x = map.tileSize * 14;
  enemy.pos.y = map.tileSize * 4;
  enemy.pos.z = 0;
  enemy.renderUpdate();
  world.addChild(enemy);

  const enemyHpBar = new PIXI.Graphics();
  enemyHpBar.zIndex = 3;
  world.addChild(enemyHpBar);

  const enemyLabel = new PIXI.Text({
    text: defaultEnemyData.name,
    style: {
      fill: 0xf8fafc,
      fontFamily: "Arial",
      fontSize: 12,
      fontWeight: "700",
      stroke: 0x0b1220,
      strokeThickness: 3,
    },
  });
  enemyLabel.anchor.set(0.5);
  enemyLabel.zIndex = 3;
  world.addChild(enemyLabel);

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
  npc.pos.x = map.tileSize * 12;
  npc.pos.y = map.tileSize * 6;
  npc.pos.z = 0;
  npc.renderUpdate();
  world.addChild(npc);

  const uiLayer = new PIXI.Container();
  uiLayer.sortableChildren = true;
  uiLayer.zIndex = 10;
  app.stage.addChild(uiLayer);

  const hud = new UIElement({
    width: 260,
    height: 120,
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
  hudText.position.set(12, 12);
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
  hudHpText.position.set(12, 54);
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
  chargeLabel.position.set(12, 100);
  hud.addChild(chargeLabel);

  const menu = new MenuSystem();
  menu.registerTabs(defaultPlayerData);
  uiLayer.addChild(menu);

  const dialogEngine = new DialogEngine(npcDialog, {
    openShop: () => {
      menu.open();
    },
  });
  const dialogUI = new DialogUI(300, 140);
  dialogUI.setVisible(false);
  uiLayer.addChild(dialogUI.root);

  const aimLine = new PIXI.Graphics();
  aimLine.zIndex = 4;
  world.addChild(aimLine);

  const chargeRing = new PIXI.Graphics();
  chargeRing.zIndex = 6;
  chargeRing.blendMode = "add";
  world.addChild(chargeRing);

  const state: GameState = {
    app,
    world,
    map,
    input,
    player,
    playerController,
    playerRadius,
    playerHitTimer: 0,
    playerKnockbackTimer: 0,
    npc,
    npcRadius,
    menu,
    hud,
    hudTitle,
    hudHpBar,
    hudHpText,
    chargeBar,
    chargeLabel,
    dialog: {
      open: false,
      data: npcDialog,
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
    projectiles: [],
    projectilePool: [],
    enemyProjectiles: [],
    enemyProjectilePool: [],
    enemyProjectileTexture,
    enemy: {
      entity: enemy,
      name: defaultEnemyData.name,
      radius: defaultEnemyData.radius,
      maxHp: defaultEnemyData.maxHp,
      hp: defaultEnemyData.maxHp,
      hitTimer: 0,
      dead: false,
      respawnTimer: 0,
      respawnSeconds: defaultEnemyData.respawnSeconds,
      hitFlashSeconds: defaultEnemyData.hitFlashSeconds,
      labelOffsetY: defaultEnemyData.labelOffsetY,
      speed: defaultEnemyData.speed,
      aggroRange: defaultEnemyData.aggroRange,
      stopRange: defaultEnemyData.stopRange,
      patrolRadius: defaultEnemyData.patrolRadius,
      attackRange: defaultEnemyData.attackRange,
      attackWindupSeconds: defaultEnemyData.attackWindupSeconds,
      attackCooldownSeconds: defaultEnemyData.attackCooldownSeconds,
      attackCooldown: 0,
      attackTimer: 0,
      attackFlashTimer: 0,
      strafeSpeed: defaultEnemyData.strafeSpeed,
      strafeSwitchSeconds: defaultEnemyData.strafeSwitchSeconds,
      strafeSwitchTimer: defaultEnemyData.strafeSwitchSeconds,
      strafeDir: 1,
      projectileSpeed: defaultEnemyData.projectileSpeed,
      projectileDamage: defaultEnemyData.projectileDamage,
      projectileRadius: defaultEnemyData.projectileRadius,
      projectileLifetime: defaultEnemyData.projectileLifetime,
      patrolAngle: 0,
      homeX: enemy.pos.x,
      homeY: enemy.pos.y,
      hpBar: enemyHpBar,
      label: enemyLabel,
    },
    damageTexts: [],
    damageTextPool: [],
    playerData: defaultPlayerData,
  };

  setupPointerSystem(state, projectileTexture);

  const menuToggleSystem = new MenuToggleSystem();
  const dialogSystem = new DialogSystem();
  const playerSystem = new PlayerSystem();
  const aimSystem = new AimSystem();
  const combatSystem = new CombatSystem();
  const uiSystem = new UISystem();
  const cameraSystem = new CameraSystem();
  const hudSystem = new HUDSystem();
  const enemyAISystem = new EnemyAISystem();

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    menuToggleSystem.update(state);
    dialogSystem.update(state, dt);
    playerSystem.update(state, dt);
    enemyAISystem.update(state, dt);
    aimSystem.update(state);
    combatSystem.update(state, dt);
    cameraSystem.update(state, dt);
    uiSystem.update(state, dt);
    hudSystem.update(state);
  });
};

void bootstrap();
