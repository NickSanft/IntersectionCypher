import type { TileMap } from "../world/TileMap";
import type { Vec3 } from "../../entities/ZEntity";
import { checkCollision } from "./Collision";

export const moveWithCollision = (
  pos: Vec3,
  vel: Vec3,
  dt: number,
  radius: number,
  map: TileMap
): void => {
  const nextX = pos.x + vel.x * dt;
  const nextY = pos.y + vel.y * dt;

  const temp = { x: nextX, y: pos.y, z: pos.z };
  if (checkCollision(temp, radius, map)) {
    vel.x = 0;
  } else {
    pos.x = nextX;
  }

  temp.x = pos.x;
  temp.y = nextY;
  if (checkCollision(temp, radius, map)) {
    vel.y = 0;
  } else {
    pos.y = nextY;
  }
};
