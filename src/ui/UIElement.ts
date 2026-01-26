import * as PIXI from "pixi.js";

export type AnchorPreset =
  | "TopLeft"
  | "TopRight"
  | "BottomLeft"
  | "BottomRight"
  | "BottomCenter"
  | "Center";

export interface UIElementOptions {
  width: number;
  height: number;
  anchor?: AnchorPreset;
  offsetX?: number;
  offsetY?: number;
}

export class UIElement extends PIXI.Container {
  public widthPx: number;
  public heightPx: number;
  public anchor: AnchorPreset;
  public offsetX: number;
  public offsetY: number;

  constructor(options: UIElementOptions) {
    super();
    this.widthPx = options.width;
    this.heightPx = options.height;
    this.anchor = options.anchor ?? "TopLeft";
    this.offsetX = options.offsetX ?? 0;
    this.offsetY = options.offsetY ?? 0;
  }

  public updateLayout(parentWidth: number, parentHeight: number): void {
    const { x, y } = this.resolveAnchor(parentWidth, parentHeight);
    this.position.set(x + this.offsetX, y + this.offsetY);
  }

  public setSize(width: number, height: number): void {
    this.widthPx = width;
    this.heightPx = height;
  }

  private resolveAnchor(parentWidth: number, parentHeight: number): PIXI.Point {
    switch (this.anchor) {
      case "TopRight":
        return new PIXI.Point(parentWidth - this.widthPx, 0);
      case "BottomLeft":
        return new PIXI.Point(0, parentHeight - this.heightPx);
      case "BottomRight":
        return new PIXI.Point(
          parentWidth - this.widthPx,
          parentHeight - this.heightPx
        );
      case "BottomCenter":
        return new PIXI.Point(
          (parentWidth - this.widthPx) * 0.5,
          parentHeight - this.heightPx
        );
      case "Center":
        return new PIXI.Point(
          (parentWidth - this.widthPx) * 0.5,
          (parentHeight - this.heightPx) * 0.5
        );
      default:
        return new PIXI.Point(0, 0);
    }
  }
}
