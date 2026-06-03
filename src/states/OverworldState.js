import { Scene } from '../Scene.js';
import { INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { transitionTo, isInputBlocked } from '../Transition.js';
import { STATES } from '../GameStateManager.js';
import { playerData } from '../GameData.js';
import { calculateStats } from '../Inventory.js';
import { REALM_MULT } from '../CONFIG.js';
import { PauseUI } from '../PauseUI.js';
import { InventoryUI } from '../InventoryUI.js';
import { save } from '../SaveManager.js';
import { fillTextCenter } from '../Draw.js';
import * as Input from '../Input.js';

let scene = null;
let dungeonEntrances = [];
let overlay = null;

function createPauseActions() {
    return {
        inventory: () => {
            overlay = new InventoryUI(() => {
                overlay = new PauseUI(createPauseActions());
            });
        },
        save: save,
        quit: () => {
            overlay = null;
            transitionTo(STATES.HUB);
        },
    };
}

function generateEntrances(mapWidth) {
    const realm = playerData.currentRealm || 1;
    const count = 5 + Math.floor(Math.random() * 4);
    const minSpacing = 7;
    const validStart = 5;
    const validEnd = mapWidth - 3;
    const positions = [];

    for (let i = 0; i < count; i++) {
        let placed = false;
        for (let attempt = 0; attempt < 100; attempt++) {
            const x = validStart + Math.floor(Math.random() * (validEnd - validStart));
            let tooClose = false;
            for (const p of positions) {
                if (Math.abs(x - p.x) < minSpacing) {
                    tooClose = true;
                    break;
                }
            }
            if (Math.abs(x - 2) < 4) tooClose = true;
            if (!tooClose) {
                positions.push({ x, y: 5, dungeonID: realm, cleared: false });
                placed = true;
                break;
            }
        }
    }

    return positions.sort((a, b) => a.x - b.x);
}

export default {
    enter() {
        calculateStats();
        overlay = null;

        if (playerData.fromDungeon) {
            playerData.fromDungeon = false;
            if (playerData.justClearedDungeon && playerData.pendingDungeonEntranceIndex >= 0) {
                playerData.justClearedDungeon = false;
                const idx = playerData.pendingDungeonEntranceIndex;
                if (idx < dungeonEntrances.length) {
                    dungeonEntrances[idx].cleared = true;
                }
            }
        } else {
            dungeonEntrances = generateEntrances(50);
        }

        const realm = playerData.currentRealm || 1;
        const realmMult = REALM_MULT[realm] || 1.0;

        scene = new Scene({
            mapPath: 'data/maps/overworld.json',
            type: 'overworld',
            realmMult,
            dungeonEntrances: dungeonEntrances,
            onDungeonEnter: (entrance) => {
                if (scene && scene.player) {
                    playerData.health = scene.player.health;
                }
                playerData.pendingDungeonID = entrance.dungeonID;
                playerData.pendingDungeonEntranceIndex = entrance.index;
                playerData.fromDungeon = false;
                transitionTo(STATES.DUNGEON);
            },
            onPlayerDeath: () => {
                playerData.coinsBank = Math.floor(playerData.coinsBank * 0.95);
                playerData.deathMessage = 'You lost 5% coins';
                playerData.deathMessageTimer = 2;
                transitionTo(STATES.HUB);
            },
        });
        scene.load();
    },
    exit() {
        if (scene) scene.destroy();
        scene = null;
        overlay = null;
    },
    update(dt) {
        if (playerData.inventoryMessageTimer > 0) {
            playerData.inventoryMessageTimer -= dt;
        }

        if (overlay) {
            overlay.update(dt);
            if (!overlay || overlay.isClosed()) overlay = null;
            return;
        }

        if (scene) scene.update(dt);

        if (!isInputBlocked()) {
            if (Input.pausePressed()) {
                overlay = new PauseUI(createPauseActions());
                return;
            }
            if (Input.wasKeyPressed('i') || Input.wasKeyPressed('I')) {
                overlay = new InventoryUI(() => { overlay = null; });
                return;
            }
        }
    },
    render(c) {
        if (scene) scene.render(c);

        if (overlay) overlay.render(c);

        if (playerData.inventoryMessageTimer > 0 && playerData.inventoryMessage) {
            fillTextCenter(playerData.inventoryMessage, 24, '#4caf50');
        }
    },
    getDebugInfo() {
        const info = scene ? scene.getDebugInfo() : {};
        info.dungeonCount = dungeonEntrances.length;
        info.clearedCount = dungeonEntrances.filter(d => d.cleared).length;
        info.overlay = overlay ? overlay.constructor.name : 'none';
        return info;
    },
};
