import * as PIXI from "pixi.js";
import { UIElement } from "../../ui/UIElement";

export class LevelUpUI {
  public readonly root: UIElement;
  private readonly background: PIXI.Graphics;
  private readonly title: PIXI.Text;
  private readonly optionsContainer: PIXI.Container;
  private readonly optionEntries: Array<{
    background: PIXI.Graphics;
    label: PIXI.Text;
  }> = [];

  constructor(width: number, height: number) {
    this.root = new UIElement({
      width,
      height,
      anchor: "Center",
      offsetX: 0,
      offsetY: 0,
    });

    this.background = new PIXI.Graphics();
    this.background.beginFill(0x0b1220, 0.95);
    this.background.lineStyle(2, 0x60a5fa, 1);
    this.background.drawRoundedRect(0, 0, width, height, 12);
    this.background.endFill();
    this.root.addChild(this.background);

    this.title = new PIXI.Text({
      text: "Level Up!",
      style: {
        fill: 0xf8fafc,
        fontFamily: "Arial",
        fontSize: 18,
        fontWeight: "700",
      },
    });
    this.title.position.set(16, 12);
    this.root.addChild(this.title);

    this.optionsContainer = new PIXI.Container();
    this.optionsContainer.position.set(16, 48);
    this.root.addChild(this.optionsContainer);
  }

  public setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  public setOptions(labels: string[], selectedIndex: number): void {
    this.optionsContainer.removeChildren();
    this.optionEntries.length = 0;
    const width = this.root.widthPx - 32;
    const height = 28;
    const gap = 10;

    labels.forEach((labelText, index) => {
      const bg = new PIXI.Graphics();
      bg.beginFill(0x0f172a, 0.9);
      bg.lineStyle(1, 0x334155, 1);
      bg.drawRoundedRect(0, 0, width, height, 8);
      bg.endFill();

      const label = new PIXI.Text({
        text: labelText,
        style: {
          fill: 0xe2e8f0,
          fontFamily: "Arial",
          fontSize: 13,
        },
      });
      label.position.set(10, 6);

      const entry = new PIXI.Container();
      entry.addChild(bg);
      entry.addChild(label);
      entry.position.set(0, index * (height + gap));
      this.optionsContainer.addChild(entry);
      this.optionEntries.push({ background: bg, label });
    });

    this.setSelected(selectedIndex);
  }

  public setSelected(index: number): void {
    this.optionEntries.forEach((entry, idx) => {
      entry.background.clear();
      if (idx === index) {
        entry.background.beginFill(0x1e293b, 0.95);
        entry.background.lineStyle(1, 0x60a5fa, 1);
      } else {
        entry.background.beginFill(0x0f172a, 0.9);
        entry.background.lineStyle(1, 0x334155, 1);
      }
      entry.background.drawRoundedRect(0, 0, this.root.widthPx - 32, 28, 8);
      entry.background.endFill();
    });
  }

  public updateLayout(width: number, height: number): void {
    this.root.updateLayout(width, height);
  }
}
