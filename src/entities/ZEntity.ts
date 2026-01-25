import * as PIXI from "pixi.js";

export type Vec3 = { x: number; y: number; z: number };

export interface ZEntityOptions {
  sprite: PIXI.Sprite;
  gravity?: number;
  mass?: number;
}

export class ZEntity extends PIXI.Container {
  public readonly pos: Vec3 = { x: 0, y: 0, z: 0 };
  public readonly vel: Vec3 = { x: 0, y: 0, z: 0 };
  public readonly accel: Vec3 = { x: 0, y: 0, z: 0 };

  public readonly sprite: PIXI.Sprite;

  private readonly gravity: number;
  private readonly mass: number;

  constructor(options: ZEntityOptions) {
    super();
    this.sprite = options.sprite;
    this.addChild(this.sprite);

    this.gravity = options.gravity ?? 0;
    this.mass = options.mass ?? 1;
  }

  public update(dt: number): void {
    if (this.gravity !== 0) {
      this.accel.z -= this.gravity * this.mass;
    }

    this.vel.x += this.accel.x * dt;
    this.vel.y += this.accel.y * dt;
    this.vel.z += this.accel.z * dt;

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.z += this.vel.z * dt;

    this.accel.x = 0;
    this.accel.y = 0;
    this.accel.z = 0;
  }

  public renderUpdate(): void {
    this.position.set(this.pos.x, this.pos.y);
    this.sprite.position.y = -this.pos.z;
  }
}
