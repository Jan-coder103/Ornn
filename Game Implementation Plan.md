### **Phase A: Project Foundation & Tooling**

*Foundation layer. Must be stable before any game logic is added.*

**A.1 Create Folder Structure** ✅

* Create `/src`, `/assets/tiles`, `/assets/sprites`, `/assets/sfx`, `/data/maps`, `/editor`.
* Use ES modules (`type="module"` in package.json or script tags), no bundler at first.
* Keep editor as separate HTML app inside `/editor`.
* **Validation:** All directories exist, imports resolve correctly with ES module syntax.

**A.2 Build index.html Shell** ✅

* Create `index.html` with a single `<canvas id="game">` element centered on screen.
* CSS: `width: 100vw; height: 100vh; image-rendering: pixelated; image-rendering: crisp-edges; image-rendering: -moz-crisp-edges; background: black;`.
* Add `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">` for mobile.
* **Validation:** Canvas fills viewport, no scrollbars, pixels stay sharp.

**A.3 Implement Resolution Scaler** ✅

* Create `RenderConfig` with `INTERNAL_W=360`, `INTERNAL_H=180`, `TILE=18`.
* On window resize: `scale = floor(min(window.innerWidth / 360, window.innerHeight / 180))` clamped to `[2, 3, 4]`.
* Set `canvas.style.width = 360 * scale`, `canvas.style.height = 180 * scale`. Keep `canvas.width = 360`, `canvas.height = 180`.
* **Validation:** Canvas scales correctly across PC/mobile, pixels remain sharp, no blurring on zoom.

**A.4 Asset Manifest Loader** ✅

* Build `AssetLoader.js` that fetches `manifest.json` listing all PNG and JSON files.
* Preload with `Promise.all`, store in `Map<string, HTMLImageElement | object>`.
* Add progress bar during loading.
* **Validation:** All assets load before game states activate, failed loads trigger graceful fallbacks.

**A.5 Global Constants File** ✅

* Create `CONFIG.js` with:
  * `TILE = 18`
  * `GRAVITY = 0.35`
  * `PLAYER_SPEED = 1.2`
  * `JUMP_VEL = -5.2`
  * `BOOMERANG_SPEED = 1.8`
  * `BOOMERANG_RANGE = 96` (6 tiles)
  * `START_HEALTH = 6` (3 hearts × 2 HP each)
* **Validation:** Constants are importable by all modules, tuning happens in one place.

**A.6 Debug Overlay** ✅

* Toggle with backtick key: show FPS, player `x/y`, current state, active entity count.
* Overlay renders on top of everything, uses `ctx.fillText` with monospace style.
* **Validation:** Toggle works, data updates in real-time, doesn't interfere with game logic.

---

### **Phase B: Core Game Loop & State Management**

*Loop architecture and state transitions.*

**B.1 Main Loop with Fixed Timestep** ✅

* Use `requestAnimationFrame`.
* Implement fixed timestep accumulator (`FIXED_DT = 16.666ms`).
* Update physics at fixed rate, render with interpolation alpha for smooth visuals.
* Add safety clamp: `dt = Math.min(dt, 0.05)` to prevent physics explosion on low-FPS devices.
* **Validation:** State transitions work, physics is deterministic, loop targets 60 FPS.

**B.2 State Machine** ✅

* Create `GameStateManager` with states: `BOOT`, `MAIN_MENU`, `HUB`, `OVERWORLD`, `DUNGEON`, `PAUSE`, `INVENTORY`, `DEATH`.
* Only one active state updates at a time.
* Each state implements `enter()`, `exit()`, `update(dt)`, `render(ctx)`.
* **Validation:** States switch cleanly, no cross-contamination between states.

**B.3 State Transitions** ✅

* Add fade-to-black transition (0.3s duration).
* Prevent all input during transition.
* Main menu doubles as pause screen (ESC opens same UI).
* **Validation:** Transitions are smooth, no input leaks during fade.

**B.4 Global Game Data** ✅

* Create `playerData` object: `coinsBank`, `inventory[]`, `equipped{}`, `level`, `xp`, `realmUnlocked = 1`.
* Initialize on new game, persist across state changes.
* **Validation:** Data survives state transitions, accessible from any module.

---

### **Phase C: Rendering Pipeline & Asset Systems**

