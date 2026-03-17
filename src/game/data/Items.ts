import type { InventoryItem } from "./Inventory";

export type ItemRarity = "Common" | "Rare" | "Epic";
export type ItemKind = "consumable" | "material";
export type ItemEffect =
  | { type: "heal"; amount: number }
  | { type: "beatStim" }
  | { type: "ampCrystal" };

export interface ItemDefinition {
  id: string;
  name: string;
  rarity: ItemRarity;
  kind: ItemKind;
  price: number;
  effect?: ItemEffect;
}

export const itemDefs: Record<string, ItemDefinition> = {
  potion: {
    id: "potion",
    name: "Heat Potion",
    rarity: "Common",
    kind: "consumable",
    price: 10,
    effect: { type: "heal", amount: 35 },
  },
  tonic: {
    id: "tonic",
    name: "Focus Tonic",
    rarity: "Common",
    kind: "consumable",
    price: 15,
    effect: { type: "heal", amount: 20 },
  },
  coil: {
    id: "coil",
    name: "Flux Coil",
    rarity: "Rare",
    kind: "material",
    price: 30,
  },
  kit: {
    id: "kit",
    name: "Repair Kit",
    rarity: "Common",
    kind: "consumable",
    price: 12,
    effect: { type: "heal", amount: 20 },
  },
  badge: {
    id: "badge",
    name: "Circuit Badge",
    rarity: "Rare",
    kind: "material",
    price: 35,
  },
  beatStim: {
    id: "beatStim",
    name: "Beat Stim",
    rarity: "Rare",
    kind: "consumable",
    price: 25,
    effect: { type: "beatStim" },
  },
  ampCrystal: {
    id: "ampCrystal",
    name: "Amp Crystal",
    rarity: "Epic",
    kind: "consumable",
    price: 40,
    effect: { type: "ampCrystal" },
  },
};

export const createInventoryItem = (
  id: string,
  quantity: number
): InventoryItem | null => {
  const def = itemDefs[id];
  if (!def) {
    return null;
  }
  return {
    id: def.id,
    name: def.name,
    rarity: def.rarity,
    quantity,
  };
};
