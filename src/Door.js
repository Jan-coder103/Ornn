import { TILE } from './CONFIG.js';

export class Door {
    constructor(tileX, tileY) {
        this.x = tileX * TILE;
        this.y = tileY * TILE;
        this.w = TILE;
        this.h = TILE * 2;
        this.active = false;
        this._animTime = 0;
    }

    update(dt) {
        if (this.active) this._animTime += dt;
    }

    isPlayerNear(playerBody) {
        const pad = 8;
        return playerBody.pos.x < this.x + this.w + pad &&
               playerBody.pos.x + playerBody.w > this.x - pad &&
               playerBody.pos.y < this.y + this.h + pad &&
               playerBody.pos.y + playerBody.h > this.y - pad;
    }

    render(ctx, cameraX, cameraY) {
        if (!this.active) return;
        const x = Math.floor(this.x - cameraX);
        const y = Math.floor(this.y - cameraY);

        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x, y, this.w, this.h);

        ctx.fillStyle = '#1a0a2e';
        ctx.fillRect(x + 3, y + 2, this.w - 6, this.h - 2);

        const pulse = 0.4 + 0.3 * Math.sin(this._animTime * 3);
        ctx.fillStyle = `rgba(255, 235, 59, ${pulse * 0.4})`;
        ctx.fillRect(x + 3, y + 2, this.w - 6, this.h - 2);

        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(x, y, 3, this.h);
        ctx.fillRect(x + this.w - 3, y, 3, this.h);
    }

    renderPrompt(ctx, cameraX, cameraY) {
        const x = Math.floor(this.x + this.w / 2 - cameraX);
        const y = Math.floor(this.y - 8 - cameraY);
        ctx.save();
        ctx.font = '5px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('E', x, y);
        ctx.restore();
    }
}
