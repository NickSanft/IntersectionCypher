import * as PIXI from "pixi.js";

export interface MenuTabButtonOptions {
  label: string;
  width: number;
  height: number;
  onSelect: () => void;
}

export class MenuTabButton extends PIXI.Container {
  private readonly background: PIXI.Graphics;
  private readonly text: PIXI.Text;
  private readonly onSelect: () => void;
  private active = false;

  public readonly widthPx: number;
  public readonly heightPx: number;
  public readonly label: string;

  constructor(options: MenuTabButtonOptions) {
    super();
    this.widthPx = options.width;
    this.heightPx = options.height;
    this.label = options.label;
    this.onSelect = options.onSelect;

    this.background = new PIXI.Graphics();
    this.addChild(this.background);

    this.text = new PIXI.Text({
      text: this.label,
      style: {
        fill: 0xe2e8f0,
        fontFamily: "Arial",
        fontSize: 14,
        fontWeight: "600",
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

  public setActive(active: boolean): void {
    this.active = active;
    this.redraw();
  }

  private onPointerTap = (): void => {
    this.onSelect();
  };

  private redraw(): void {
    const base = this.active ? 0x0f172a : 0x111827;
    const border = this.active ? 0x38bdf8 : 0x1f2937;
    const glow = this.active ? 0.8 : 0.4;

    this.background.clear();
    this.background.lineStyle(2, border, glow);
    this.background.beginFill(base, 0.9);
    this.background.drawRoundedRect(0, 0, this.widthPx, this.heightPx, 8);
    this.background.endFill();
  }
}
