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
  map1b: {
    id: "map1b",
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
  map1c: {
    id: "map1c",
    rhythm: {
      bpm: 128,
      windowSeconds: 0.12,
      onBeatDamageMult: 2,
      palette: {
        floorFill: 0x0e1e30,
        floorGrid: 0x122540,
        wallTop: 0x234862,
        wallFront: 0x090e18,
        ambientTint: 0xeef4ff,
      },
    },
  },
  map1_boss: {
    id: "map1_boss",
    rhythm: {
      bpm: 132,
      windowSeconds: 0.11,
      onBeatDamageMult: 2,
      palette: {
        floorFill: 0x0a0f18,
        floorGrid: 0x0d1525,
        wallTop: 0x1a2a40,
        wallFront: 0x060a0f,
        ambientTint: 0xfff0e0,
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
  map2b: {
    id: "map2b",
    rhythm: {
      bpm: 104,
      windowSeconds: 0.12,
      onBeatDamageMult: 2,
      palette: {
        floorFill: 0x1a0c05,
        floorGrid: 0x251007,
        wallTop: 0x4a1e0e,
        wallFront: 0x0f0703,
        ambientTint: 0xffd8b0,
      },
    },
  },
  map2c: {
    id: "map2c",
    rhythm: {
      bpm: 112,
      windowSeconds: 0.12,
      onBeatDamageMult: 2,
      palette: {
        floorFill: 0x1e0806,
        floorGrid: 0x280b07,
        wallTop: 0x521808,
        wallFront: 0x120403,
        ambientTint: 0xffc090,
      },
    },
  },
  map2_boss: {
    id: "map2_boss",
    rhythm: {
      bpm: 116,
      windowSeconds: 0.11,
      onBeatDamageMult: 2,
      palette: {
        floorFill: 0x1a0408,
        floorGrid: 0x22050a,
        wallTop: 0x4a0a14,
        wallFront: 0x0f0204,
        ambientTint: 0xffb0b0,
      },
    },
  },
};
