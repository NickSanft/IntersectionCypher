import type { GameState } from "./types";

interface SaveData {
  level: number;
  exp: number;
  mapId: string;
  killCount: number;
}

const SAVE_KEY = "IntersectionCypher_v1";

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SaveData) : null;
  } catch {
    return null;
  }
}

export function writeSave(state: GameState): void {
  try {
    const data: SaveData = {
      level: state.playerData.stats.level,
      exp: state.playerData.stats.exp,
      mapId: state.currentMapId,
      killCount: state.killCount,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (e.g. private browsing)
  }
}