*Handles drawing, sprite parsing, and visual layers.*

**C.1 Canvas Setup** ✅

* Get `ctx`, set `ctx.imageSmoothingEnabled = false`.
* All draw calls use `Math.floor` on coordinates to avoid subpixel blur.
* **Validation:** No blurry sprites, pixel-perfect rendering at all scale levels.

**C.2 Spritesheet Parser** ✅

* Write `Sprite` class that takes `image`, `frameW`, `frameH`, `animations` map (e.g., `{idle: [0,1], run: [2,3,4,5]}`).
* Account for 1px spacing between frames in all spritesheets: `sx = col * (frameW + 1)`, `sy = row * (frameH + 1)`.
* Character sheet: 24×24px frames, 1px spacing, 9×3 grid. Tile sheet: 18×18px frames, 1px spacing, 20×9 grid.
* Handle `flipX` for left-facing rendering using `ctx.scale(-1, 1)`.
* **Validation:** Animations play correctly, flipping works without distortion.

**C.3 Tilesheet Renderer** ✅

* Write `TilemapRenderer` that draws only tiles visible in camera bounds (camera culling).
* Calculate visible range: `startX = Math.floor(camera.x / 18)`.
* Support multiple layers: `background`, `ground`, `decor`, `collision` (collision not rendered).
* Use `ctx.drawImage()` with source/destination coordinates per tile.
* **Validation:** Maps render correctly at 360×180, off-screen tiles skipped, collision layer aligns with visual layer.

**C.4 Animation System** ✅

* Each entity has an animation timer.
* Advance frames based on `dt`, not frame count: `frameIndex = Math.floor(time * speed) % totalFrames`.
* Support variable frame durations per animation.
* **Validation:** Animations are frame-rate independent, sync with entity state.

**C.5 Parallax Background Rendering** ✅

* Create 2-3 parallax layers at `0.2x`, `0.5x` camera speed for depth.
* Draw layers before tilemap using `ctx.drawImage()` with wrapping/tiling.
* Use in Hub and Overworld scenes.
* **Validation:** Background scrolls slower than foreground, creates depth illusion, performance stable.

---

### **Phase D: Input Handling & Controls**

*Keyboard, mouse, and mobile input abstraction.*

**D.1 Keyboard Manager** ✅

* Track keys: `a/d` (or `ArrowLeft/ArrowRight`), `Space`, `e`, `Escape`.
* Store `pressed`, `justPressed`, `justReleased` for discrete inputs.
* Prevent browser scroll on `Space` with `e.preventDefault()`.
* **Validation:** All keys register, no ghosting issues, browser doesn't scroll.

**D.2 Mouse Manager** ✅

* Track left click for attack.
* Lock attack direction to player facing direction, ignore mouse Y position (GDD: no aiming).
* **Validation:** Click triggers attack in facing direction, mouse position doesn't influence throw direction.

**D.3 Input Abstraction** ✅

* Create `Input.getAxisX()` returns `-1 / 0 / 1`.
* Create `Input.attackPressed()` returns `true` once per click.
* Create `Input.interactPressed()`, `Input.jumpPressed()`, `Input.pausePressed()`.
* All gameplay code uses abstraction layer, never raw keyboard/mouse.
* **Validation:** Gameplay code is input-source agnostic.

**D.4 Mobile Stub** ✅

* Reserve input mapping for touch zones so gameplay code never changes.
* Actual touch buttons implemented in Phase N. For now, define the interface:
  * Left/right D-pad → `getAxisX()`
  * Jump button → `jumpPressed()`
  * Attack button → `attackPressed()`
  * Interact button → `interactPressed()`
* **Validation:** Mobile input interface exists, desktop gameplay unaffected.

---

### **Phase E: Physics & Collision**

*AABB physics, tile collision, and world boundaries.*

✅ **E.1 AABB Physics**

* Every entity has `pos {x, y}`, `vel {x, y}`, `w`, `h`.
* Apply gravity each fixed update: `vel.y += GRAVITY`.
* **Validation:** Gravity consistent, entities accelerate predictably.

✅ **E.2 Tile Collision**

