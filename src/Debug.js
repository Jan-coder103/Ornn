import { ctx, INTERNAL_W } from './RenderConfig.js';

let visible = false;
let fps = 0;
let frameCount = 0;
let lastFpsTime = performance.now();

export function toggleDebug() {
    visible = !visible;
}

export function updateDebug() {
    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFpsTime = now;
    }
}

export function renderDebug(data) {
    if (!visible) return;

    const lines = [
        `FPS: ${fps}`,
        `State: ${data.state ?? '-'}`,
        `Player: ${data.playerX != null ? `${data.playerX.toFixed(1)}, ${data.playerY.toFixed(1)}` : '-'}`,
        `Entities: ${data.entityCount ?? 0}`,
    ];

    ctx.save();
    ctx.font = '8px "Kenney Mini"';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const lineH = 8;
    const pad = 4;
    const boxH = lines.length * lineH + pad * 2;
    let maxW = 0;
    for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > maxW) maxW = w;
    }
    const boxW = maxW + pad * 2;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(INTERNAL_W - boxW - 2, 2, boxW, boxH);

    ctx.fillStyle = '#0f0';
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], INTERNAL_W - boxW, pad + 2 + i * lineH);
    }

    ctx.restore();
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        toggleDebug();
    }
});
