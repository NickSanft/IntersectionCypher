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

    gfx.roundRect(offsetX, offsetY, mapWidth * scale, mapHeight * scale, 4)
      .fill({ color: 0x0f1720, alpha: 0.9 });

    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        const def = map.defs[map.tiles[tileIndex(x, y, map.width)]];
        if (def.solid !== "Solid") {
          continue;
        }
        gfx.rect(
          offsetX + x * map.tileSize * scale,
          offsetY + y * map.tileSize * scale,
          map.tileSize * scale,
          map.tileSize * scale
        ).fill({ color: 0x1f2a37 });
      }
    }

    if (mapState.door) {
      const door = mapState.door;
      gfx.rect(
        offsetX + door.xMin * scale,
        offsetY + door.yMin * scale,
        (door.xMax - door.xMin) * scale,
        (door.yMax - door.yMin) * scale
      ).fill({ color: 0x38bdf8, alpha: 0.9 });
    }

    gfx.circle(
      offsetX + state.player.pos.x * scale,
      offsetY + state.player.pos.y * scale,
      3
    ).fill({ color: 0x22c55e });

    for (const npc of state.npcs) {
      if (npc.mapId !== state.currentMapId) {
        continue;
      }
      gfx.circle(
        offsetX + npc.entity.pos.x * scale,
        offsetY + npc.entity.pos.y * scale,
        2.5
      ).fill({ color: 0xf472b6 });
    }

    for (const enemy of state.enemies) {
      if (enemy.mapId !== state.currentMapId || enemy.dead) {
        continue;
      }
      gfx.circle(
        offsetX + enemy.entity.pos.x * scale,
        offsetY + enemy.entity.pos.y * scale,
        2.5
      ).fill({ color: 0xef4444 });
    }
  }
}