* Read collision layer from map JSON (`1 = solid`).
* Check 4 corners + midpoints of entity bounding box against tile grid.
* Resolve X axis first, then Y axis separately to prevent corner sticking.
* X-axis: move `x += vx * dt`, check overlap, if collision push out to wall edge.
* Y-axis: move `y += vy * dt`, if falling onto ground set `grounded = true`, `vy = 0`.
* **Validation:** Player stops exactly at walls/floors, slides off edges cleanly, no tunneling.

✅ **E.3 One-Way Platforms**

* Tag specific tiles as `platform` in map data (`2 = platform` in collision layer).
* Allow jump-through from below.
* Only land on platform from above when `vel.y > 0`.
* **Validation:** Player can jump through platforms from below, lands on them from above.

✅ **E.4 World Bounds**

* Kill zone below map (y > mapHeight + TILE) triggers death.
* On death: respawn at hub with coin penalty.
* **Validation:** Falling off map kills player correctly, no infinite fall.

---

### **Phase F: Player Controller & Boomerang Combat**

*Core movement, attack mechanic, and feel.*

✅ **F.1 Player Entity**

* Spawn with 6 HP (3 hearts × 2 HP each).
* Speed modified by equipped shoes and mount.
* No sprint, no crouch (per GDD).
* **Validation:** Player spawns with correct HP, gear modifiers apply.

✅ **F.2 Movement with Game Feel**

* A/D accelerates to `PLAYER_SPEED` in 6 frames, decelerates in 4 frames.
* Space gives `JUMP_VEL`, variable height if released early (cut `vy` to 0 on release).
* Coyote time: 6 frames after leaving edge, jump still works.
* Jump buffer: 6 frames before landing, press is remembered.
* **Validation:** Movement feels responsive and fluid, platforming is forgiving but precise.

✅ **F.3 Facing Direction**

* Store last non-zero horizontal input as `player.facing`.
* Boomerang uses `player.facing`, not mouse direction.
* **Validation:** Direction is consistent, boomerang always throws the way player faces.

✅ **F.4 Boomerang Class**

* On attack input, if no active ball: spawn projectile at player center.
* Set `vel.x = facing * BOOMERANG_SPEED`, `travelDistance = 0`.
* **Validation:** Ball spawns at correct position, moves in facing direction.

✅ **F.5 Outbound Travel**

* Each frame add `abs(vel.x)` to `travelDistance`.
* When `travelDistance >= BOOMERANG_RANGE` (96px / 6 tiles), switch to returning state.
* **Validation:** Ball reaches fixed distance, transitions to return cleanly.

✅ **F.6 Return Homing**

* In returning state: set velocity toward player center at `2.2x` speed.
* When distance to player `< 8px`, destroy projectile and set `canAttack = true`.
* **Validation:** Ball homes back to player, cooldown resets only on catch.

✅ **F.7 Damage Logic**

* On collision with enemy: deal damage if `enemy.id` not in `hitList` for this throw.
* Add `enemy.id` to `hitList`. Damage applies on both outbound and return passes.
* Can hit multiple enemies in a single throw.
* **Validation:** Ball damages multiple enemies, doesn't double-hit same enemy per throw.

✅ **F.8 Cooldown Enforcement**

* Set `canAttack = false` on throw, `true` only on return.
* Ignore attack input while `canAttack === false`.
* Round trip ≈ 2 seconds (BOOMERANG_RANGE=96, BOOMERANG_SPEED=1.8).
* **Validation:** No double-throws, player can move freely during cooldown.

✅ **F.9 Visuals & Feedback**

* Rotate boomerang sprite during flight.
* Add 4px white trail particles behind ball.
* Play throw SFX on spawn, catch SFX on return.
* **Validation:** Boomerang looks and sounds distinct, trail particles enhance readability.

---

### **Phase G: Camera & Scene Management**

*Camera follow, scene loading, and transitions.*

✅ **G.1 Smooth Follow Camera**

* Target: `player.x - 180`, `player.y - 90` (centered on player).
* Lerp toward target at `0.1` per frame.
* Clamp to map bounds: `Math.max(0, Math.min(camera.x, mapWidth - 360))`.
* Add deadzone logic to prevent micro-jitter when player stands still.
* **Validation:** Camera tracks smoothly, never shows void outside map bounds.

✅ **G.2 Scene Loader**

