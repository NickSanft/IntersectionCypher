import * as PIXI from "pixi.js";
import { UIElement } from "../../ui/UIElement";

export class LevelUpUI {
  public readonly root: UIElement;
  private readonly background: PIXI.Graphics;
  private readonly title: PIXI.Text;
  private readonly optionsContainer: PIXI.Container;
  private optionWidth = 0;
  private readonly optionEntries: Array<{
    background: PIXI.Graphics;
    label: PIXI.Text;
    container: PIXI.Container;
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
    this.redrawBackground();
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
    this.optionsContainer.position.set(16, 56);
    this.root.addChild(this.optionsContainer);
  }

  public setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  public setOptions(
    labels: string[],
    selectedIndex: number,
    onSelect?: (index: number) => void
  ): void {
    this.optionsContainer.removeChildren();
    this.optionEntries.length = 0;
    const height = 24;
    const gap = 8;
    const maxLabelWidth = labels.reduce((max, label) => {
      const measure = new PIXI.Text({
        text: label,
        style: {
          fill: 0xe2e8f0,
          fontFamily: "Arial",
          fontSize: 13,
        },
      });
      const width = measure.width;
      measure.destroy();
      return Math.max(max, width);
    }, 0);
    this.optionWidth = Math.max(this.root.widthPx - 32, maxLabelWidth + 40);

    labels.forEach((labelText, index) => {
      const bg = new PIXI.Graphics();
      bg.beginFill(0x0f172a, 0.9);
      bg.lineStyle(1, 0x334155, 1);
      bg.drawRoundedRect(0, 0, this.optionWidth, height, 8);
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
      if (onSelect) {
        entry.eventMode = "static";
        entry.cursor = "pointer";
        entry.on("pointertap", () => onSelect(index));
        entry.on("pointerover", () => this.setSelected(index));
      }
      this.optionsContainer.addChild(entry);
      this.optionEntries.push({ background: bg, label, container: entry });
    });

    const totalHeight =
      this.optionsContainer.position.y +
      labels.length * (height + gap) -
      gap +
      16;
    const newHeight = Math.max(this.root.heightPx, totalHeight);
    const newWidth = Math.max(this.root.widthPx, this.optionWidth + 32);
    this.root.setSize(newWidth, newHeight);
    this.redrawBackground();
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
      entry.background.drawRoundedRect(0, 0, this.optionWidth, 28, 8);
      entry.background.endFill();
    });
  }

  public updateLayout(width: number, height: number): void {
    this.root.updateLayout(width, height);
  }

  private redrawBackground(): void {
    this.background.clear();
    this.background.beginFill(0x0b1220, 0.95);
    this.background.lineStyle(2, 0x60a5fa, 1);
    this.background.drawRoundedRect(0, 0, this.root.widthPx, this.root.heightPx, 12);
    this.background.endFill();
  }
}
