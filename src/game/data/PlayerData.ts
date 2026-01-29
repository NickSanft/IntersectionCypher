import type { InventoryItem } from "./Inventory";
import type { QuestEntry } from "./Quest";

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
  credits: number;
  inventory: InventoryItem[];
  questFlags: Record<string, boolean>;
  questLog: QuestEntry[];
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
  credits: 120,
  inventory: [
    { id: "potion", name: "Heat Potion", rarity: "Common", quantity: 2 },
    { id: "tonic", name: "Focus Tonic", rarity: "Common", quantity: 1 },
    { id: "coil", name: "Flux Coil", rarity: "Rare", quantity: 1 },
    { id: "badge", name: "Circuit Badge", rarity: "Rare", quantity: 1 },
  ],
  questFlags: {
    "tutorial-complete": false,
    "console-activated": false,
    "checkpoint-1": false,
  },
  questLog: [
    {
      id: "console-activated",
      title: "Power the Console",
      description: "Find the console in the east wing and activate it.",
      completed: false,
    },
    {
      id: "checkpoint-1",
      title: "Secure a Checkpoint",
      description: "Register the green checkpoint to save progress.",
      completed: false,
    },
  ],
};
