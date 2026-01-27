import type { GameState } from "../types";
import { tileIndex } from "../../core/world/TileMap";

export class MinimapSystem {
  public update(state: GameState): void {
    if (!state.minimap.visible) {
      return;
    }

    const mapState = state.maps[state.currentMapId];
    if (!mapState) {
      return;
    }

    const map = mapState.map;
    const mapWidth = map.width * map.tileSize;
    const mapHeight = map.height * map.tileSize;

    const padding = 8;
    const availableWidth = Math.max(1, state.minimap.widthPx - padding * 2);
    const availableHeight = Math.max(1, state.minimap.heightPx - padding * 2);
    const scale = Math.min(availableWidth / mapWidth, availableHeight / mapHeight);

    const offsetX = padding + (availableWidth - mapWidth * scale) * 0.5;
    const offsetY = padding + (availableHeight - mapHeight * scale) * 0.5;

    const gfx = state.minimapView;
    gfx.clear();

    gfx.beginFill(0x0f1720, 0.9);
    gfx.drawRoundedRect(offsetX, offsetY, mapWidth * scale, mapHeight * scale, 4);
    gfx.endFill();

    gfx.beginFill(0x1f2a37, 1);
    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        const def = map.defs[map.tiles[tileIndex(x, y, map.width)]];
        if (def.solid !== "Solid") {
          continue;
        }
        gfx.drawRect(
          offsetX + x * map.tileSize * scale,
          offsetY + y * map.tileSize * scale,
          map.tileSize * scale,
          map.tileSize * scale
        );
      }
    }
    gfx.endFill();

    if (mapState.door) {
      const door = mapState.door;
      gfx.beginFill(0x38bdf8, 0.9);
      gfx.drawRect(
        offsetX + door.xMin * scale,
        offsetY + door.yMin * scale,
        (door.xMax - door.xMin) * scale,
        (door.yMax - door.yMin) * scale
      );
      gfx.endFill();
    }

    gfx.beginFill(0x22c55e, 1);
    gfx.drawCircle(
      offsetX + state.player.pos.x * scale,
      offsetY + state.player.pos.y * scale,
      3
    );
    gfx.endFill();

    for (const npc of state.npcs) {
      if (npc.mapId !== state.currentMapId) {
        continue;
      }
      gfx.beginFill(0xf472b6, 1);
      gfx.drawCircle(
        offsetX + npc.entity.pos.x * scale,
        offsetY + npc.entity.pos.y * scale,
        2.5
      );
      gfx.endFill();
    }

    for (const enemy of state.enemies) {
      if (enemy.mapId !== state.currentMapId || enemy.dead) {
        continue;
      }
      gfx.beginFill(0xef4444, 1);
      gfx.drawCircle(
        offsetX + enemy.entity.pos.x * scale,
        offsetY + enemy.entity.pos.y * scale,
        2.5
      );
      gfx.endFill();
    }
  }
}