* Load scene JSON: `tilesets`, `layers`, `entities`, `spawnPoint`.
* Clear all entities, reset camera, instantiate new scene.
* **Validation:** Scene data parses correctly, entities spawn at defined positions.

✅ **G.3 Scene Types**

* `HubScene`: persistent, no enemies, safe zone.
* `OverworldScene`: regenerates dungeons on each entry from hub.
* `DungeonScene`: instanced, tracks room progress and enemy kills.
* **Validation:** Each scene type enforces its rules (combat/hub/overworld).

✅ **G.4 Transitions**

* Portal interaction (E key) triggers fade-to-black, then loads target scene.
* Prevent all input during transition.
* **Validation:** Transitions are seamless, no memory leaks between scene loads.

---

### **Phase H: Enemy & Boss AI**

*Enemy behavior, boss mechanics, and room progression.*

✅ **H.1 Base Enemy**

* Properties: `hp`, `damage`, `knockbackResistance`, `speed`, `aggroRange`.
* AI states: `IDLE`, `PATROL`, `CHASE`, `ATTACK`, `HIT_STUN`, `DEAD`.
* Load enemy templates from JSON/data file.
* Spawn at predefined spawn points from map editor data.
* **Validation:** Enemies spawn correctly, stats load, no overlapping spawn collisions.

✅ **H.2 Patrol Behavior**

* Walk to edge or wall, turn around. Random patrol duration 3-5 seconds.
* If player within 80px horizontal and same Y level, switch to `CHASE`.
* In `CHASE`: move toward player at increased speed.
* In `ATTACK`: if distance < 20px, play attack animation, deal contact damage.
* **Validation:** Enemies behave predictably, switch states appropriately, don't get stuck.

✅ **H.3 Damage and Death**

* On hit: flash white for 6 frames, apply knockback vector (capped to prevent wall clipping).
* On HP ≤ 0: spawn coin puff particle, remove entity, increment room kill counter.
* **Validation:** Visual/audio feedback matches hits, death triggers loot/counter.

✅ **H.4 Room Clear Logic**

* Dungeon tracks `enemiesKilled` in current room vs `totalEnemies`.
* When `enemiesKilled >= totalEnemies`: open door to next room.
* Room 1 → Room 2 → Boss arena.
* **Validation:** Doors only open when all enemies dead, progression is linear and clear.

✅ **H.5 Boss Spawn & Mechanics**

* After room 2 cleared: spawn boss at center.
* Boss stats: `hp = base × 5`, `damage = 2x`, larger hitbox, immune to knockback.
* 3 attack patterns, all telegraphed 0.6s for slow weapon fairness:
  * **Charge**: rush toward player position.
  * **Jump Slam**: leap and land with area impact.
  * **Projectile Spread**: fire 3-5 projectiles in arc.
* 2 phases: Phase 1 (standard), Phase 2 at 50% HP (faster speed, shorter telegraphs).
* **Validation:** Boss spawns only after room clear, patterns are readable, phases trigger correctly.

✅ **H.6 Boss Death & Rewards**

* Unique death animation (longer than normal enemy).
* Drop loot chest: `rng.pick(2-4 items)` from weighted loot table for current realm.
* Spawn return portal to overworld.
* Mark dungeon as `cleared`.
* **Validation:** Boss death triggers full reward sequence, portal works, dungeon locks.

---

### **Phase I: World Structure – Overworld & Dungeons**

*Hub, overworld generation, dungeon layout, and death handling.*

✅ **I.1 Hub Implementation**

* Peaceful flat map, no enemies, no gravity hazards.
* Place NPC positions for: shop, crystal forge, teleport pad.
* Player respawn point is always here.
* Disable combat inputs in hub.
* **Validation:** Hub loads peacefully, interactions open correct menus, no combat triggers.

✅ **I.2 Overworld Generation**

* On entering from hub: load base overworld tilemap.
* Randomly place 5-8 dungeon entrance sprites using Poisson disc sampling (minimum 120px apart).
* Positions must be on flat ground, no overlap with walls or player start.
* Save positions in scene data for current session.
* On re-entry from hub: regenerate positions, clear old entities.
* **Validation:** Dungeons spawn randomly but fairly, positions don't overlap, spacing is readable.

✅ **I.3 Dungeon Entrances**

