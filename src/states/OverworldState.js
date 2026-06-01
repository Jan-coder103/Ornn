import { Scene } from '../Scene.js';
import { INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { transitionTo } from '../Transition.js';
import { STATES } from '../GameStateManager.js';
import { playerData } from '../GameData.js';

let scene = null;
let dungeonEntrances = [];

function generateEntrances(mapWidth) {
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
                const dungeonID = 1 + Math.floor(Math.random() * 3);
                positions.push({ x, y: 5, dungeonID, cleared: false });
                placed = true;
                break;
            }
        }
    }

    return positions.sort((a, b) => a.x - b.x);
}

export default {
    enter() {
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

        scene = new Scene({
            mapPath: 'data/maps/overworld.json',
            type: 'overworld',
            dungeonEntrances: dungeonEntrances,
            onDungeonEnter: (entrance) => {
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
    },
    update(dt) {
        if (scene) scene.update(dt);
    },
    render(c) {
        if (scene) scene.render(c);
    },
    getDebugInfo() {
        const info = scene ? scene.getDebugInfo() : {};
        info.dungeonCount = dungeonEntrances.length;
        info.clearedCount = dungeonEntrances.filter(d => d.cleared).length;
        return info;
    },
};
