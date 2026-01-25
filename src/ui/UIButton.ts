import * as PIXI from "pixi.js";
import { UIElement } from "./UIElement";
import type { Focusable } from "./focus/FocusManager";

export interface UIButtonOptions {
  width: number;
  height: number;
  label: string;
  onClick: () => void;
}

export class UIButton extends UIElement implements Focusable {
  public readonly element: UIElement = this;

  private readonly background: PIXI.Graphics;
  private readonly text: PIXI.Text;
  private readonly onClick: () => void;
  private isFocused = false;

  constructor(options: UIButtonOptions) {
    super({ width: options.width, height: options.height });
    this.onClick = options.onClick;

    this.background = new PIXI.Graphics();
    this.addChild(this.background);

    this.text = new PIXI.Text({
      text: options.label,
      style: {
        fill: 0xffffff,
        fontFamily: "Arial",
        fontSize: 14,
      },
    });
    this.text.anchor.set(0.5);
    this.text.position.set(this.widthPx * 0.5, this.heightPx * 0.5);
    this.addChild(this.text);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointertap", this.onPointerTap);

    this.redraw();
  }

  public focus(): void {
    this.isFocused = true;
    this.redraw();
  }

  public blur(): void {
    this.isFocused = false;
    this.redraw();
  }

  public activate(): void {
    this.onClick();
  }

  private onPointerTap = (): void => {
    this.onClick();
  };

  private redraw(): void {
    const base = this.isFocused ? 0x3b82f6 : 0x1f2933;
    const border = this.isFocused ? 0x60a5fa : 0x3f4a56;

    this.background.clear();
    this.background.lineStyle(2, border, 1);
    this.background.beginFill(base, 0.95);
    this.background.drawRoundedRect(0, 0, this.widthPx, this.heightPx, 6);
    this.background.endFill();
  }
}
