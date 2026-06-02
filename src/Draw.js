import { ctx, INTERNAL_W } from './RenderConfig.js';

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
    ctx.font = font || '8px "Kenney Mini"';
    ctx.textBaseline = 'top';
    ctx.fillText(text, Math.floor(x), Math.floor(y));
}

export function fillTextCenter(text, y, color, font) {
    ctx.fillStyle = color;
    ctx.font = font || '8px "Kenney Mini"';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const w = ctx.measureText(text).width;
    ctx.fillText(text, Math.floor((INTERNAL_W - w) / 2), Math.floor(y));
}

export function fillTextCenteredAt(text, anchorX, y, color, font) {
    ctx.fillStyle = color;
    ctx.font = font || '8px "Kenney Mini"';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const w = ctx.measureText(text).width;
    ctx.fillText(text, Math.floor(anchorX - w / 2), Math.floor(y));
}
