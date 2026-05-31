const keys = {};
const justPressed = {};
const justReleased = {};

let attackJustPressed = false;
let mobileAxisX = 0;
let mobileJump = false;
let mobileAttack = false;
let mobileInteract = false;

window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
    }
    if (!keys[e.key]) {
        justPressed[e.key] = true;
    }
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    justReleased[e.key] = true;
});

window.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        attackJustPressed = true;
    }
});

export function getAxisX() {
    let axis = 0;
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) axis -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) axis += 1;
    if (mobileAxisX !== 0) axis = mobileAxisX;
    return Math.sign(axis);
}

export function jumpPressed() {
    return !!justPressed[' '] || !!justPressed['ArrowUp'] || mobileJump;
}

export function attackPressed() {
    return attackJustPressed || mobileAttack;
}

export function interactPressed() {
    return !!justPressed['e'] || !!justPressed['E'] || mobileInteract;
}

export function pausePressed() {
    return !!justPressed['Escape'];
}

export function isKeyDown(key) {
    return !!keys[key];
}

export function wasKeyPressed(key) {
    return !!justPressed[key];
}

export function wasKeyReleased(key) {
    return !!justReleased[key];
}

export function clearFrame() {
    for (const k in justPressed) delete justPressed[k];
    for (const k in justReleased) delete justReleased[k];
    attackJustPressed = false;
    mobileJump = false;
    mobileAttack = false;
    mobileInteract = false;
}

export function setMobileAxisX(v) { mobileAxisX = v; }
export function setMobileJump() { mobileJump = true; }
export function setMobileAttack() { mobileAttack = true; }
export function setMobileInteract() { mobileInteract = true; }
