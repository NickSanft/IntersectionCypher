import * as PIXI from "pixi.js";
import { MenuTabButton } from "./MenuTabButton";
import { CharacterMenu } from "./CharacterMenu";
import { InventoryMenu, type InventoryItem } from "./InventoryMenu";
import type { PlayerData } from "../../game/data/PlayerData";

export class MenuSystem extends PIXI.Container {
  private readonly overlay: PIXI.Graphics;
  private readonly frame: PIXI.Graphics;
  private readonly titleText: PIXI.Text;
  private readonly rail: PIXI.Container;
  private readonly railBg: PIXI.Graphics;
  private readonly contentRoot: PIXI.Container;
  private readonly tabs: MenuTabButton[] = [];
  private readonly pages = new Map<string, PIXI.Container>();
  private characterPage: CharacterMenu | null = null;
  private playerData: PlayerData | null = null;

  private isVisible = false;
  private openProgress = 0;
  private targetProgress = 0;
  private readonly openSpeed = 6;

  private transition = 1;
  private transitionFrom: string | null = null;
  private transitionTo: string | null = null;
  private activeTab: string | null = null;

  private widthPx = 0;
  private heightPx = 0;

  constructor() {
    super();

    this.overlay = new PIXI.Graphics();
    this.addChild(this.overlay);

    this.frame = new PIXI.Graphics();
    this.addChild(this.frame);

    this.titleText = new PIXI.Text({
      text: "Character",
      style: {
        fill: 0xf8fafc,
        fontFamily: "Arial",
        fontSize: 18,
        fontWeight: "700",
      },
    });
    this.addChild(this.titleText);

    this.rail = new PIXI.Container();
    this.railBg = new PIXI.Graphics();
    this.rail.addChild(this.railBg);
    this.addChild(this.rail);

    this.contentRoot = new PIXI.Container();
    this.addChild(this.contentRoot);

    this.visible = false;
  }

  public get isOpen(): boolean {
    return this.isVisible || this.openProgress > 0;
  }

  public open(): void {
    this.isVisible = true;
    this.visible = true;
    this.targetProgress = 1;
  }

  public close(): void {
    this.targetProgress = 0;
  }

  public toggle(): void {
    if (this.isOpen && this.targetProgress === 1) {
      this.close();
    } else {
      this.open();
    }
  }

  public update(dt: number): void {
    if (this.transitionFrom && this.transitionTo && this.transition < 1) {
      this.transition = Math.min(1, this.transition + dt * 6);
      const fromPage = this.pages.get(this.transitionFrom);
      const toPage = this.pages.get(this.transitionTo);
      if (fromPage && toPage) {
        const t = this.transition;
        const easedT = t * t * (3 - 2 * t);
        fromPage.alpha = 1 - easedT;
        toPage.alpha = easedT;
        fromPage.position.x = -24 * easedT;
        toPage.position.x = 24 * (1 - easedT);
        if (t === 1) {
          fromPage.visible = false;
          fromPage.alpha = 1;
          fromPage.position.x = 0;
          toPage.alpha = 1;
          toPage.position.x = 0;
          this.transitionFrom = null;
        }
      }
    }

    if (this.openProgress !== this.targetProgress) {
      const direction = Math.sign(this.targetProgress - this.openProgress);
      this.openProgress = Math.max(
        0,
        Math.min(1, this.openProgress + direction * dt * this.openSpeed)
      );
      if (this.openProgress === 0 && this.targetProgress === 0) {
        this.isVisible = false;
        this.visible = false;
      }
    } else if (this.targetProgress === 0) {
      this.isVisible = false;
      this.visible = false;
    }

    const eased = this.openProgress * this.openProgress * (3 - 2 * this.openProgress);
    this.alpha = eased;
    const scale = 0.98 + 0.02 * eased;
    this.scale.set(scale);
  }

