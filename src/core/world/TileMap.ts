export type SolidType = "None" | "Solid";

export interface TileDef {
  id: number;
  solid: SolidType;
  height: number;
}

export interface TileMap {
  width: number;
  height: number;
  tileSize: number;
  tiles: Uint16Array;
  defs: ReadonlyArray<TileDef>;
}

export const tileIndex = (x: number, y: number, width: number): number =>
  x + y * width;
