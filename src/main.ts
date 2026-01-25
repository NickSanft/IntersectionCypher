import * as PIXI from "pixi.js";
import { ZEntity } from "./entities/ZEntity";
import type { TileMap, TileDef } from "./core/world/TileMap";
import { tileIndex } from "./core/world/TileMap";
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

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    for (const projectile of projectiles) {
      projectile.update(dt, map);
      projectile.renderUpdate();
    }
  });
};

void bootstrap();
