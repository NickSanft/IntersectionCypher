import * as PIXI from "pixi.js";
import { ZEntity } from "./entities/ZEntity";
import type { TileMap, TileDef } from "./core/world/TileMap";
import { tileIndex } from "./core/world/TileMap";
import { Input } from "./game/Input";
import { PlayerController } from "./game/PlayerController";
import { UIElement } from "./ui/UIElement";
import { MenuSystem } from "./ui/menu/MenuSystem";
import { Projectile } from "./projectiles/Projectile";

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

  const entityTexture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0x59d9ff);
    gfx.drawRoundedRect(0, 0, 20, 20, 4);
    gfx.endFill();
    return app.renderer.generateTexture(gfx);
  })();

  const map = buildTestMap(48);
  const mapView = drawMap(map);
  mapView.zIndex = 0;
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
  player.zIndex = 2;
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

  const projectileTexture = (() => {
    const gfx = new PIXI.Graphics();
    gfx.beginFill(0xfbbf24);
    gfx.drawCircle(0, 0, 4);
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
  app.stage.addChild(enemy);
  const enemyRadius = 12;
  let enemyHitTimer = 0;
  const enemyMaxHp = 5;
  let enemyHp = enemyMaxHp;
  let enemyDead = false;
  let enemyRespawnTimer = 0;

  const enemyHpBar = new PIXI.Graphics();
  enemyHpBar.zIndex = 3;
  app.stage.addChild(enemyHpBar);

  const damageTexts: { text: PIXI.Text; life: number; velY: number }[] = [];

  const drawEnemyHp = (): void => {
    enemyHpBar.clear();
    if (enemyDead) {
      return;
    }
    const barWidth = 40;
    const barHeight = 6;
    const x = enemy.pos.x - barWidth / 2;
    const y = enemy.pos.y - 28;
    enemyHpBar.beginFill(0x111827, 0.9);
    enemyHpBar.drawRoundedRect(x, y, barWidth, barHeight, 3);
    enemyHpBar.endFill();

    const ratio = Math.max(0, enemyHp) / enemyMaxHp;
    enemyHpBar.beginFill(0x22c55e, 0.95);
    enemyHpBar.drawRoundedRect(x + 1, y + 1, (barWidth - 2) * ratio, barHeight - 2, 2);
    enemyHpBar.endFill();
  };
  drawEnemyHp();

  const projectiles: { projectile: Projectile; life: number }[] = [];
  const aimLine = new PIXI.Graphics();
  aimLine.zIndex = 4;
  app.stage.addChild(aimLine);
  let aimX = 0;
  let aimY = 0;
  let aimActive = false;

  app.canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    if (dialogOpen || menu.isOpen) {
      return;
    }

    const rect = app.canvas.getBoundingClientRect();
    const targetX = event.clientX - rect.left;
    const targetY = event.clientY - rect.top;

    const dirX = targetX - player.pos.x;
    const dirY = targetY - player.pos.y;
    const len = Math.hypot(dirX, dirY);
    if (len === 0) {
      return;
    }

    const entity = new ZEntity({
      sprite: new PIXI.Sprite(projectileTexture),
      gravity: 0,
      mass: 1,
    });
    entity.sprite.anchor.set(0.5);
    entity.pos.x = player.pos.x;
    entity.pos.y = player.pos.y;
    entity.pos.z = 0;
    const speed = 420;
    entity.vel.x = (dirX / len) * speed;
    entity.vel.y = (dirY / len) * speed;
    entity.vel.z = 0;

    app.stage.addChild(entity);
    projectiles.push({
      projectile: new Projectile({ entity, radius: 4, bounciness: 1 }),
      life: 3,
    });
  });

  app.stage.on("pointermove", (event) => {
    aimX = event.global.x;
    aimY = event.global.y;
    aimActive = true;
  });

  app.stage.on("pointerout", () => {
    aimActive = false;
  });

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

  const menu = new MenuSystem();
  menu.registerTabs();
  uiLayer.addChild(menu);

  let dialogOpen = false;
  let lastActionPressed = false;
  let lastMenuPressed = false;
  let dialogCharIndex = 0;
  let dialogCharTimer = 0;
  const dialogCharsPerSecond = 28;

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    const menuPressed = input.isActionPressed("menu");
    const menuJustPressed = menuPressed && !lastMenuPressed;
    lastMenuPressed = menuPressed;

    if (menuJustPressed) {
      menu.toggle();
      if (menu.isOpen) {
        dialogOpen = false;
        dialog.visible = false;
        dialogText.text = "";
      }
    }

    if (!dialogOpen && !menu.isOpen) {
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
      } else if (!menu.isOpen) {
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

    aimLine.clear();
    if (aimActive && !dialogOpen && !menu.isOpen) {
      const dx = aimX - player.pos.x;
      const dy = aimY - player.pos.y;
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        const dirX = dx / len;
        const dirY = dy / len;
        const dash = 8;
        const gap = 6;
        const maxLen = Math.min(len, 220);
        aimLine.lineStyle(3, 0xffffff, 0.9);
        let dist = 10;
        while (dist < maxLen) {
          const segLen = Math.min(dash, maxLen - dist);
          const startX = player.pos.x + dirX * dist;
          const startY = player.pos.y + dirY * dist;
          const endX = player.pos.x + dirX * (dist + segLen);
          const endY = player.pos.y + dirY * (dist + segLen);
          aimLine.moveTo(startX, startY);
          aimLine.lineTo(endX, endY);
          dist += dash + gap;
        }
        aimLine.beginFill(0xffffff, 0.95);
        aimLine.drawCircle(aimX, aimY, 3);
        aimLine.endFill();
      }
    }

    if (!enemyDead && enemyHitTimer > 0) {
      enemyHitTimer -= dt;
      if (enemyHitTimer <= 0) {
        enemy.sprite.tint = 0xffffff;
      }
    }

    if (enemyDead) {
      enemyRespawnTimer -= dt;
      if (enemyRespawnTimer <= 0) {
        enemyDead = false;
        enemyHp = enemyMaxHp;
        enemy.visible = true;
        enemy.sprite.tint = 0xffffff;
        drawEnemyHp();
      }
    }

    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const entry = projectiles[i];
      entry.projectile.update(dt, map);
      entry.projectile.renderUpdate();
      entry.life -= dt;

      if (!enemyDead) {
        const dx = entry.projectile.entity.pos.x - enemy.pos.x;
        const dy = entry.projectile.entity.pos.y - enemy.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= enemyRadius + entry.projectile.radius) {
          enemy.sprite.tint = 0xffc2c2;
          enemyHitTimer = 0.15;
          enemyHp = Math.max(0, enemyHp - 1);
          if (enemyHp === 0) {
            enemyDead = true;
            enemy.visible = false;
            enemyRespawnTimer = 2.5;
          }
          drawEnemyHp();

          const damageText = new PIXI.Text({
            text: "-1",
            style: {
              fill: 0xf97316,
              fontFamily: "Arial",
              fontSize: 14,
              fontWeight: "700",
            },
          });
          damageText.anchor.set(0.5);
          damageText.position.set(enemy.pos.x, enemy.pos.y - 36);
          app.stage.addChild(damageText);
          damageTexts.push({ text: damageText, life: 0.6, velY: -20 });

          app.stage.removeChild(entry.projectile.entity);
          projectiles.splice(i, 1);
          continue;
        }
      }

      if (entry.life <= 0) {
        app.stage.removeChild(entry.projectile.entity);
        projectiles.splice(i, 1);
      }
    }

    for (let i = damageTexts.length - 1; i >= 0; i -= 1) {
      const entry = damageTexts[i];
      entry.life -= dt;
      entry.text.alpha = Math.max(0, entry.life / 0.6);
      entry.text.position.y += entry.velY * dt;
      if (entry.life <= 0) {
        app.stage.removeChild(entry.text);
        damageTexts.splice(i, 1);
      }
    }

    hud.updateLayout(app.renderer.width, app.renderer.height);
    dialog.updateLayout(app.renderer.width, app.renderer.height);
    menu.update(dt);
    menu.updateLayout(app.renderer.width, app.renderer.height);

    if (!enemyDead) {
      drawEnemyHp();
    }
  });
};

void bootstrap();
