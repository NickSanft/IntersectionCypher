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
    },
  },
  map2: {
    id: "map2",
    rhythm: {
      bpm: 96,
      windowSeconds: 0.12,
      onBeatDamageMult: 2,
    },
  },
};
