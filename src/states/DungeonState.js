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
import * as Input from '../Input.js';

const DUNGEON_MAPS = {
    1: [
        { mapPath: 'data/maps/dungeon_room1.json', type: 'combat' },
        { mapPath: 'data/maps/dungeon_room2.json', type: 'combat' },
        { mapPath: 'data/maps/dungeon_boss.json', type: 'boss' },
    ],
    2: [
        { mapPath: 'data/maps/dungeon_2_room1.json', type: 'combat' },
        { mapPath: 'data/maps/dungeon_2_room2.json', type: 'combat' },
        { mapPath: 'data/maps/dungeon_2_boss.json', type: 'boss' },
    ],
    3: [
        { mapPath: 'data/maps/dungeon_3_room1.json', type: 'combat' },
        { mapPath: 'data/maps/dungeon_3_room2.json', type: 'combat' },
        { mapPath: 'data/maps/dungeon_3_boss.json', type: 'boss' },
    ],
};

let currentRoom = 0;
let dungeonID = 1;
let scene = null;
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

function getRooms() {
    return DUNGEON_MAPS[dungeonID] || DUNGEON_MAPS[1];
}

function advanceRoom() {
    currentRoom++;
    if (currentRoom >= getRooms().length) {
        transitionTo(STATES.HUB);
        return;
    }
    transitionTo(() => loadCurrentRoom());
}

function loadCurrentRoom() {
    if (scene && scene.player) {
        playerData.health = scene.player.health;
    }
    if (scene) scene.destroy();
    calculateStats();

    const realm = playerData.currentRealm || 1;
    const realmMult = REALM_MULT[realm] || 1.0;

    const rooms = getRooms();
    const room = rooms[currentRoom];
    scene = new Scene({
        mapPath: room.mapPath,
        type: 'dungeon',
        roomType: room.type,
        realmMult,
        onRoomCleared: advanceRoom,
        bossPortalTarget: 'OVERWORLD',
        onBossDefeated: () => {
            playerData.justClearedDungeon = true;
            playerData.fromDungeon = true;
            save();
        },
        onPlayerDeath: () => {
            playerData.coinsBank = Math.floor(playerData.coinsBank * 0.95);
            playerData.deathMessage = 'You lost 5% coins';
            playerData.deathMessageTimer = 2;
            transitionTo(STATES.HUB);
        },
    });
    scene.load();
}

export default {
    enter() {
        dungeonID = playerData.pendingDungeonID || 1;
        currentRoom = 0;
        overlay = null;
        loadCurrentRoom();
    },
    exit() {
        if (scene && scene.player) {
            playerData.health = scene.player.health;
        }
        if (scene) scene.destroy();
        scene = null;
        overlay = null;
    },
    update(dt) {
        if (overlay) {
            overlay.update(dt);
            if (!overlay || overlay.isClosed()) overlay = null;
            return;
        }

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

        if (scene) scene.update(dt);
    },
    render(c) {
        if (scene) scene.render(c);
        if (overlay) overlay.render(c);
    },
    getDebugInfo() {
        if (!scene) return { playerX: null, playerY: null, entityCount: 0 };
        const info = scene.getDebugInfo();
        info.room = currentRoom + 1;
        info.totalRooms = getRooms().length;
        info.dungeonID = dungeonID;
        info.overlay = overlay ? overlay.constructor.name : 'none';
        return info;
    },
};
