# Sprite Assets

Place real PNG spritesheets here to override the procedural placeholders.
Each entity needs a .json manifest and .png spritesheet.

Expected files:
- player.json / player.png
- enemy-chaser.json / enemy-chaser.png
- enemy-turret.json / enemy-turret.png
- enemy-shield.json / enemy-shield.png
- npc.json / npc.png
- npc2.json / npc2.png

See src/game/assets/SpriteLoader.ts for the animation state keys expected:
idle, walk, attack, hurt, dead
