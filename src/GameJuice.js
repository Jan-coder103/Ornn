const SHAKE_FRAMES = 3;
const HITSTOP_FRAMES = 4;

let shakeTimer = 0;
let shakeIntensity = 0;
let hitstopTimer = 0;

export function triggerShake(intensity) {
    shakeTimer = SHAKE_FRAMES;
    shakeIntensity = intensity || 2;
}

export function triggerHitstop(frames) {
    hitstopTimer = frames || HITSTOP_FRAMES;
}

export function update() {
    if (shakeTimer > 0) shakeTimer--;
    if (hitstopTimer > 0) hitstopTimer--;
}

export function isFrozen() {
    return hitstopTimer > 0;
}

export function getShakeOffset() {
    if (shakeTimer <= 0) return { x: 0, y: 0 };
    const ox = Math.floor((Math.random() * 2 - 1) * shakeIntensity);
    const oy = Math.floor((Math.random() * 2 - 1) * shakeIntensity);
    return { x: ox, y: oy };
}

export function reset() {
    shakeTimer = 0;
    hitstopTimer = 0;
    shakeIntensity = 0;
}
