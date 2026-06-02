import { TILE } from './CONFIG.js';
import { INTERNAL_W, INTERNAL_H } from './RenderConfig.js';

export class Portal {
    constructor(tileX, tileY, target) {
        this.x = tileX * TILE;
        this.y = tileY * TILE;
        this.w = TILE;
        this.h = TILE;
        this.target = target;
        this._animTime = 0;
    }

    update(dt) {
        this._animTime += dt;
    }

    isPlayerNear(playerBody) {
        const pad = 6;
        return playerBody.pos.x < this.x + this.w + pad &&
               playerBody.pos.x + playerBody.w > this.x - pad &&
               playerBody.pos.y < this.y + this.h + pad &&
               playerBody.pos.y + playerBody.h > this.y - pad;
    }

    render(ctx, cameraX, cameraY) {
        const x = Math.floor(this.x - cameraX);
        const y = Math.floor(this.y - cameraY);

        const pulse = 0.5 + 0.3 * Math.sin(this._animTime * 4);

        ctx.fillStyle = `rgba(156, 39, 176, ${pulse})`;
        ctx.fillRect(x, y, this.w, this.h);

        ctx.fillStyle = `rgba(225, 190, 231, ${pulse * 0.8})`;
        ctx.fillRect(x + 4, y + 2, this.w - 8, this.h - 4);

        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 6, y + 5, 2, 2);
        ctx.fillRect(x + 10, y + 8, 2, 2);
        ctx.fillRect(x + 5, y + 11, 2, 2);
    }

    renderPrompt(ctx, cameraX, cameraY) {
        const x = Math.floor(this.x + this.w / 2 - cameraX);
        const y = Math.floor(this.y - 8 - cameraY);
        ctx.save();
        ctx.font = '5px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('[E] Enter', x, y);
        ctx.restore();
    }
}
