import { Scene } from '../Scene.js';
import { INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { transitionTo, isInputBlocked } from '../Transition.js';
import { STATES } from '../GameStateManager.js';
import { playerData } from '../GameData.js';
import { wasKeyPressed } from '../Input.js';
import { calculateStats } from '../Inventory.js';

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
    const rooms = getRooms();
    const room = rooms[currentRoom];
    scene = new Scene({
        mapPath: room.mapPath,
        type: 'dungeon',
        roomType: room.type,
        onRoomCleared: advanceRoom,
        bossPortalTarget: 'OVERWORLD',
        onBossDefeated: () => {
            playerData.justClearedDungeon = true;
            playerData.fromDungeon = true;
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
        loadCurrentRoom();
    },
    exit() {
        if (scene && scene.player) {
            playerData.health = scene.player.health;
        }
        if (scene) scene.destroy();
        scene = null;
    },
    update(dt) {
        if (!isInputBlocked() && wasKeyPressed('Escape')) {
            transitionTo(STATES.HUB);
            return;
        }
        if (scene) scene.update(dt);
    },
    render(c) {
        if (scene) scene.render(c);
    },
    getDebugInfo() {
        if (!scene) return { playerX: null, playerY: null, entityCount: 0 };
        const info = scene.getDebugInfo();
        info.room = currentRoom + 1;
        info.totalRooms = getRooms().length;
        info.dungeonID = dungeonID;
        return info;
    },
};
