import * as PIXI from "pixi.js";
import { MenuTabButton } from "./MenuTabButton";
import { CharacterMenu } from "./CharacterMenu";

export class MenuSystem extends PIXI.Container {
  private readonly overlay: PIXI.Graphics;
  private readonly frame: PIXI.Graphics;
  private readonly titleText: PIXI.Text;
  private readonly tabBar: PIXI.Container;
  private readonly contentRoot: PIXI.Container;
  private readonly tabs: MenuTabButton[] = [];
  private readonly pages = new Map<string, PIXI.Container>();

  private isVisible = false;
  private openProgress = 0;
  private targetProgress = 0;
  private readonly openSpeed = 6;

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

    this.tabBar = new PIXI.Container();
    this.addChild(this.tabBar);

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
    if (this.openProgress === this.targetProgress) {
      if (this.targetProgress === 0) {
        this.isVisible = false;
        this.visible = false;
      }
      return;
    }

    const direction = Math.sign(this.targetProgress - this.openProgress);
    this.openProgress = Math.max(
      0,
      Math.min(1, this.openProgress + direction * dt * this.openSpeed)
    );
    if (this.openProgress === 0 && this.targetProgress === 0) {
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

    this.layoutTabs(frameX, frameY, frameWidth);
    this.layoutContent(frameX, frameY, frameWidth, frameHeight);
  }

  public registerTabs(): void {
    this.addTab("Character", () => this.setActiveTab("Character"));
    this.addTab("Inventory", () => this.setActiveTab("Inventory"));
    this.addTab("Stats", () => this.setActiveTab("Stats"));
    this.addTab("Quest", () => this.setActiveTab("Quest"));

    const characterPage = new CharacterMenu(680, 360);
    this.pages.set("Character", characterPage);
    this.contentRoot.addChild(characterPage);

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

    this.pages.set("Inventory", placeholder("Inventory"));
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

  private addTab(label: string, onSelect: () => void): void {
    const tab = new MenuTabButton({
      label,
      width: 140,
      height: 34,
      onSelect,
    });
    this.tabBar.addChild(tab);
    this.tabs.push(tab);
  }

  private layoutTabs(frameX: number, frameY: number, frameWidth: number): void {
    const spacing = 10;
    let x = frameX + 24;
    const y = frameY + 54;
    for (const tab of this.tabs) {
      tab.position.set(x, y);
      x += tab.widthPx + spacing;
    }
  }

  private layoutContent(
    frameX: number,
    frameY: number,
    frameWidth: number,
    frameHeight: number
  ): void {
    const contentX = frameX + 24;
    const contentY = frameY + 100;
    const contentWidth = frameWidth - 48;
    const contentHeight = frameHeight - 130;
    this.contentRoot.position.set(contentX, contentY);

    for (const page of this.pages.values()) {
      page.position.set(0, 0);
    }
  }

  private setActiveTab(name: string): void {
    this.titleText.text = name;
    for (const [key, page] of this.pages) {
      page.visible = key === name;
    }
    for (const tab of this.tabs) {
      tab.setActive(tab.label === name);
    }
  }
}
