import type { PlayerData } from "./PlayerData";
import { createInventoryItem, itemDefs } from "./Items";

export const addItemById = (
  player: PlayerData,
  id: string,
  quantity: number
): boolean => {
  const item = createInventoryItem(id, quantity);
  if (!item) {
    return false;
  }
  const existing = player.inventory.find((entry) => entry.id === id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    player.inventory.push(item);
  }
  return true;
};

export const removeItemById = (
  player: PlayerData,
  id: string,
  quantity: number
): boolean => {
  const existing = player.inventory.find((entry) => entry.id === id);
  if (!existing || existing.quantity < quantity) {
    return false;
  }
  existing.quantity -= quantity;
  if (existing.quantity <= 0) {
    player.inventory = player.inventory.filter((entry) => entry.id !== id);
  }
  return true;
};

export const findFirstConsumable = (player: PlayerData): string | null => {
  for (const entry of player.inventory) {
    const def = itemDefs[entry.id];
    if (!def) {
      continue;
    }
    if (def.kind === "consumable" && def.effect) {
      return entry.id;
    }
  }
  return null;
};
