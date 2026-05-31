import { ctx, INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { AssetLoader, drawProgressBar } from './AssetLoader.js';
import { start, setCallbacks } from './GameLoop.js';
import { STATES, registerState, updateState, renderState, changeState, getStateName, getDebugInfo } from './GameStateManager.js';
import { updateTransition, renderTransition } from './Transition.js';
import { updateDebug, renderDebug } from './Debug.js';
import { clearFrame } from './Input.js';

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

setCallbacks(
    function update(dt) {
        updateState(dt);
        updateTransition(dt);
        updateDebug();
        clearFrame();
    },
    function render(alpha) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
        renderState(alpha);
        renderTransition();
        renderDebug({ state: getStateName(), ...getDebugInfo() });
    }
);

loader.loadManifest('manifest.json').then(() => {
    changeState(STATES.BOOT);
    start();
}).catch(err => {
    console.error('Failed to load assets:', err);
});
