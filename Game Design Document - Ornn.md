### **Game Design Document \- Ornn**

### **1\. Overview / Elevator Pitch**

* **Game concept**: Forge legendary gear by battling through vibrant pixel-art realms, where your only weapon is a slow but deadly magic boomerang ball that demands precise timing.  
* **Genre**: 2d platformer, similar to the game trove but in 2d  
* **Platform**: Web (Pc and Mobile)  
* **Who is the player?**: Ornn \- a cute character exploring the world

---

### **2\. Gameplay & Mechanics**

* **Core loop**: hub → teleport to realm → enter mini dungeon → fight enemies →boss spawns → kill boss → loot drops → upgrade character → go to next dungeon or teleport back to hub  
* **Mechanics**: Movement (left, right, jump. No sprint/crouch), combat (magic ball that boomerangs back to player \- is slow), inventory, no dialogue systems  
* **Progression**: Start in hub → teleport to realm 1 → walk through overworld →enter mini dungeons → fight bosses and earn xp and get loot → upgrade gear & improve stats → teleport to higher tier realm → stronger bosses but also better loot → level up to reach realm 3  
* **Win/lose conditions**: No Ending, if killed simply respawn at hub and loose 5% of coins in bank (all coins are automatically in bank), no gear loss \= keep inventory 

---

### **3\. World Design & Levels**

* **World structure**:   
  * Hub: This is the central hub, peaceful, stores, buy gear, sell gear, scrap crystals for crystal dust, upgrade crystals, buy mounts  
  * Overworld: Peaceful overworld, mostly flat and far, dungeons spawn randomly when the world is entered from hub (not when exited), dungeons are simply a big sprite that can be entered \= scene change to dungeon, traveling with mount for faster traversal but only on overworld. When going to hub and entering the realm again it gets newly generated (the floor and everything is the same but the dungeons get randomly placed (5-8 dungeons)  
  * Mini Dungeons: 3 different hand crafted dungeons, 1 room with normal enemies, then walk to secon room with more normal enemies, once they are defeated the boss spawns, kill boss → loot drops to ground (2-4 items, randomly chosen), and portal spawns to get back to overworld, once dungeon is defeated a red X appears above the dungeon and it cant be entered anymore  
* **Dungeon design philosophy**: Short and quick, the faster the player can beat a dungeons the better, gameplay should feel fast and tacky, yet difficult because the only and main attack of the player is a slow moving magic ball that does damage (like the ball from Ahri in league of legends, fixed distance, damage also on return, cooldown until ball returned to player, can hit multiple enemies). No aiming,  throws the ball horizontally in the direction of walking

---

### **4\. Art & Audio Direction**

* **Visual style**: Pixel art, sprite & tile sheets  
* **Mood & atmosphere**: Colorful and happy  
* **Music & sound design**: no music, simple sounds for jump/attack/hit etc

---

### **5\. User Interface (UI) & User Experience (UX)**

* **HUD elements**: Health displayed as hearts on the bottom center (starting with 3), minimap not needed, inventory button (for opening the inventory), controls (if on mobile)  
* **Menus**: Main menu \= also equals pause, inventory screen (overlay), shop interfaces, crystal forge interface,   
* **Control scheme**: a (left), d (right), space (jump), mouse left (attack), e (interact)

---

### **6\. Technical Requirements**

* **Engine**: No engine, pure JavaScript and HTML5  
* **Features** to implement:  
  * **Tilesheet system**  
  * **Spritesheet system**  
  * **Map Editor** (its own html app, only for creating the game. Exports a JSON, needs to be read at runtime. Features: Paint tiles, place entities (enemies, spawn points), collision layer, export  
* **Rendering**:   
  * **Internal resolution**: 360×180 (2:1, fits 20×10 tiles at 18px)  
  * **CSS upscaling**: 2×, 3×, or 4× depending on screen size  
  * image-rendering: pixelated & image-rendering: crisp-edges

---

### **7\. Later planned DLCs**

* **Fishing**: A imple simple fishing rod and minigame, slider moving quickly from left to right and back, simply hit the button again at the right moment to get a random fish  
* **Mining Ore**: Random ore spawns above ground, still a non destrucbile world, simply a thing the player can collect, uses same minigame mechanic as fishing for simplicity

---

### **Additional Info**

* **Gear:** Need to be implemented as items and need their slots in inventory  
  * **Armor (Helmet, Chestpiece, Shoes, 1 slot each)**  
  * **Rings (2 Slots for equipping)**  
  * **Tome (passives, 1 slot)**  
  * **Mount (movement speed buff, 1 slot)**  
  * **Fishing pole & Pickaxe (no function yet)**  
* **Crystal mechanic:** Each Armor item has one crystal slot (similar to path of exiles)  
  * Socketed crystals give a stats boost to the armor piece  
  * If player wants to socket another crystal in an already occupied slot the old one gets destroyed and the new one takes it place

---

### **Technical and Programming**

* **main loop & state manager**  
* **Input handling**  
* **Rendering** (with canvas, needs to handle sprites)  
* **Camera System** that smoothly follows the player  
* **Scene management system** (changing scene, hub/overworlds/dungeons)  
* **Parallax scrolling** for background  
* **physics** (movement, collision with ground and walls)  
* **Tile sheet system** for the world  
* **Sprite sheet system** for the characters, animations and items  
* **Enemy System**  
* **Inventory System**  
* **UI System** (menus, HUD)  
* **Save system**  
* **Polish** (shaders, particles, effects)