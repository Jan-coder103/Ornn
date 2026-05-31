import { ctx, INTERNAL_W, INTERNAL_H } from './RenderConfig.js';

const FIXED_DT = 1 / 60;
const MAX_DT = 0.05;

let accumulator = 0;
let lastTime = 0;
let alpha = 0;
let running = false;

let updateFn = null;
let renderFn = null;

export function setCallbacks(update, render) {
    updateFn = update;
    renderFn = render;
}

function loop(timestamp) {
    if (!running) return;

    const dt = Math.min((timestamp - lastTime) / 1000, MAX_DT);
    lastTime = timestamp;
    accumulator += dt;

    while (accumulator >= FIXED_DT) {
        if (updateFn) updateFn(FIXED_DT);
        accumulator -= FIXED_DT;
    }

    alpha = accumulator / FIXED_DT;

    if (renderFn) renderFn(alpha);

    requestAnimationFrame(loop);
}

export function start() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    accumulator = 0;
    requestAnimationFrame(loop);
}

export function stop() {
    running = false;
}

export function getAlpha() {
    return alpha;
}
