import type { ItemDefinition } from "./Items";
import { itemDefs } from "./Items";

export interface ShopOffer {
  item: ItemDefinition;
  price: number;
}

export const defaultShopOffers: ShopOffer[] = [
  { item: itemDefs.potion, price: itemDefs.potion.price },
  { item: itemDefs.tonic, price: itemDefs.tonic.price },
  { item: itemDefs.kit, price: itemDefs.kit.price },
];
