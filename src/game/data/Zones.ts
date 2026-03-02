import type { ZoneRhythmConfig } from "../types";

export interface ZoneConfig {
  id: string;
  rhythm: ZoneRhythmConfig;
}

export const zoneConfigs: Record<string, ZoneConfig> = {
  map1: {
    id: "map1",
    rhythm: {
      bpm: 120,
      windowSeconds: 0.12,
      onBeatDamageMult: 2,
      palette: {
        floorFill: 0x0d1f2d,
        floorGrid: 0x0f2336,
        wallTop: 0x1e3d52,
        wallFront: 0x08121a,
        ambientTint: 0xffffff,
      },
    },
  },
  map2: {
    id: "map2",
    rhythm: {
      bpm: 96,
      windowSeconds: 0.12,
      onBeatDamageMult: 2,
      palette: {
        floorFill: 0x1f0e07,
        floorGrid: 0x2a1208,
        wallTop: 0x4a2010,
        wallFront: 0x120704,
        ambientTint: 0xffe8d0,
      },
    },
  },
};
