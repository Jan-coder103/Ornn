import { ctx } from './RenderConfig.js';

export function drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh, flipX) {
    dx = Math.floor(dx);
    dy = Math.floor(dy);
    dw = Math.floor(dw);
    dh = Math.floor(dh);

    if (flipX) {
        ctx.save();
        ctx.translate(dx + dw, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(image, Math.floor(sx), Math.floor(sy), Math.floor(sw), Math.floor(sh), 0, 0, dw, dh);
        ctx.restore();
    } else {
        ctx.drawImage(image, Math.floor(sx), Math.floor(sy), Math.floor(sw), Math.floor(sh), dx, dy, dw, dh);
    }
}

export function clear(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function fillRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

export function fillText(text, x, y, color, font) {
    ctx.fillStyle = color;
    ctx.font = font || '6px monospace';
    ctx.fillText(text, Math.floor(x), Math.floor(y));
}
