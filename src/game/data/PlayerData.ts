export interface PlayerStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  focus: number;
  dashMultiplier: number;
  guardMultiplier: number;
}

export interface PlayerEquipment {
  weapon: string;
  body: string;
  arms: string;
  head: string;
}

export interface PlayerData {
  name: string;
  stats: PlayerStats;
  equipment: PlayerEquipment;
}

export const defaultPlayerData: PlayerData = {
  name: "Lea",
  stats: {
    hp: 120,
    maxHp: 120,
    attack: 24,
    defense: 18,
    focus: 12,
    dashMultiplier: 1.35,
    guardMultiplier: 1.15,
  },
  equipment: {
    weapon: "Hexa Blade",
    body: "Prism Guard",
    arms: "Flux Bracers",
    head: "Neo Visor",
  },
};
