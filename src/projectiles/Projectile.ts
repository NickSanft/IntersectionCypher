import type { TileMap } from "../core/world/TileMap";
import { checkCollision } from "../core/physics/Collision";
import { ZEntity } from "../entities/ZEntity";

export interface ProjectileOptions {
  entity: ZEntity;
  radius: number;
  bounciness?: number;
}

export class Projectile {
  public readonly entity: ZEntity;
  public readonly radius: number;
  private readonly bounciness: number;

  constructor(options: ProjectileOptions) {
    this.entity = options.entity;
    this.radius = options.radius;
    this.bounciness = options.bounciness ?? 1;
  }

  public update(dt: number, map: TileMap): void {
    this.entity.update(dt);

    const hit = checkCollision(this.entity.pos, this.radius, map);
    if (!hit) {
      return;
    }

    const v = this.entity.vel;
    const n = hit.normal;
    const dot = v.x * n.x + v.y * n.y;

    if (dot >= 0) {
      return;
    }

    v.x = v.x - 2 * dot * n.x;
    v.y = v.y - 2 * dot * n.y;

    v.x *= this.bounciness;
    v.y *= this.bounciness;

    const pushOut = this.radius + 0.5;
    this.entity.pos.x += n.x * pushOut;
    this.entity.pos.y += n.y * pushOut;
  }

  public renderUpdate(): void {
    this.entity.renderUpdate();
  }
}
