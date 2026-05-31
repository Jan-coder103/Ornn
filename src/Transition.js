import { ctx, INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { changeState, getStateName } from './GameStateManager.js';

const FADE_DURATION = 0.3;

let transitioning = false;
let fadeAlpha = 0;
let fadeTimer = 0;
let targetState = null;
let isCallback = false;
let phase = 'out';

let inputBlocked = false;

export function isInputBlocked() {
    return inputBlocked;
}

export function transitionTo(stateOrCallback) {
    if (transitioning) return;
    transitioning = true;
    targetState = stateOrCallback;
    isCallback = typeof stateOrCallback === 'function';
    phase = 'out';
    fadeTimer = 0;
    fadeAlpha = 0;
    inputBlocked = true;
}

export function updateTransition(dt) {
    if (!transitioning) return;

    fadeTimer += dt;
    const half = FADE_DURATION / 2;

    if (phase === 'out') {
        fadeAlpha = Math.min(fadeTimer / half, 1);
        if (fadeTimer >= half) {
            fadeAlpha = 1;
            phase = 'in';
            fadeTimer = 0;
            if (isCallback) {
                targetState();
            } else {
                changeState(targetState);
            }
            targetState = null;
            isCallback = false;
        }
    } else {
        fadeAlpha = 1 - Math.min(fadeTimer / half, 1);
        if (fadeTimer >= half) {
            fadeAlpha = 0;
            transitioning = false;
            inputBlocked = false;
        }
    }
}

export function renderTransition() {
    if (!transitioning) return;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
    ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
    ctx.restore();
}