* Interactable with E key. Store `dungeonID` (1 of 3 handcrafted dungeons).
* After clear: draw red X overlay above entrance, disable interaction.
* **Validation:** Entrance triggers scene change, red X persists, cleared dungeons can't re-enter.

✅ **I.4 Mini Dungeon Layout**

* Create 3 handcrafted maps (separate JSON files):
  * **Room 1**: 6-8 normal enemies.
  * **Doorway**: connects Room 1 to Room 2.
  * **Room 2**: 8-10 normal enemies.
  * **Boss Arena**: opens after Room 2 cleared.
* All rooms in one JSON per dungeon type.
* **Validation:** All 3 dungeons play through correctly, room transitions work, enemy counts match.

✅ **I.5 Portal Return**

* After boss defeated: spawn portal entity in boss arena.
* Interaction (E key) returns player to overworld at same dungeon entrance location.
* **Validation:** Portal spawns, interaction works, player returns to correct overworld position.

✅ **I.6 Death Handling**

* On player HP ≤ 0 anywhere:
  * `coinsBank = Math.floor(coinsBank * 0.95)` (5% coin loss).
  * HP restored to full.
  * Load HubScene.
  * Show "You lost 5% coins" message for 2 seconds.
  * Keep all gear and inventory (no gear loss).
* **Validation:** Death penalty applies correctly, player respawns in hub with full HP, all items intact.

---

### **Phase J: Inventory, Gear & Crystal System**

*Data structures, equipment, socketing, and loot.*

✅ **J.1 Inventory Data**

* Array of 24 slots, each `{itemId, quantity}`.
* Stackable for crystals and consumables. Gear is unique (quantity 1).
* **Validation:** Items store correctly, stacking works, 24-slot limit enforced.

✅ **J.2 Equipment Slots**

* `equipped = {helmet: null, chest: null, shoes: null, ring1: null, ring2: null, tome: null, mount: null}`.
* Mount only active in overworld (auto-dismount entering dungeon).
* **Validation:** Slot limits enforced, no duplicate gear equipped.

✅ **J.3 Item Definitions**

* `items.json` defines each gear piece with base stats: `hpBonus`, `damageBonus`, `speedBonus`, `crystalSlots` (armor always 1).
* Include rarity tiers, sell values, realm restrictions.
* **Validation:** All items have complete stat data, load correctly from JSON.

✅ **J.4 Equip Logic**

* On equip: unequip previous item back to inventory, place new item in slot.
* Recalculate `totalStats = base + sum(allGear.stats) + crystalBonuses`.
* Update player `maxHp`, `speed`, `damage` immediately.
* **Validation:** Stats update instantly on equip/unequip, previous item returns to inventory.

✅ **J.5 Crystal System**

* Crystals are inventory items with stat mods: `Red (+dmg)`, `Blue (+hp)`, `Green (+speed)`.
* Socketing: if armor crystal slot occupied → destroy old crystal → insert new.
* Update stats immediately on socket.
* Add confirmation popup to prevent accidental destruction.
* **Validation:** Replacement destroys old crystal, new stats apply, popup prevents accidents.

✅ **J.6 Loot Drops**

* Boss drops 2-4 items: roll rarity table, pick from pool for current realm.
* Spawn as physical pickup entities on ground with bounce animation and glow.
* Interact (E key) to collect, add to inventory (or overflow notification).
* **Validation:** Correct number of items drop, rarity weights feel balanced, collection works.

---

### **Phase K: Hub Economy & Progression**

*Shops, currency, forging, and realm unlocks.*

✅ **K.1 Coin Bank**

* All coins go directly to `coinsBank` on pickup. No coin item in inventory.
* Displayed in HUD and all shop interfaces.
* **Validation:** Coins accumulate correctly, no floating coin items.

✅ **K.2 Shop UI**

* Buy list shows items with price. Buy deducts from `coinsBank`.
* Sell gives 40% of item value back to `coinsBank`.
* Update bank instantly on transaction.
* **Validation:** Currency updates correctly, can't buy with insufficient funds, sell price is 40%.

✅ **K.3 Crystal Forge**

* Two actions:
  * **Scrap crystal**: convert to crystal dust.
  * **Upgrade**: 3 same-tier crystals → 1 higher tier crystal.
* Simple UI with drag slots and confirm button.
* **Validation:** Scrap/upgrade logic prevents negative values, crystal quantities update.