  public updateLayout(screenWidth: number, screenHeight: number): void {
    if (this.widthPx === screenWidth && this.heightPx === screenHeight) {
      return;
    }
    this.widthPx = screenWidth;
    this.heightPx = screenHeight;

    this.overlay.clear();
    this.overlay.beginFill(0x020617, 0.72);
    this.overlay.drawRect(0, 0, screenWidth, screenHeight);
    this.overlay.endFill();

    const frameWidth = Math.min(920, screenWidth - 80);
    const frameHeight = Math.min(560, screenHeight - 80);
    const frameX = (screenWidth - frameWidth) * 0.5;
    const frameY = (screenHeight - frameHeight) * 0.5;

    this.frame.clear();
    this.frame.beginFill(0x0b1220, 0.96);
    this.frame.lineStyle(2, 0x334155, 1);
    this.frame.drawRoundedRect(frameX, frameY, frameWidth, frameHeight, 16);
    this.frame.endFill();

    this.titleText.position.set(frameX + 24, frameY + 18);

    this.layoutRail(frameX, frameY, frameWidth, frameHeight);
    this.layoutContent(frameX, frameY, frameWidth, frameHeight);
  }

  public registerTabs(playerData?: PlayerData): void {
    this.playerData = playerData ?? null;
    this.addTab("Character", () => this.setActiveTab("Character"));
    this.addTab("Inventory", () => this.setActiveTab("Inventory"));
    this.addTab("Stats", () => this.setActiveTab("Stats"));
    this.addTab("Quest", () => this.setActiveTab("Quest"));

    const data = playerData ?? {
      name: "Lea",
      stats: {
        hp: 120,
        maxHp: 120,
        attack: 24,
        defense: 18,
        focus: 12,
        dashMultiplier: 1.35,
        guardMultiplier: 1.15,
      },
      equipment: {
        weapon: "Hexa Blade",
        body: "Prism Guard",
        arms: "Flux Bracers",
        head: "Neo Visor",
      },
    };
    const characterPage = new CharacterMenu({
      level: data.stats.level,
      exp: data.stats.exp,
      expToNext: data.stats.expToNext,
      hp: `${data.stats.hp} / ${data.stats.maxHp}`,
      attack: data.stats.attack,
      defense: data.stats.defense,
      focus: data.stats.focus,
      projectileDamage: data.stats.projectileDamage,
      projectileSpeed: data.stats.projectileSpeed,
      moveSpeed: data.stats.moveSpeed,
      dash: `${data.stats.dashMultiplier.toFixed(2)}x`,
      guard: `${data.stats.guardMultiplier.toFixed(2)}x`,
      weapon: data.equipment.weapon,
      body: data.equipment.body,
      arms: data.equipment.arms,
      head: data.equipment.head,
    });
    this.pages.set("Character", characterPage);
    this.contentRoot.addChild(characterPage);
    this.characterPage = characterPage;

    const items: InventoryItem[] = [
      { id: "potion", name: "Heat Potion", rarity: "Common" },
      { id: "tonic", name: "Focus Tonic", rarity: "Common" },
      { id: "coil", name: "Flux Coil", rarity: "Rare" },
      { id: "badge", name: "Circuit Badge", rarity: "Rare" },
      { id: "blade", name: "Astra Blade", rarity: "Epic" },
      { id: "shell", name: "Prism Shell", rarity: "Common" },
      { id: "gear", name: "Repair Kit", rarity: "Common" },
      { id: "data", name: "Data Fragment", rarity: "Rare" },
      { id: "stone", name: "Cryst Stone", rarity: "Common" },
      { id: "core", name: "Arc Core", rarity: "Epic" },
    ];
    const inventoryPage = new InventoryMenu(items);
    this.pages.set("Inventory", inventoryPage);
    this.contentRoot.addChild(inventoryPage);

    const placeholder = (label: string): PIXI.Container => {
      const container = new PIXI.Container();
      const text = new PIXI.Text({
        text: `${label} page`,
        style: {
          fill: 0x94a3b8,
          fontFamily: "Arial",
          fontSize: 16,
        },
      });
      text.position.set(16, 16);
      container.addChild(text);
      return container;
    };

    this.pages.set("Stats", placeholder("Stats"));
    this.pages.set("Quest", placeholder("Quest"));
    for (const [key, page] of this.pages) {
      if (!this.contentRoot.children.includes(page)) {
        this.contentRoot.addChild(page);
      }
      page.visible = key === "Character";
    }
    this.setActiveTab("Character");
  }

