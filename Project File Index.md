### Project File Index - Ornn

Quick reference for every file in the project. For another agent to understand what each file does without reading it.

---

## Root

**`index.html`** — Entry point. Single `<canvas id="game">` centered via CSS with `image-rendering: pixelated`. Loads `src/main.js` as ES module. No other HTML.

**`manifest.json`** — Asset manifest for `AssetLoader`. Currently empty `{}`. Should map asset keys to file paths (PNG/JSON) for preloading.

**`Game Design Document - Ornn.md`** — Full GDD: 2D platformer with boomerang combat, hub/overworld/dungeon structure, pixel art, no engine (pure JS+Canvas). Defines gear/crystal/inventory systems.

**`Game Implementation Plan.md`** — Phased implementation plan (A through P). Phases A–H are marked done. Defines dependency flow and validation criteria for each feature.

---

## `src/` — Core Engine

**`main.js`** — App bootstrap. Loads manifest, registers all states (Boot, Menu, Hub, Overworld, Dungeon), wires update/render callbacks into the game loop. Dependencies: everything.

**`CONFIG.js`** — All tunable constants: tile size, gravity, player speed, boomerang physics, health, knockback, camera lerp. Imported by nearly every gameplay module.

**`RenderConfig.js`** — Creates and exports the canvas (`360×180` internal) and `ctx`. Handles CSS upscaling (2x–4x) on resize. Exports `INTERNAL_W`, `INTERNAL_H`, `canvas`, `ctx`.

**`AssetLoader.js`** — Fetches `manifest.json`, preloads images (PNG) and data (JSON) via `Promise.allSettled`. Stores in a `Map`. Draws a loading progress bar. Depends on `RenderConfig`.

**`GameLoop.js`** — Fixed-timestep loop (`1/60s`) using `requestAnimationFrame` with accumulator. Calls `update(dt)` at fixed rate and `render(alpha)` with interpolation. Depends on `RenderConfig`.

**`GameStateManager.js`** — State machine with states: BOOT, MAIN_MENU, HUB, OVERWORLD, DUNGEON, PAUSE, INVENTORY, DEATH. Registry pattern: `registerState()`, `changeState()`. Each state has `enter/exit/update/render`.

**`Input.js`** — Keyboard + mouse + mobile input abstraction. Exports `getAxisX()`, `jumpPressed()`, `attackPressed()`, `interactPressed()`, `pausePressed()`. Clears per-frame state via `clearFrame()`. Mobile stub setters included.

**`Physics.js`** — `Body` class (pos, vel, w, h, grounded, dead) and `Physics` class. Applies gravity, resolves X then Y tile collisions (solid=1, platform=2), checks world bounds for death. Depends on `CONFIG`, used by `Scene`.

**`Camera.js`** — Smooth follow camera with deadzone. `follow()` lerps toward player, `clamp()` to map bounds, `snapTo()` for instant positioning. Depends on `RenderConfig`, `CONFIG`.

**`Sprite.js`** — Spritesheet animation player. Takes image, frame size, animation map. Handles 1px spacing, flipX rendering, frame advancement by dt. Depends on `Draw.js`.

**`Animation.js`** — Generic animation system with `Animation` (frame list + durations) and `Animator` (manages named animations, play/switch). Used independently of `Sprite.js`.

**`TilemapRenderer.js`** — Loads map JSON (layers: background, ground, decor, collision). Renders only visible tiles via camera culling. Provides `isSolid()`/`isPlatform()` for physics. Depends on `RenderConfig`, `Draw.js`.

**`Draw.js`** — Low-level draw helpers: `drawImage()` with floor+flipX, `clear()`, `fillRect()`, `fillText()`. All coords `Math.floor` for pixel-perfect rendering. Depends on `RenderConfig`.

**`Scene.js`** — Core gameplay orchestrator (569 lines, the largest file). Loads map, spawns player/enemies/boss/portals, runs physics, handles boomerang combat + collisions, room-clear logic, boss death rewards, HUD hearts. Used by all game states. Depends on nearly everything.

**`Transition.js`** — Fade-to-black transition (0.3s). Blocks input during fade. Supports both state names and callbacks as targets. Depends on `RenderConfig`, `GameStateManager`.

**`ParallaxBackground.js`** — Multi-layer parallax with configurable scroll speeds. Tiling/wrapping of background images. Depends on `RenderConfig`.

**`Debug.js`** — Toggleable overlay (press `O`) showing FPS, current state, player position, entity count. Depends on `RenderConfig`.

**`GameData.js`** — Persistent player data: `coinsBank`, `inventory[]`, `equipped{}`, `level`, `xp`, `realmUnlocked`, `health`. Includes `resetPlayerData()`. Not yet wired to save/load.

**`EnemyTemplates.js`** — Defines enemy stat blocks: `slime` (hp 2, fast, green) and `skeleton` (hp 4, stronger, gray). Imported by `Scene.js`.

**`Portal.js`** — Interactable portal entity. Pulsing purple visual, `[E]` prompt when player is near, stores target state name. Depends on `CONFIG`, `RenderConfig`.

**`Door.js`** — Door entity that appears after room clear. Brown/amber visual, `[E]` prompt. Triggers `onRoomCleared` callback. Depends on `CONFIG`.

---

## `src/entities/` — Game Objects