✅ **K.4 Mount Shop**

* Mounts give overworld speed multiplier: `1.3x - 1.6x` depending on mount.
* Buy and equip instantly, save to inventory mount slot.
* **Validation:** Mounts save, speed multiplier applies only in overworld.

✅ **K.5 Realm Progression**

* Teleport pad in hub: Realm 1 always available.
* Realm 2 unlocks at player level 5.
* Realm 3 unlocks at player level 10.
* Higher realms use same overworld base tilemap but stronger enemy stats and better loot tables.
* **Validation:** Teleport options unlock at correct levels, higher realms are harder with better rewards.

✅ **K.6 XP System**

* Normal enemy: 5 XP. Boss: 50 XP.
* Level curve: `xpNeeded = 100 * level`.
* On level up: stat increase, check realm unlock threshold.
* **Validation:** XP accumulates correctly, level thresholds work, realm unlocks trigger.

---

### **Phase L: UI/UX & HUD**

*Player-facing interfaces and heads-up display.*

✅ **L.1 HUD Hearts**

* Bottom center: draw 3 heart containers.
* Each heart = 2 HP. Draw full (2 HP), half (1 HP), or empty (0 HP) sprite based on current HP.
* Update in real-time on damage/heal.
* **Validation:** Hearts display correct HP, half-hearts work, position stays fixed.

✅ **L.2 HUD Coins**

* Top right: coin icon + `coinsBank` amount.
* Update instantly on pickup/purchase/death.
* **Validation:** Coin display is accurate and always visible.

✅ **L.3 Inventory Screen**

* Overlay grid (24 slots), gear slots at top (helmet, chest, shoes, ring×2, tome, mount).
* Click or drag to equip/unequip.
* Show stat comparison on hover (green +/red - for each stat).
* Crystal info displayed on armor hover.
* **Validation:** Grid renders correctly, equip/unequip works, tooltips show accurate data.

✅ **L.4 Interaction Prompt**

* When near interactable entity (shop, forge, portal, loot, dungeon entrance): show `[E]` above player.
* Different prompt text per entity type (e.g., `[E] Enter`, `[E] Shop`, `[E] Pick Up`).
* **Validation:** Prompt appears at correct range, disappears when out of range.

✅ **L.5 Pause / Main Menu**

* ESC opens menu with: Resume, Inventory, Save, Quit.
* Same UI used as start screen (Main Menu = Pause).
* Background game state preserved underneath.
* Close with ESC or Resume button.
* **Validation:** Menu pauses logic, game state preserved, ESC toggles correctly.

---

### **Phase M: Save System & Persistence**

*Auto-save, load, and data integrity.*

**M.1 Save Data Schema**

* JSON structure: `{version: 1, coinsBank, inventory[], equipped{}, level, xp, realmUnlocked, clearedDungeons: {realm1: [], realm2: [], realm3: []}, settings}`.
* **Validation:** Schema covers all persistent data.

**M.2 Save Triggers**

* Auto-save on: entering hub, after shop transaction, after equipping item, after boss kill.
* **Never save mid-dungeon** (death reloads to last hub save).
* **Validation:** Save only triggers at safe points, no mid-dungeon save corruption.

**M.3 Load on Boot**

* Read from `localStorage` on game boot.
* If missing or version mismatch: start new game.
* Validate all fields, migrate if needed for future versions.
* **Validation:** Data persists across sessions, corruption handled gracefully, new game starts clean.

---

### **Phase N: Audio, Mobile & Polish**

*Sound, touch controls, particles, and game juice.*

**N.1 Sound Manager**

* WebAudio API with small WAV/OGG files for: jump, throw, catch, hit, pickup, coin, portal, shop, error.
* No music (per GDD).
* Play on demand: `audio.play('hit', volume=0.5)`.
* Implement object pooling: reuse `Audio` objects to prevent GC spikes.
* Require user gesture to init AudioContext (browser policy).
* **Validation:** Sounds trigger correctly, no overlap distortion, works on mobile browsers.

**N.2 Mobile Controls**

* Transparent touch buttons: left/right D-pad, jump, attack, interact.
* Map to same `Input` abstraction layer so gameplay code is unchanged.
* Buttons scale with CSS upscaling, don't obstruct game view.
* **Validation:** Touch controls responsive, no overlap with HUD, gameplay identical to desktop.