  public updatePlayerData(playerData: PlayerData): void {
    this.playerData = playerData;
    if (!this.characterPage) {
      return;
    }
    const data = playerData;
    this.characterPage.setData({
      level: data.stats.level,
      exp: data.stats.exp,
      expToNext: data.stats.expToNext,
      hp: `${data.stats.hp} / ${data.stats.maxHp}`,
      attack: data.stats.attack,
      defense: data.stats.defense,
      focus: data.stats.focus,
      projectileDamage: data.stats.projectileDamage,
      projectileSpeed: data.stats.projectileSpeed,
      moveSpeed: data.stats.moveSpeed,
      dash: `${data.stats.dashMultiplier.toFixed(2)}x`,
      guard: `${data.stats.guardMultiplier.toFixed(2)}x`,
      weapon: data.equipment.weapon,
      body: data.equipment.body,
      arms: data.equipment.arms,
      head: data.equipment.head,
    });
  }

  private addTab(label: string, onSelect: () => void): void {
    const tab = new MenuTabButton({
      label,
      width: 140,
      height: 38,
      onSelect,
    });
    this.rail.addChild(tab);
    this.tabs.push(tab);
  }

  private layoutRail(
    frameX: number,
    frameY: number,
    frameWidth: number,
    frameHeight: number
  ): void {
    const railWidth = 170;
    const railX = frameX + 16;
    const railY = frameY + 56;
    const railHeight = frameHeight - 72;

    this.railBg.clear();
    this.railBg.beginFill(0x0a1020, 0.9);
    this.railBg.lineStyle(1, 0x1e293b, 1);
    this.railBg.drawRoundedRect(railX, railY, railWidth, railHeight, 12);
    this.railBg.endFill();

    const spacing = 12;
    let y = railY + 16;
    const x = railX + 14;
    for (const tab of this.tabs) {
      tab.position.set(x, y);
      y += tab.heightPx + spacing;
    }
  }

  private layoutContent(
    frameX: number,
    frameY: number,
    frameWidth: number,
    frameHeight: number
  ): void {
    const railWidth = 170;
    const contentX = frameX + 24 + railWidth + 20;
    const contentY = frameY + 100;
    const contentWidth = frameWidth - (24 + railWidth + 44);
    const contentHeight = frameHeight - 130;
    this.contentRoot.position.set(contentX, contentY);

    for (const page of this.pages.values()) {
      page.position.set(0, 0);
      if ("resize" in page && typeof (page as { resize: unknown }).resize === "function") {
        (page as { resize: (w: number, h: number) => void }).resize(
          contentWidth,
          contentHeight
        );
      }
    }
  }

  private setActiveTab(name: string): void {
    this.titleText.text = name;
    if (this.activeTab === name && this.transitionTo === name) {
      return;
    }
    const current = this.activeTab ?? name;
    for (const [key, page] of this.pages) {
      page.visible = key === name || key === current;
      page.alpha = key === name ? 0 : 1;
      page.position.x = 0;
    }
    if (current !== name) {
      this.transitionFrom = current;
      this.transitionTo = name;
      this.transition = 0;
    } else {
      this.transitionFrom = null;
      this.transitionTo = name;
      this.transition = 1;
    }
    this.activeTab = name;
    for (const tab of this.tabs) {
      tab.setActive(tab.label === name);
    }
  }
}
