import { Scene } from '../Scene.js';
import { INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { playerData } from '../GameData.js';
import { calculateStats } from '../Inventory.js';
import { transitionTo, isInputBlocked } from '../Transition.js';
import { STATES } from '../GameStateManager.js';
import { ShopUI } from '../ShopUI.js';
import { CrystalForgeUI } from '../CrystalForgeUI.js';
import { MountShopUI } from '../MountShopUI.js';
import { TeleportUI } from '../TeleportUI.js';
import { PauseUI } from '../PauseUI.js';
import { InventoryUI } from '../InventoryUI.js';
import { save } from '../SaveManager.js';
import { fillTextCenter } from '../Draw.js';
import * as Input from '../Input.js';

let scene = null;
let activeUI = null;
let overlay = null;
let pendingInteraction = null;

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

function openPause() {
    overlay = new PauseUI(createPauseActions());
}

function openInventoryDirect() {
    overlay = new InventoryUI(() => { overlay = null; });
}

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
        overlay = null;
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
        save();
    },
    exit() {
        if (scene) scene.destroy();
        scene = null;
        activeUI = null;
        overlay = null;
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

        if (overlay) {
            overlay.update(dt);
            if (!overlay || overlay.isClosed()) overlay = null;
            return;
        }

        if (activeUI) {
            activeUI.update(dt);
            if (!activeUI || activeUI.isClosed()) {
                activeUI = null;
            }
            return;
        }

        if (scene) scene.update(dt);

        if (pendingInteraction) {
            activeUI = createUI(pendingInteraction);
            pendingInteraction = null;
            return;
        }

        if (!isInputBlocked()) {
            if (Input.pausePressed()) {
                openPause();
                return;
            }
            if (Input.wasKeyPressed('i') || Input.wasKeyPressed('I')) {
                openInventoryDirect();
                return;
            }
        }
    },
    render(c) {
        if (scene) scene.render(c);

        if (activeUI) {
            activeUI.render(c);
        }

        if (overlay) {
            overlay.render(c);
        }

        if (playerData.deathMessageTimer > 0 && playerData.deathMessage) {
            fillTextCenter(playerData.deathMessage, 14, '#f44336');
        }
        if (playerData.inventoryMessageTimer > 0 && playerData.inventoryMessage) {
            fillTextCenter(playerData.inventoryMessage, 24, '#4caf50');
        }
        if (playerData.hubMessageTimer > 0 && playerData.hubMessage) {
            fillTextCenter(playerData.hubMessage, 34, '#ffc107');
        }
    },
    getDebugInfo() {
        const info = scene ? scene.getDebugInfo() : {};
        info.activeUI = activeUI ? activeUI.constructor.name : 'none';
        info.overlay = overlay ? overlay.constructor.name : 'none';
        return info;
    },
};
