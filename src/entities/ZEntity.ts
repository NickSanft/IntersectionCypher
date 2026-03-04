import * as PIXI from "pixi.js";

export type Vec3 = { x: number; y: number; z: number };

export interface ZEntityOptions {
  sprite: PIXI.Sprite;
  gravity?: number;
  mass?: number;
  shadowRadiusX?: number;
  shadowRadiusY?: number;
  shadowOffsetY?: number;
}

export class ZEntity extends PIXI.Container {
  public readonly pos: Vec3 = { x: 0, y: 0, z: 0 };
  public readonly vel: Vec3 = { x: 0, y: 0, z: 0 };
  public readonly accel: Vec3 = { x: 0, y: 0, z: 0 };

  public readonly sprite: PIXI.Sprite;
  private readonly shadow: PIXI.Graphics | null;
  private readonly shadowRadiusX: number;
  private readonly shadowRadiusY: number;
  private readonly shadowOffsetY: number;

  private readonly gravity: number;
  private readonly mass: number;

  constructor(options: ZEntityOptions) {
    super();
    this.shadowRadiusX = options.shadowRadiusX ?? 0;
    this.shadowRadiusY = options.shadowRadiusY ?? 0;
    this.shadowOffsetY = options.shadowOffsetY ?? 0;

    if (this.shadowRadiusX > 0) {
      this.shadow = new PIXI.Graphics();
      this.addChild(this.shadow);
    } else {
      this.shadow = null;
    }

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
    this.position.set(Math.round(this.pos.x), Math.round(this.pos.y));
    this.sprite.position.y = -Math.round(this.pos.z);

    if (this.shadow) {
      const scale = Math.max(0.3, 1 - this.pos.z / 80);
      // Directional offset: light source from top-left, shadow falls slightly SE
      const ox = 1;
      const oy = this.shadowOffsetY + 2;
      this.shadow.clear();
      // Outer soft penumbra
      this.shadow
        .ellipse(ox, oy, this.shadowRadiusX * scale * 1.35, this.shadowRadiusY * scale * 1.2)
        .fill({ color: 0x000000, alpha: 0.18 * scale });
      // Inner core shadow
      this.shadow
        .ellipse(ox, oy, this.shadowRadiusX * scale, this.shadowRadiusY * scale)
        .fill({ color: 0x000000, alpha: 0.48 * scale });
    }
  }
}