**`Player.js`** — Player controller: acceleration/deceleration, coyote time, jump buffering, variable jump height, invincibility frames, knockback, damage, respawn. Renders as blue rectangle with white eye. Depends on `Physics`, `CONFIG`, `Input`.

**`Boomerang.js`** — Boomerang projectile: outbound travel (fixed range 96px), then homing return at 2.2x speed. Tracks `hitList` (Set) to prevent double-hits per throw. Rotating yellow/orange square visual. Depends on `CONFIG`.

**`Enemy.js`** — AI enemy with states: IDLE, PATROL, CHASE, ATTACK, HIT_STUN, DEAD. Edge/wall detection for patrol, aggro range check, knockback with resistance, flash-white on hit. Depends on `Physics`, `CONFIG`.

**`Boss.js`** — Boss with 3 attack patterns (charge, jump slam, projectile spread), 2 phases (50% HP trigger), telegraph system, death animation. Fires tracked projectiles and creates slam impact area. Depends on `Physics`, `CONFIG`.

**`Particles.js`** — Simple particle system with `Particle` (x, y, vx, vy, life, size, color) and `ParticleSystem` (emit burst, update, render with alpha fade). No pooling yet. Used by `Scene.js` for all visual feedback.

---

## `src/states/` — Game States

**`BootState.js`** — Shows "Ornn" text for 0.5s then auto-transitions to MAIN_MENU. Minimal.

**`MenuState.js`** — Main menu / title screen. Press Enter to transition to HUB. Dark background, "ORNN" title.

**`HubState.js`** — Creates a `Scene` with `placeholder.json`. Peaceful zone (currently shares Scene with combat logic — no hub-specific behavior yet).

**`OverworldState.js`** — Creates a `Scene` with `overworld.json`. No overworld-specific logic yet (dungeon random placement not implemented).

**`DungeonState.js`** — Multi-room dungeon progression. Loads rooms sequentially: `dungeon_room1` → `dungeon_room2` → `dungeon_boss`. Each room clears before door opens. ESC returns to HUB. After all rooms, transitions to HUB.

---

## `data/maps/` — Map Data (JSON)

All maps use the same schema: `{width, height, layers[{name, data[]}], entities[{type, x, y, ...}]}`. Layers: background, ground, decor, collision. Collision values: 0=empty, 1=solid, 2=platform.

**`overworld.json`** — 30×10 overworld with sky background, flat ground, two floating platforms, player spawn at (2,6), two portals (HUB at left, DUNGEON at right).

**`dungeon_room1.json`** — 20×10 room with 3 slime enemies. No walls except floor.

**`dungeon_room2.json`** — 20×10 room with 4 enemies (3 slimes + 1 skeleton). Same layout as room1.

**`dungeon_boss.json`** — 20×10 enclosed arena with side walls. Boss spawn at (15,5). Player spawns at (3,6).

**`placeholder.json`** — 20×10 test map used as hub. Has a gap in the floor, a floating platform, 2 slimes, a portal to OVERWORLD, and player spawn at (3,6).

---

## `assets/` — Art Assets

**`assets/tiles/tilemap.png`** — Main tilesheet: 18×18px tiles, 1px spacing, 20×9 grid (180 tiles). Used for ground/walls/decor.

**`assets/tiles/tilemap-backgrounds.png`** — Background tilesheet: 24×24px, 1px spacing, 8×3 grid (24 tiles). For parallax/background layers.

**`assets/tiles/tilemap-characters.png`** — Character spritesheet: 24×24px frames, 1px spacing, 9×3 grid (27 frames). For player/enemy animations.

**`assets/tiles/Tilesheet (Tiles).txt`** — Metadata: tile dimensions and grid info for tilemap.png.

**`assets/tiles/Tilesheet (Backgrounds).txt`** — Metadata for tilemap-backgrounds.png.

**`assets/tiles/Tilesheet (Characters).txt`** — Metadata for tilemap-characters.png.

**`assets/sfx/`** — Empty directory. Sound effects not yet implemented.

**`assets/sprites/`** — Empty directory. Additional sprites not yet added.

---

## `editor/` — Map Editor

**`editor/`** — Empty directory. Map editor (separate HTML app) not yet implemented.

---

## Dependency Graph (Simplified)

```
RenderConfig ←── Draw, Sprite, TilemapRenderer, Camera, AssetLoader, GameLoop,
                  GameStateManager, Transition, Debug, ParallaxBackground

CONFIG ←── Physics, Player, Boomerang, Enemy, Boss, Camera, Scene

Input ←── Player, Scene, MenuState, DungeonState

Scene ←── HubState, OverworldState, DungeonState
         (Scene is the central hub connecting all gameplay systems)

TilemapRenderer ←── Scene ←── Physics
                          ←── Player, Enemy, Boss, Boomerang, Particles
                          ←── Portal, Door
                          ←── Camera
                          ←── Input, Transition, GameStateManager
```

## Implementation Status

Phases **A through H** are foundation, loop, rendering, input, physics, player/boomerang, camera/scenes, enemies/bosses. 
Other phases: **I** (world structure — overworld generation, death handling), **J** (inventory/gear/crystals), **K** (economy/shops/XP), **L** (UI/HUD polish), **M** (save system), **N** (audio/mobile/polish), **O** (map editor), **P** (QA/balance). 

The spritesheet/tile images exist but are not yet wired into rendering — maps currently use colored rectangles.
