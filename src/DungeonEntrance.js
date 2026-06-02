import { TILE } from './CONFIG.js';
import { fillTextCenteredAt } from './Draw.js';

export class DungeonEntrance {
    constructor(tileX, tileY, dungeonID, index) {
        this.x = tileX * TILE;
        this.y = tileY * TILE;
        this.w = TILE * 2;
        this.h = TILE * 2;
        this.dungeonID = dungeonID;
        this.index = index;
        this.cleared = false;
        this._animTime = 0;
    }

    update(dt) {
        this._animTime += dt;
    }

    isPlayerNear(playerBody) {
        const pad = 8;
        return playerBody.pos.x < this.x + this.w + pad &&
               playerBody.pos.x + playerBody.w > this.x - pad &&
               playerBody.pos.y < this.y + this.h + pad &&
               playerBody.pos.y + playerBody.h > this.y - pad;
    }

    render(ctx, cameraX, cameraY) {
        const x = Math.floor(this.x - cameraX);
        const y = Math.floor(this.y - cameraY);

        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x, y, this.w, this.h);

        ctx.fillStyle = '#1a0a2e';
        ctx.fillRect(x + 3, y + 2, this.w - 6, this.h - 2);

        const glow = 0.3 + 0.2 * Math.sin(this._animTime * 3);
        ctx.fillStyle = `rgba(156, 39, 176, ${glow})`;
        ctx.fillRect(x + 3, y + 2, this.w - 6, this.h - 2);

        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(x, y, 3, this.h);
        ctx.fillRect(x + this.w - 3, y, 3, this.h);
        ctx.fillRect(x, y, this.w, 3);

        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(x + this.w / 2 - 1, y + this.h - 6, 2, 6);

        if (this.cleared) {
            ctx.fillStyle = '#f44336';
            ctx.fillRect(x + 4, y + 4, 4, 4);
            ctx.fillRect(x + this.w - 8, y + 4, 4, 4);
            ctx.fillRect(x + 8, y + 10, this.w - 16, 3);

            ctx.fillStyle = 'rgba(244, 67, 54, 0.5)';
            ctx.fillRect(x, y, this.w, this.h);
        }
    }

    renderPrompt(ctx, cameraX, cameraY) {
        if (this.cleared) return;
        const x = Math.floor(this.x + this.w / 2 - cameraX);
        const y = Math.floor(this.y - 8 - cameraY);
        fillTextCenteredAt('[E] Enter', x, y, '#fff');
    }
}
