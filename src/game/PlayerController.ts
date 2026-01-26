import type { TileMap } from "../core/world/TileMap";
import type { ZEntity } from "../entities/ZEntity";
import { moveWithCollision } from "../core/physics/Move";
import { Input } from "./Input";

export interface PlayerControllerOptions {
  entity: ZEntity;
  input: Input;
  moveSpeed: number;
  radius: number;
}

export class PlayerController {
  public readonly entity: ZEntity;
  private readonly input: Input;
  private moveSpeed: number;
  private readonly radius: number;

  constructor(options: PlayerControllerOptions) {
    this.entity = options.entity;
    this.input = options.input;
    this.moveSpeed = options.moveSpeed;
    this.radius = options.radius;
  }

  public setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }

  public update(dt: number, map: TileMap): void {
    const dirX =
      (this.input.isActionPressed("right") ? 1 : 0) -
      (this.input.isActionPressed("left") ? 1 : 0);
    const dirY =
      (this.input.isActionPressed("down") ? 1 : 0) -
      (this.input.isActionPressed("up") ? 1 : 0);

    let normX = dirX;
    let normY = dirY;
    if (dirX !== 0 || dirY !== 0) {
      const len = Math.hypot(dirX, dirY);
      normX = dirX / len;
      normY = dirY / len;
    }

    this.entity.vel.x = normX * this.moveSpeed;
    this.entity.vel.y = normY * this.moveSpeed;

    moveWithCollision(this.entity.pos, this.entity.vel, dt, this.radius, map);
    this.entity.renderUpdate();
  }
}
