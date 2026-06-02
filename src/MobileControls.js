import { INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { setMobileAxisX, setMobileJump, setMobileAttack, setMobileInteract } from './Input.js';
import * as AudioManager from './AudioManager.js';

let container = null;
let isMobile = false;
let visible = false;

function detectMobile() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function createButton(id, label, x, y, w, h, handlers) {
    const btn = document.createElement('div');
    btn.id = id;
    btn.textContent = label;
    btn.style.cssText = `
        position: fixed;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        font-family: "Kenney Mini", monospace;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
        z-index: 100;
        left: ${x};
        bottom: ${y};
        width: ${w}px;
        height: ${h}px;
    `;

    if (handlers.onDown) {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handlers.onDown();
        }, { passive: false });
    }
    if (handlers.onUp) {
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handlers.onUp();
        }, { passive: false });
    }
    if (handlers.onPress) {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handlers.onPress();
        }, { passive: false });
    }

    return btn;
}

function createDpad() {
    const dpad = document.createElement('div');
    dpad.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 120px;
        height: 80px;
        z-index: 100;
    `;

    const leftArea = document.createElement('div');
    leftArea.style.cssText = `
        position: absolute;
        left: 0;
        top: 10px;
        width: 50px;
        height: 60px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.5);
        font-size: 18px;
        font-family: "Kenney Mini", monospace;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
    `;
    leftArea.textContent = '\u25C0';

    leftArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        setMobileAxisX(-1);
    }, { passive: false });
    leftArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        setMobileAxisX(0);
    }, { passive: false });
    leftArea.addEventListener('touchcancel', (e) => {
        setMobileAxisX(0);
    });

    const rightArea = document.createElement('div');
    rightArea.style.cssText = `
        position: absolute;
        right: 0;
        top: 10px;
        width: 50px;
        height: 60px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.5);
        font-size: 18px;
        font-family: "Kenney Mini", monospace;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
    `;
    rightArea.textContent = '\u25B6';

    rightArea.addEventListener('touchstart', (e) => {
        e.preventDefault();
        setMobileAxisX(1);
    }, { passive: false });
    rightArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        setMobileAxisX(0);
    }, { passive: false });
    rightArea.addEventListener('touchcancel', (e) => {
        setMobileAxisX(0);
    });

    dpad.appendChild(leftArea);
    dpad.appendChild(rightArea);
    return dpad;
}

function buildControls() {
    container = document.createElement('div');
    container.id = 'mobile-controls';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 99;
    `;

    const dpad = createDpad();
    dpad.style.pointerEvents = 'auto';
    container.appendChild(dpad);

    const jumpBtn = createButton('mobile-jump', 'J', 'auto', '80px', 56, 56, {
        onPress: () => setMobileJump(),
    });
    jumpBtn.style.right = '90px';
    jumpBtn.style.pointerEvents = 'auto';
    container.appendChild(jumpBtn);

    const attackBtn = createButton('mobile-attack', 'A', 'auto', '80px', 56, 56, {
        onPress: () => setMobileAttack(),
    });
    attackBtn.style.right = '20px';
    attackBtn.style.bottom = '140px';
    attackBtn.style.pointerEvents = 'auto';
    container.appendChild(attackBtn);

    const interactBtn = createButton('mobile-interact', 'E', 'auto', '80px', 48, 48, {
        onPress: () => setMobileInteract(),
    });
    interactBtn.style.right = '20px';
    interactBtn.style.bottom = '210px';
    interactBtn.style.fontSize = '12px';
    interactBtn.style.pointerEvents = 'auto';
    container.appendChild(interactBtn);

    document.body.appendChild(container);
}

export function init() {
    isMobile = detectMobile();
    if (isMobile) {
        buildControls();
        visible = true;
    }
}

export function show() {
    if (container) container.style.display = 'block';
    visible = true;
}

export function hide() {
    if (container) container.style.display = 'none';
    visible = false;
}

export function isVisible() {
    return visible;
}

export function isMobileDevice() {
    return isMobile;
}
