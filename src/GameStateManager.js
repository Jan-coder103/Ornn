import { ctx, INTERNAL_W, INTERNAL_H } from './RenderConfig.js';

const STATES = {
    BOOT: 'BOOT',
    MAIN_MENU: 'MAIN_MENU',
    HUB: 'HUB',
    OVERWORLD: 'OVERWORLD',
    DUNGEON: 'DUNGEON',
    PAUSE: 'PAUSE',
    INVENTORY: 'INVENTORY',
    DEATH: 'DEATH',
};

let current = null;
let currentStateName = null;
const registry = {};

export { STATES };

export function registerState(name, state) {
    registry[name] = state;
}

export function getStateName() {
    return currentStateName;
}

export function changeState(name) {
    if (current && current.exit) current.exit();
    currentStateName = name;
    current = registry[name];
    if (current && current.enter) current.enter();
}

export function updateState(dt) {
    if (current && current.update) current.update(dt);
}

export function renderState(alpha) {
    if (current && current.render) current.render(ctx, alpha);
}

export function getCurrentState() {
    return current;
}

export function getDebugInfo() {
    if (current && current.getDebugInfo) return current.getDebugInfo();
    return { playerX: null, playerY: null, entityCount: 0 };
}
