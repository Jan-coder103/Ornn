# Ornn

A 2D pixel-art platformer where you forge legendary gear by battling through vibrant realms using a slow but deadly magic boomerang ball that demands precise timing.

## Overview

- **Genre:** 2D Platformer (similar to Trove, but in 2D)
- **Platform:** Web (PC and Mobile)
- **Engine:** Pure JavaScript and HTML5 Canvas (no external engine)
- **Resolution:** Internal 360×180 with pixel-perfect upscaling (2×, 3×, or 4× based on screen size)

## Core Gameplay

- **Combat:** Magic boomerang ball that travels horizontally and returns to the player. Fixed range, damage on both outbound and return passes. Requires precise timing.
- **Progression:** Hub → Teleport to realm → Enter mini dungeons → Fight enemies → Kill boss → Loot drops → Upgrade gear → Next dungeon/realm
- **Death:** Respawn at hub, lose 5% of coins (no gear loss)
- **Worlds:** 3 realms (unlockable at player levels 1, 5, and 10)

## Key Features

- **Pixel Art:** Tile-based world with spritesheets for characters, tiles, and backgrounds
- **Inventory System:** 24-slot inventory with gear slots (helmet, chest, shoes, rings, tome, mount)
- **Crystal System:** Socket crystals into armor pieces for stat bonuses (Path of Exile style)
- **Hub Economy:** Shops, crystal forge, and mount purchases
- **Procedural Overworld:** Dungeons spawn randomly (5-8 per realm) with handcrafted layouts
- **Boss Mechanics:** Multiple attack patterns with telegraphed moves and phase transitions
- **Map Editor:** Separate HTML app for creating and exporting dungeon maps

## How to Run

### Starting a Local Server

This game requires a local web server to work properly due to ES module loading. Use Python's built-in HTTP server:

```bash
python3 -m http.server 5000
```

Then open your browser and navigate to:
```
http://localhost:5000
```

### Alternative Servers

You can also use other local server options:
- Python 2: `python -m SimpleHTTPServer 5000`
- Node.js (http-server): `npx http-server -p 5000`
- PHP: `php -S localhost:5000`

## Controls

### Desktop
- **A / D** or **Left Arrow / Right Arrow**: Move left/right
- **Space**: Jump
- **Mouse Left Click**: Attack (throws boomerang in facing direction)
- **E**: Interact (portals, doors, shops, loot)
- **Escape**: Pause / Menu
- **O**: Toggle debug overlay

### Mobile
Touch controls (planned implementation):
- D-pad: Movement
- Jump button: Jump
- Attack button: Attack
- Interact button: Interact

## Project Structure

```
Ornn/
├── index.html                 # Game entry point
├── manifest.json              # Asset manifest
├── README.md                  # This file
├── Game Design Document.md    # Full game design documentation
├── Game Implementation Plan.md # Phased development plan
├── Project File Index.md      # File reference guide
│
├── src/                       # Core engine
│   ├── main.js               # Bootstrap and state registration
│   ├── CONFIG.js             # Game constants and tunables
│   ├── RenderConfig.js       # Canvas setup and scaling
│   ├── AssetLoader.js        # Asset preloading
│   ├── GameLoop.js           # Fixed timestep loop
│   ├── GameStateManager.js   # State machine
│   ├── Input.js              # Input abstraction layer
│   ├── Physics.js            # AABB physics and collision
│   ├── Camera.js             # Smooth follow camera
│   ├── Sprite.js             # Spritesheet animation
│   ├── TilemapRenderer.js    # Map rendering
│   ├── Scene.js              # Core gameplay orchestrator
│   └── ...                   # Additional engine modules
│
├── src/entities/             # Game objects
│   ├── Player.js
│   ├── Boomerang.js
│   ├── Enemy.js
│   ├── Boss.js
│   └── Particles.js
│
├── src/states/               # Game states
│   ├── BootState.js
│   ├── MenuState.js
│   ├── HubState.js
│   ├── OverworldState.js
│   └── DungeonState.js
│
├── data/maps/                # Level data (JSON)
│   ├── overworld.json
│   ├── dungeon_room1.json
│   ├── dungeon_room2.json
│   ├── dungeon_boss.json
│   └── placeholder.json
│
├── assets/                   # Art assets
│   ├── tiles/
│   │   ├── tilemap.png              # Main tilesheet
│   │   ├── tilemap-backgrounds.png  # Background tiles
│   │   └── tilemap-characters.png   # Character sprites
│   ├── sfx/                    # Sound effects (empty - not yet implemented)
│   └── sprites/                # Additional sprites (empty)
│
└── editor/                   # Map editor
    └── editor.html           # Standalone map editor
```

## Planned Updates / Features

- **Fishing:** Simple fishing minigame with slider timing mechanics
- **Mining:** Ore collection using same minigame mechanics
- Both items (fishing pole, pickaxe) already exist in code as disabled placeholders

## Technical Details

- **Resolution:** 360×180 internal (2:1 aspect ratio)
- **Tile Size:** 18×18 pixels
- **Physics:** AABB collision with solid tiles (1) and platforms (2)
- **Update Rate:** Fixed 60 FPS with accumulator
- **Rendering:** Canvas 2D with pixel-perfect rendering (`image-rendering: pixelated`)
- **Modules:** ES modules, no bundler required

## Development

### Building Maps

Use the included map editor:
```bash
python3 -m http.server 5000
# Navigate to http://localhost:5000/editor/editor.html
```

Editor features:
- Paint tiles across 4 layers (background, ground, decor, collision)
- Place entities (spawn points, enemies, portals, NPCs)
- Export to JSON format compatible with the game engine
- Undo/redo, grid overlay, collision overlay

### Tuning

Edit `src/CONFIG.js` to adjust:
- Player speed, jump velocity, gravity
- Boomerang speed and range
- Enemy stats and behavior
- Camera lerp speed
- Health values

## License

This project is currently in development.

---

**Ornn** — Forge your legend, one boomerang at a time.