**N.3 Particle System**

* Simple particle: `{x, y, vx, vy, life, color, size}`.
* Uses: hit sparks, loot shine glow, dust on landing, boomerang trail, crystal socket flash, portal swirl.
* Object pool to avoid GC, cap max particles at 50.
* Use canvas compositing modes (`lighter`, `screen`) for glow effects.
* **Validation:** Effects enhance feedback, don't drop FPS, clean up properly.

**N.4 Game Juice**

* Screen shake: 3 frames on boss hit.
* Freeze frame: 4 frames on enemy kill (hitstop).
* Damage flash: enemy tints white for 6 frames.
* **Validation:** Juice enhances feel without breaking gameplay timing.

---

### **Phase O: Map Editor (Separate HTML App)**

*Dedicated editor for creating dungeon maps.*

**O.1 Editor Canvas**

* `editor.html` with same 360×180 canvas render but with grid overlay.
* Load tilesheet for painting.
* **Validation:** Editor runs independently, renders tiles and grid correctly.

**O.2 Paint Tools**

* Brush for ground/decor layers.
* Collision layer toggle (red overlay on solid tiles).
* Eraser tool to clear tiles.
* **Validation:** All tools paint/clear correctly, collision layer visually distinct.

**O.3 Entity Placement**

* Place entity types: player spawn, enemy spawn (choose type), boss spawn, portal, dungeon entrance.
* Store as objects with `{x, y, type, properties}`.
* Select, move, delete placed entities.
* **Validation:** Entities place at grid-snapped positions, properties save correctly.

**O.4 Export**

* Export button generates JSON matching game's `TilemapRenderer` format.
* Include `layers[]` array and `entities[]` array.
* File downloads as `.json`.
* **Validation:** Exported JSON loads correctly in the game engine without modification.

**O.5 Import**

* Load existing JSON back into editor for tweaking.
* Parse layers and entities, render on canvas.
* **Validation:** Import/export round-trip preserves all data, used for iterating on the 3 dungeon maps.

---

### **Phase P: QA, Balancing & Future DLC Hooks**

*Playtesting, tuning, and DLC preparation.*

**P.1 Playtest Loop**

* Time a full run: hub → clear 5 dungeons → enter realm 2.
* Target: 8-12 minutes for first realm clear.
* **Validation:** Core loop timing feels right, no major blockers in flow.

**P.2 Balance for Slow Weapon**

* Tune `BOOMERANG_RANGE = 96px` (6 tiles), speed `1.8` so round trip ≈ 2 seconds.
* Enemy HP: 2 hits in early realm, 4 hits in late realm.
* Boss HP: tuned so fight lasts 30-60 seconds.
* **Validation:** Boomerang feels impactful, difficulty is fair despite slow weapon.

**P.3 Test Death Penalty**

* Verify 5% bank loss on death (no negative coins).
* Verify no gear loss, full HP restore, hub respawn.
* Verify no mid-dungeon save means death rolls back to last hub save.
* **Validation:** Death is punishing but not discouraging, all systems handle death correctly.

**P.4 DLC Hooks**

* Reserve item types `fishingPole` and `pickaxe` in inventory (disabled, no function yet).
* Add empty functions `startFishing()` and `startMining()` as placeholders for later minigame.
* Structure code for easy activation: `DLCManager.enable('fishing')`.
* Fishing minigame skeleton: slider moving L→R, tap to stop, reward RNG (full implementation later).
* **Validation:** Items exist in code, minigame UI renders as placeholder, core loop unaffected.

---

### **Dependency Flow Summary**

```
A (Foundation/Tooling) → B (Loop/State) → C (Rendering) → D (Input) → E (Physics)
    → F (Player/Boomerang) → G (Camera/Scenes) → H (Enemies/Bosses) → I (World/Dungeons)
    → J (Inventory/Gear) → K (Economy) → L (UI/HUD) → M (Save) → N (Audio/Mobile/Polish)
    → O (Map Editor) → P (QA/Balance/DLC)
```

Each phase builds directly on the previous one. Do not skip phases. **Start with A–F to get the boomerang feeling perfect — that is the whole game.** Once the boomerang feels good, the rest is content.
