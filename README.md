# IntersectionCypher

A 2D top-down action RPG built with **Pixi.js 8** and **TypeScript**. Move through maps, fight enemies, talk to NPCs, use abilities, and progress through a systems-driven game loop.

## Tech Stack

- **Pixi.js 8** – 2D WebGL rendering
- **TypeScript** – Typed game logic and systems
- **Vite** – Dev server, build, and preview

## Getting Started

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (e.g. `http://localhost:5173`).

### Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server (Vite)  |
| `npm run build`| Production build         |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript check (no emit) |

## Controls

- **WASD / Arrow keys** – Move
- **Space** – Interact (doors, NPCs, chests, checkpoints, events)
- **M / Esc** – Open / close menu

Combat uses mouse aim and ability keys (see in-game HUD).

## Features

- **Maps & doors** – Multiple tile maps with door transitions and spawn points
- **Combat** – Player and enemy projectiles, hit feedback, damage numbers, impact FX
- **Enemies** – Chaser and turret AI with aggro, patrol, and respawn
- **Abilities** – Ability bar with cooldowns and charge-based attacks
- **NPCs & dialog** – JSON-driven dialog engine with branches and actions (e.g. open shop, set flags)
- **Triggers** – Loot chests, checkpoints, and one-shot events with rewards (credits, items, flags)
- **Progression** – Level-up system with stat choices
- **Menus** – Character, inventory, and quest tabs with focus management
- **HUD** – HP, EXP, level, minimap, ability bar, contextual prompts
- **Camera** – Follow player with optional screen shake

## Project Structure

```
src/
├── main.ts                 # Bootstrap: PIXI app, world, entities, systems, game loop
├── index.ts
├── core/
│   ├── physics/            # Collision, movement
│   └── world/              # TileMap, MapUtils
├── entities/
│   └── ZEntity.ts          # Position/velocity/sprite entity
├── game/
│   ├── abilities/          # Ability definitions and factory
│   ├── data/               # PlayerData, EnemyData, Inventory, Quest
│   ├── dialog/             # DialogEngine, DialogUI
│   ├── dialogs/            # JSON dialog trees (npc, npc2, event)
│   ├── level/              # LevelUpUI
│   ├── systems/            # Update systems (Player, Combat, AI, HUD, etc.)
│   ├── Input.ts
│   ├── PlayerController.ts
│   └── types.ts            # GameState and related types
├── projectiles/
│   └── Projectile.ts
└── ui/
    ├── focus/              # FocusManager
    ├── menu/               # MenuSystem, CharacterMenu, InventoryMenu, QuestMenu
    ├── UIButton.ts
    └── UIElement.ts
```

Game logic is driven by a single **game state** object and discrete **systems** that run each frame (e.g. `PlayerSystem`, `CombatSystem`, `EnemyAISystem`, `TriggerSystem`, `DialogSystem`).

## License

Private project.
