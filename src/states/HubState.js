import { Scene } from '../Scene.js';
import { INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { playerData } from '../GameData.js';
import { calculateStats } from '../Inventory.js';
import { transitionTo } from '../Transition.js';
import { STATES } from '../GameStateManager.js';
import { ShopUI } from '../ShopUI.js';
import { CrystalForgeUI } from '../CrystalForgeUI.js';
import { MountShopUI } from '../MountShopUI.js';
import { TeleportUI } from '../TeleportUI.js';

let scene = null;
let activeUI = null;
let pendingInteraction = null;

function createUI(type) {
    switch (type) {
        case 'shop': return new ShopUI();
        case 'forge': return new CrystalForgeUI();
        case 'mount_shop': return new MountShopUI();
        case 'teleport': return new TeleportUI((realm) => {
            playerData.currentRealm = realm;
            activeUI = null;
            transitionTo(STATES.OVERWORLD);
        });
        default: return null;
    }
}

export default {
    enter() {
        playerData.fromDungeon = false;
        activeUI = null;
        pendingInteraction = null;
        calculateStats();
        playerData.health = -1;
        scene = new Scene({
            mapPath: 'data/maps/hub.json',
            type: 'hub',
            onNPCInteract: (npcType) => {
                pendingInteraction = npcType;
            },
        });
        scene.load();
    },
    exit() {
        if (scene) scene.destroy();
        scene = null;
        activeUI = null;
        pendingInteraction = null;
    },
    update(dt) {
        if (playerData.deathMessageTimer > 0) {
            playerData.deathMessageTimer -= dt;
        }
        if (playerData.inventoryMessageTimer > 0) {
            playerData.inventoryMessageTimer -= dt;
        }
        if (playerData.hubMessageTimer > 0) {
            playerData.hubMessageTimer -= dt;
        }

        if (activeUI) {
            activeUI.update(dt);
            if (activeUI.isClosed()) {
                activeUI = null;
            }
        } else {
            if (scene) scene.update(dt);

            if (pendingInteraction) {
                activeUI = createUI(pendingInteraction);
                pendingInteraction = null;
            }
        }
    },
    render(c) {
        if (scene) scene.render(c);

        if (activeUI) {
            activeUI.render(c);
        }

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
        if (playerData.hubMessageTimer > 0 && playerData.hubMessage) {
            c.save();
            c.font = '5px monospace';
            c.textAlign = 'center';
            c.fillStyle = '#ffc107';
            c.fillText(playerData.hubMessage, INTERNAL_W / 2, 40);
            c.restore();
        }
    },
    getDebugInfo() {
        const info = scene ? scene.getDebugInfo() : {};
        info.activeUI = activeUI ? activeUI.constructor.name : 'none';
        return info;
    },
};
