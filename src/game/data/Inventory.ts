export interface InventoryItem {
  id: string;
  name: string;
  rarity: "Common" | "Rare" | "Epic";
  quantity: number;
}
