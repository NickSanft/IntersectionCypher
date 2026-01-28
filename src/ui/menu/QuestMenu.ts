import * as PIXI from "pixi.js";

export class QuestMenu extends PIXI.Container {
  private flags: Record<string, boolean>;
  private widthPx = 0;
  private heightPx = 0;

  constructor(flags: Record<string, boolean>) {
    super();
    this.flags = flags;
  }

  public setFlags(flags: Record<string, boolean>): void {
    this.flags = flags;
    if (this.widthPx > 0 && this.heightPx > 0) {
      this.resize(this.widthPx, this.heightPx);
    }
  }

  public resize(width: number, height: number): void {
    if (this.widthPx === width && this.heightPx === height) {
      return;
    }
    this.widthPx = width;
    this.heightPx = height;
    this.removeChildren();

    const panel = new PIXI.Graphics();
    panel.beginFill(0x0b1220, 0.85);
    panel.lineStyle(1, 0x1e293b, 1);
    panel.drawRoundedRect(0, 0, width, height, 10);
    panel.endFill();
    this.addChild(panel);

    const title = new PIXI.Text({
      text: "Quest Flags",
      style: {
        fill: 0xe2e8f0,
        fontFamily: "Arial",
        fontSize: 16,
        fontWeight: "700",
      },
    });
    title.position.set(16, 12);
    this.addChild(title);

    const entries = Object.entries(this.flags);
    const lines = entries.length
      ? entries.map(([key, value]) => `${value ? "[x]" : "[ ]"} ${key}`).join("\n")
      : "No active flags";

    const list = new PIXI.Text({
      text: lines,
      style: {
        fill: 0xcbd5f5,
        fontFamily: "Arial",
        fontSize: 12,
        lineHeight: 18,
      },
    });
    list.position.set(16, 44);
    this.addChild(list);
  }
}
