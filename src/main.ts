import * as PIXI from "pixi.js";
import { ZEntity } from "./entities/ZEntity";
import type { TileMap, TileDef } from "./core/world/TileMap";
import { tileIndex } from "./core/world/TileMap";
import { Projectile } from "./projectiles/Projectile";
import { Input } from "./game/Input";
import { PlayerController } from "./game/PlayerController";
import { UIElement } from "./ui/UIElement";
import { UIButton } from "./ui/UIButton";
import { FocusManager } from "./ui/focus/FocusManager";

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

  const entityTexture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0x59d9ff);
    gfx.drawRoundedRect(0, 0, 20, 20, 4);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
  })();

  const map = buildTestMap(48);
  const mapView = drawMap(map);
  app.stage.addChild(mapView);

  const projectileTexture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0xffc857);
    gfx.drawCircle(0, 0, 6);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
  })();

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
  player.sprite.anchor.set(0.5);
  player.pos.x = map.tileSize * 4;
  player.pos.y = map.tileSize * 4;
  player.pos.z = 0;
  app.stage.addChild(player);

  const input = new Input();
  input.attach();
  const playerController = new PlayerController({
    entity: player,
    input,
    moveSpeed: 220,
    radius: 10,
  });

  const projectiles: Projectile[] = [];
  const count = 600;
  for (let i = 0; i < count; i += 1) {
    const entity = new ZEntity({
      sprite: new PIXI.Sprite(projectileTexture),
      gravity: 0,
      mass: 1,
    });
    entity.sprite.anchor.set(0.5);
    entity.pos.x = map.tileSize * 2 + Math.random() * map.tileSize * 16;
    entity.pos.y = map.tileSize * 2 + Math.random() * map.tileSize * 8;
    entity.pos.z = 0;

    const speed = 140 + Math.random() * 120;
    const angle = Math.random() * Math.PI * 2;
    entity.vel.x = Math.cos(angle) * speed;
    entity.vel.y = Math.sin(angle) * speed;
    entity.vel.z = 0;

    app.stage.addChild(entity);
    projectiles.push(new Projectile({ entity, radius: 6, bounciness: 1 }));
  }

  const uiLayer = new PIXI.Container();
  uiLayer.sortableChildren = true;
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
    text: "WASD / Arrows to move\nTab to switch focus\nEnter to activate",
    style: {
      fill: 0xcbd5f5,
      fontFamily: "Arial",
      fontSize: 12,
    },
  });
  hudText.position.set(12, 12);
  hud.addChild(hudText);
  uiLayer.addChild(hud);

  const focusManager = new FocusManager();
  focusManager.attach();

  const buttonA = new UIButton({
    width: 120,
    height: 32,
    label: "Spawn Burst",
    onClick: () => {
      for (let i = 0; i < 40; i += 1) {
        const entity = new ZEntity({
          sprite: new PIXI.Sprite(projectileTexture),
          gravity: 0,
          mass: 1,
        });
        entity.sprite.anchor.set(0.5);
        entity.pos.x = player.pos.x;
        entity.pos.y = player.pos.y;
        entity.pos.z = 0;

        const speed = 160 + Math.random() * 140;
        const angle = Math.random() * Math.PI * 2;
        entity.vel.x = Math.cos(angle) * speed;
        entity.vel.y = Math.sin(angle) * speed;
        entity.vel.z = 0;

        app.stage.addChild(entity);
        projectiles.push(new Projectile({ entity, radius: 6, bounciness: 1 }));
      }
    },
  });
  buttonA.anchor = "BottomLeft";
  buttonA.offsetX = 16;
  buttonA.offsetY = -16;
  buttonA.updateLayout(app.renderer.width, app.renderer.height);
  uiLayer.addChild(buttonA);
  focusManager.register(buttonA);

  const buttonB = new UIButton({
    width: 120,
    height: 32,
    label: "Clear Burst",
    onClick: () => {
      const remaining = projectiles.slice(0, count);
      const toRemove = projectiles.slice(count);
      for (const projectile of toRemove) {
        app.stage.removeChild(projectile.entity);
      }
      projectiles.length = 0;
      projectiles.push(...remaining);
    },
  });
  buttonB.anchor = "BottomLeft";
  buttonB.offsetX = 152;
  buttonB.offsetY = -16;
  buttonB.updateLayout(app.renderer.width, app.renderer.height);
  uiLayer.addChild(buttonB);
  focusManager.register(buttonB);

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    playerController.update(dt, map);
    for (const projectile of projectiles) {
      projectile.update(dt, map);
      projectile.renderUpdate();
    }
    hud.updateLayout(app.renderer.width, app.renderer.height);
    buttonA.updateLayout(app.renderer.width, app.renderer.height);
    buttonB.updateLayout(app.renderer.width, app.renderer.height);
  });
};

void bootstrap();
