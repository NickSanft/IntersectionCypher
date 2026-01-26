export interface PlayerStats {
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  focus: number;
  dashMultiplier: number;
  guardMultiplier: number;
  projectileDamage: number;
  projectileSpeed: number;
  moveSpeed: number;
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
    level: 1,
    exp: 0,
    expToNext: 10,
    hp: 120,
    maxHp: 120,
    attack: 24,
    defense: 18,
    focus: 12,
    dashMultiplier: 1.35,
    guardMultiplier: 1.15,
    projectileDamage: 1,
    projectileSpeed: 420,
    moveSpeed: 220,
  },
  equipment: {
    weapon: "Hexa Blade",
    body: "Prism Guard",
    arms: "Flux Bracers",
    head: "Neo Visor",
  },
};
