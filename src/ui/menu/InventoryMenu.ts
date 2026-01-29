import * as PIXI from "pixi.js";
import type { InventoryItem } from "../../game/data/Inventory";

export class InventoryMenu extends PIXI.Container {
  private items: InventoryItem[];
  private credits = 0;
  private widthPx = 0;
  private heightPx = 0;

  constructor(items: InventoryItem[], credits: number) {
    super();
    this.items = items;
    this.credits = credits;
  }

  public setData(items: InventoryItem[], credits: number): void {
    this.items = items;
    this.credits = credits;
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

    const cols = 4;
    const slotSize = 64;
    const padding = 16;
    const gap = 12;
    const gridWidth = cols * slotSize + (cols - 1) * gap;
    const startX = padding;
    const startY = padding;

    const title = new PIXI.Text({
      text: `Inventory  (${this.credits}c)`,
      style: {
        fill: 0xe2e8f0,
        fontFamily: "Arial",
        fontSize: 16,
        fontWeight: "700",
      },
    });
    title.position.set(padding, padding);
    this.addChild(title);

    const gridY = startY + 32;
    const maxRows = Math.floor((height - gridY - padding) / (slotSize + gap));
    const slotCount = Math.min(this.items.length, cols * maxRows);

    for (let i = 0; i < slotCount; i += 1) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + col * (slotSize + gap);
      const y = gridY + row * (slotSize + gap);

      const item = this.items[i];
      const labelText =
        item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name;
      const slot = new PIXI.Graphics();
      slot.beginFill(0x0f172a, 0.9);
      slot.lineStyle(2, this.rarityColor(item.rarity), 1);
      slot.drawRoundedRect(x, y, slotSize, slotSize, 8);
      slot.endFill();
      this.addChild(slot);

      const label = new PIXI.Text({
        text: labelText,
        style: {
          fill: 0xcbd5f5,
          fontFamily: "Arial",
          fontSize: 11,
          wordWrap: true,
          wordWrapWidth: slotSize - 8,
        },
      });
      label.position.set(x + 6, y + slotSize + 6);
      this.addChild(label);
    }

    const listX = startX + gridWidth + 32;
    if (listX < width - 120) {
      const listTitle = new PIXI.Text({
        text: "Items",
        style: {
          fill: 0xe2e8f0,
          fontFamily: "Arial",
          fontSize: 14,
          fontWeight: "600",
        },
      });
      listTitle.position.set(listX, gridY);
      this.addChild(listTitle);

      const lines = this.items
        .slice(0, 8)
        .map((item) =>
          item.quantity > 1 ? `- ${item.name} x${item.quantity}` : `- ${item.name}`
        )
        .join("\n");
      const list = new PIXI.Text({
        text: lines,
        style: {
          fill: 0x94a3b8,
          fontFamily: "Arial",
          fontSize: 12,
          lineHeight: 18,
        },
      });
      list.position.set(listX, gridY + 24);
      this.addChild(list);
    }
  }

  private rarityColor(rarity: InventoryItem["rarity"]): number {
    switch (rarity) {
      case "Rare":
        return 0x38bdf8;
      case "Epic":
        return 0xc084fc;
      default:
        return 0x64748b;
    }
  }
}
