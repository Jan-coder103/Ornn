import { Scene } from '../Scene.js';
import { INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { transitionTo, isInputBlocked } from '../Transition.js';
import { STATES } from '../GameStateManager.js';
import { wasKeyPressed } from '../Input.js';

const ROOMS = [
    { mapPath: 'data/maps/dungeon_room1.json', type: 'combat' },
    { mapPath: 'data/maps/dungeon_room2.json', type: 'combat' },
    { mapPath: 'data/maps/dungeon_boss.json', type: 'boss' },
];

let currentRoom = 0;
let scene = null;

function advanceRoom() {
    currentRoom++;
    if (currentRoom >= ROOMS.length) {
        transitionTo(STATES.HUB);
        return;
    }
    transitionTo(() => loadCurrentRoom());
}

function loadCurrentRoom() {
    if (scene) scene.destroy();
    const room = ROOMS[currentRoom];
    scene = new Scene({
        mapPath: room.mapPath,
        type: 'dungeon',
        roomType: room.type,
        onRoomCleared: advanceRoom,
    });
    scene.load();
}

export default {
    enter() {
        currentRoom = 0;
        loadCurrentRoom();
    },
    exit() {
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
        info.totalRooms = ROOMS.length;
        return info;
    },
};
