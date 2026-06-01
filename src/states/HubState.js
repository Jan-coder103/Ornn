import { Scene } from '../Scene.js';
import { INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { playerData } from '../GameData.js';
import { calculateStats } from '../Inventory.js';

let scene = null;

export default {
    enter() {
        playerData.fromDungeon = false;
        calculateStats();
        playerData.health = -1;
        scene = new Scene({ mapPath: 'data/maps/hub.json', type: 'hub' });
        scene.load();
    },
    exit() {
        if (scene) scene.destroy();
        scene = null;
    },
    update(dt) {
        if (playerData.deathMessageTimer > 0) {
            playerData.deathMessageTimer -= dt;
        }
        if (playerData.inventoryMessageTimer > 0) {
            playerData.inventoryMessageTimer -= dt;
        }
        if (scene) scene.update(dt);
    },
    render(c) {
        if (scene) scene.render(c);
        if (playerData.deathMessageTimer > 0 && playerData.deathMessage) {
            c.save();
            c.font = '6px monospace';
            c.textAlign = 'center';
            c.fillStyle = '#f44336';
            c.fillText(playerData.deathMessage, INTERNAL_W / 2, 20);
            c.restore();
        }
        if (playerData.inventoryMessageTimer > 0 && playerData.inventoryMessage) {
            c.save();
            c.font = '5px monospace';
            c.textAlign = 'center';
            c.fillStyle = '#4caf50';
            c.fillText(playerData.inventoryMessage, INTERNAL_W / 2, 30);
            c.restore();
        }
    },
    getDebugInfo() {
        return scene ? scene.getDebugInfo() : {};
    },
};
