import type { TileLayout, TileRect } from "../maps/MapBuilder";

export interface ZoneDoorConfig {
  to: string;
  rect: TileRect;
  spawn: { x: number; y: number };
}

export interface ZoneMapConfig {
  id: string;
  layout: TileLayout;
  spawn: { x: number; y: number };
  door?: ZoneDoorConfig;
}

const map1Rows = [
  "####################",
  "#..................#",
  "#........#.........#",
  "#..................#",
  "#.....#............#",
  "#..................#",
  "#..................#",
  "#............#.....#",
  "#..................#",
  "#..................#",
  "#..................#",
  "####################",
];

const map2Rows = [
  "##################",
  "#................#",
  "#................#",
  "#................#",
  "#..############..#",
  "#................#",
  "#................#",
  "#................#",
  "#................#",
  "##################",
];

export const zoneMaps: Record<string, ZoneMapConfig> = {
  map1: {
    id: "map1",
    layout: {
      tileSize: 48,
      rows: map1Rows,
    },
    spawn: { x: 4, y: 4 },
    door: {
      to: "map2",
      rect: { x: 18, y: 4, w: 1, h: 3 },
      spawn: { x: 3, y: 3 },
    },
  },
  map2: {
    id: "map2",
    layout: {
      tileSize: 48,
      rows: map2Rows,
    },
    spawn: { x: 2, y: 5 },
    door: {
      to: "map1",
      rect: { x: 1, y: 4, w: 1, h: 2 },
      spawn: { x: 3, y: 5 },
    },
  },
};
