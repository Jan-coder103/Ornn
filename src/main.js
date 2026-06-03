import { ctx, INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { AssetLoader, drawProgressBar } from './AssetLoader.js';
import { start, setCallbacks } from './GameLoop.js';
import { STATES, registerState, updateState, renderState, changeState, getStateName, getDebugInfo } from './GameStateManager.js';
import { updateTransition, renderTransition } from './Transition.js';
import { updateDebug, renderDebug } from './Debug.js';
import { clearFrame } from './Input.js';
import * as AudioManager from './AudioManager.js';
import * as GameJuice from './GameJuice.js';
import { init as initMobileControls } from './MobileControls.js';
import * as AssetStore from './AssetStore.js';

import BootState from './states/BootState.js';
import MenuState from './states/MenuState.js';
import HubState from './states/HubState.js';
import OverworldState from './states/OverworldState.js';
import DungeonState from './states/DungeonState.js';

registerState(STATES.BOOT, BootState);
registerState(STATES.MAIN_MENU, MenuState);
registerState(STATES.HUB, HubState);
registerState(STATES.OVERWORLD, OverworldState);
registerState(STATES.DUNGEON, DungeonState);

const loader = new AssetLoader();

loader.onProgress = (loaded, total) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
    drawProgressBar(loaded, total);
};

loader.onComplete = (loaded, failed) => {
    console.log(`Assets loaded: ${loaded}, failed: ${failed}`);
};

function initOnGesture() {
    AudioManager.init();
    window.removeEventListener('keydown', initOnGesture);
    window.removeEventListener('mousedown', initOnGesture);
    window.removeEventListener('touchstart', initOnGesture);
}
window.addEventListener('keydown', initOnGesture);
window.addEventListener('mousedown', initOnGesture);
window.addEventListener('touchstart', initOnGesture);

setCallbacks(
    function update(dt) {
        if (!GameJuice.isFrozen()) {
            updateState(dt);
        }
        GameJuice.update();
        updateTransition(dt);
        updateDebug();
        clearFrame();
    },
    function render(alpha) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

        const shake = GameJuice.getShakeOffset();
        if (shake.x !== 0 || shake.y !== 0) {
            ctx.save();
            ctx.translate(Math.round(shake.x), Math.round(shake.y));
        }

        renderState(alpha);

        if (shake.x !== 0 || shake.y !== 0) {
            ctx.restore();
        }

        renderTransition();
        renderDebug({ state: getStateName(), ...getDebugInfo() });
    }
);

async function boot() {
    try {
        await loader.loadManifest('manifest.json');
    } catch (err) {
        console.error('Failed to load assets:', err);
    }

    await AssetStore.loadAll([
        ['tileset', 'assets/tiles/tilemap.png'],
        ['tileset_bg', 'assets/tiles/tilemap-backgrounds.png'],
        ['tileset_chars', 'assets/tiles/tilemap-characters.png'],
    ]);

    try {
        await document.fonts.load('8px "Kenney Mini"');
    } catch (err) {
        console.warn('Font preload failed, will use fallback:', err);
    }

    initMobileControls();
    changeState(STATES.BOOT);
    start();
}

boot();
