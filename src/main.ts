import * as PIXI from "pixi.js";
import { ZEntity } from "./entities/ZEntity";
import type { TileMap, TileDef } from "./core/world/TileMap";
import { tileIndex } from "./core/world/TileMap";
import { Input } from "./game/Input";
import { PlayerController } from "./game/PlayerController";
import { UIElement } from "./ui/UIElement";

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
  const playerRadius = 10;
  const npcRadius = 10;

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
  app.stage.addChild(npc);

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
    text: "WASD / Arrows to move\nSpace to interact",
    style: {
      fill: 0xcbd5f5,
      fontFamily: "Arial",
      fontSize: 12,
    },
  });
  hudText.position.set(12, 12);
  hud.addChild(hudText);
  uiLayer.addChild(hud);

  const dialog = new UIElement({
    width: 260,
    height: 90,
    anchor: "BottomCenter",
    offsetX: 0,
    offsetY: -24,
  });
  const dialogBg = new PIXI.Graphics();
  dialogBg.beginFill(0x111827, 0.92);
  dialogBg.lineStyle(2, 0x3b82f6, 1);
  dialogBg.drawRoundedRect(0, 0, dialog.widthPx, dialog.heightPx, 10);
  dialogBg.endFill();
  dialog.addChild(dialogBg);

  const dialogContent = "Hello!";
  const dialogText = new PIXI.Text({
    text: "",
    style: {
      fill: 0xf9fafb,
      fontFamily: "Arial",
      fontSize: 16,
    },
  });
  dialogText.anchor.set(0.5);
  dialogText.position.set(dialog.widthPx * 0.5, dialog.heightPx * 0.5);
  dialog.addChild(dialogText);
  dialog.visible = false;
  uiLayer.addChild(dialog);

  let dialogOpen = false;
  let lastActionPressed = false;
  let dialogCharIndex = 0;
  let dialogCharTimer = 0;
  const dialogCharsPerSecond = 28;

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    if (!dialogOpen) {
      playerController.update(dt, map);
      const dx = player.pos.x - npc.pos.x;
      const dy = player.pos.y - npc.pos.y;
      const dist = Math.hypot(dx, dy);
      const minDist = playerRadius + npcRadius;
      if (dist > 0 && dist < minDist) {
        const push = (minDist - dist) / dist;
        player.pos.x += dx * push;
        player.pos.y += dy * push;
        player.renderUpdate();
      }
    } else {
      player.vel.x = 0;
      player.vel.y = 0;
    }

    const actionPressed = input.isActionPressed("action");
    const actionJustPressed = actionPressed && !lastActionPressed;
    lastActionPressed = actionPressed;

    if (actionJustPressed) {
      if (dialogOpen) {
        dialogOpen = false;
        dialog.visible = false;
        dialogText.text = "";
      } else {
        const dx = player.pos.x - npc.pos.x;
        const dy = player.pos.y - npc.pos.y;
        if (Math.hypot(dx, dy) <= 40) {
          dialogOpen = true;
          dialog.visible = true;
          dialogCharIndex = 0;
          dialogCharTimer = 0;
          dialogText.text = "";
        }
      }
    }

    if (dialogOpen && dialogCharIndex < dialogContent.length) {
      dialogCharTimer += dt;
      const nextChars = Math.floor(dialogCharTimer * dialogCharsPerSecond);
      if (nextChars > 0) {
        dialogCharIndex = Math.min(
          dialogContent.length,
          dialogCharIndex + nextChars
        );
        dialogCharTimer = 0;
        dialogText.text = dialogContent.slice(0, dialogCharIndex);
      }
    }

    hud.updateLayout(app.renderer.width, app.renderer.height);
    dialog.updateLayout(app.renderer.width, app.renderer.height);
  });
};

void bootstrap();
