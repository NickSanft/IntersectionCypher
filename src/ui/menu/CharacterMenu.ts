import * as PIXI from "pixi.js";

export interface CharacterStats {
  level: number;
  exp: number;
  expToNext: number;
  hp: string;
  attack: number;
  defense: number;
  focus: number;
  dash: string;
  guard: string;
  projectileDamage: number;
  projectileSpeed: number;
  moveSpeed: number;
  weapon: string;
  body: string;
  arms: string;
  head: string;
  upgrades: Array<{ label: string; rarity: "Common" | "Rare" | "Epic" }>;
}

export class CharacterMenu extends PIXI.Container {
  private data: CharacterStats;
  private widthPx = 0;
  private heightPx = 0;

  constructor(data: CharacterStats) {
    super();
    this.data = data;
  }

  public setData(data: CharacterStats): void {
    this.data = data;
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

    const panelWidth = width * 0.5 - 12;
    const panelHeight = height - 24;

    const statsPanel = new PIXI.Graphics();
    statsPanel.beginFill(0x0b1220, 0.85);
    statsPanel.lineStyle(1, 0x1e293b, 1);
    statsPanel.drawRoundedRect(0, 0, panelWidth, panelHeight, 10);
    statsPanel.endFill();
    statsPanel.position.set(0, 0);
    this.addChild(statsPanel);

    const gearPanel = new PIXI.Graphics();
    gearPanel.beginFill(0x0b1220, 0.85);
    gearPanel.lineStyle(1, 0x1e293b, 1);
    gearPanel.drawRoundedRect(0, 0, panelWidth, panelHeight, 10);
    gearPanel.endFill();
    gearPanel.position.set(width * 0.5 + 12, 0);
    this.addChild(gearPanel);

    const headerStyle: Partial<PIXI.TextStyle> = {
      fill: 0xe2e8f0,
      fontFamily: "Arial",
      fontSize: 16,
      fontWeight: "700",
    };

    const statsHeader = new PIXI.Text({ text: "Status", style: headerStyle });
    statsHeader.position.set(16, 12);
    this.addChild(statsHeader);

    const statsText = new PIXI.Text({
      text:
        `Level  ${this.data.level}\n` +
        `EXP  ${this.data.exp} / ${this.data.expToNext}\n` +
        `HP  ${this.data.hp}\n` +
        `Attack  ${this.data.attack}\n` +
        `Defense  ${this.data.defense}\n` +
        `Focus  ${this.data.focus}\n` +
        `Damage  ${this.data.projectileDamage}\n` +
        `Proj Speed  ${this.data.projectileSpeed}\n` +
        `Move Speed  ${this.data.moveSpeed}\n` +
        `Dash  ${this.data.dash}\n` +
        `Guard  ${this.data.guard}\n`,
      style: {
        fill: 0xcbd5f5,
        fontFamily: "Arial",
        fontSize: 13,
        lineHeight: 20,
      },
    });
    statsText.position.set(16, 44);
    this.addChild(statsText);

    const gearHeader = new PIXI.Text({ text: "Equipment", style: headerStyle });
    gearHeader.position.set(width * 0.5 + 28, 12);
    this.addChild(gearHeader);

    const gearText = new PIXI.Text({
      text:
        `Weapon: ${this.data.weapon}\n` +
        `Body: ${this.data.body}\n` +
        `Arms: ${this.data.arms}\n` +
        `Head: ${this.data.head}\n`,
      style: {
        fill: 0xcbd5f5,
        fontFamily: "Arial",
        fontSize: 13,
        lineHeight: 20,
      },
    });
    gearText.position.set(width * 0.5 + 28, 44);
    this.addChild(gearText);

    const upgradeHeader = new PIXI.Text({ text: "Upgrades", style: headerStyle });
    upgradeHeader.position.set(width * 0.5 + 28, 168);
    this.addChild(upgradeHeader);

    const upgradesText = this.data.upgrades.length
      ? this.data.upgrades
          .slice(0, 8)
          .map((entry) => `- ${entry.label} (${entry.rarity})`)
          .join("\n")
      : "None yet";
    const upgradeList = new PIXI.Text({
      text: upgradesText,
      style: {
        fill: 0x94a3b8,
        fontFamily: "Arial",
        fontSize: 12,
        lineHeight: 18,
      },
    });
    upgradeList.position.set(width * 0.5 + 28, 198);
    this.addChild(upgradeList);
  }
}
