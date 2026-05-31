export const INTERNAL_W = 360;
export const INTERNAL_H = 180;
export const TILE = 18;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = INTERNAL_W;
canvas.height = INTERNAL_H;
ctx.imageSmoothingEnabled = false;

export function resize() {
    const scale = Math.max(2, Math.min(4,
        Math.floor(Math.min(window.innerWidth / INTERNAL_W, window.innerHeight / INTERNAL_H))
    ));
    canvas.style.width = INTERNAL_W * scale + 'px';
    canvas.style.height = INTERNAL_H * scale + 'px';
    ctx.imageSmoothingEnabled = false;
}

window.addEventListener('resize', resize);
resize();

export { canvas, ctx };
