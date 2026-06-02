import { TILE } from '../CONFIG.js';
import { getItemDef, getRarityColor } from '../Inventory.js';

export class LootDrop {
    constructor(x, y, itemId) {
        this.x = x;
        this.y = y;
        this.itemId = itemId;
        this.w = 8;
        this.h = 8;
        this.active = true;
        this._animTime = 0;
        this._bounceVy = -3;
        this._bounceY = 0;
        this._bouncing = true;
        this._collected = false;
        this._nameShowTimer = 0;
    }

    update(dt) {
        this._animTime += dt;

        if (this._bouncing) {
            this._bounceY += this._bounceVy;
            this._bounceVy += 0.15;
            if (this._bounceY >= 0) {
                this._bounceY = 0;
                this._bouncing = false;
            }
        }
    }

    isPlayerNear(playerBody) {
        const pad = 10;
        return playerBody.pos.x < this.x + this.w + pad &&
               playerBody.pos.x + playerBody.w > this.x - pad &&
               playerBody.pos.y < this.y + this.h + pad &&
               playerBody.pos.y + playerBody.h > this.y - pad;
    }

    render(ctx, cameraX, cameraY) {
        if (!this.active) return;

        const def = getItemDef(this.itemId);
        const x = Math.floor(this.x - cameraX);
        const y = Math.floor(this.y + this._bounceY - cameraY);

        const glow = 0.3 + 0.2 * Math.sin(this._animTime * 4);
        const rarity = def ? getRarityColor(def.rarity) : '#bdbdbd';

        ctx.fillStyle = rarity;
        ctx.globalAlpha = glow * 0.5;
        ctx.fillRect(x - 1, y - 1, this.w + 2, this.h + 2);
        ctx.globalAlpha = 1;

        ctx.fillStyle = def ? def.color : '#fff';
        ctx.fillRect(x + 1, y + 1, this.w - 2, this.h - 2);

        if (def) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 2, y + 2, 2, 2);
        }

        ctx.fillStyle = rarity;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x, y + this.h, this.w, 1);
        ctx.globalAlpha = 1;
    }

    renderPrompt(ctx, cameraX, cameraY) {
        if (!this.active) return;

        const def = getItemDef(this.itemId);
        const x = Math.floor(this.x + this.w / 2 - cameraX);
        const y = Math.floor(this.y - 10 - cameraY);

        ctx.save();
        ctx.font = '5px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('[E] Pick Up', x, y);

        if (def) {
            ctx.font = '4px monospace';
            ctx.fillStyle = getRarityColor(def.rarity);
            ctx.fillText(def.name, x, y - 6);
        }
        ctx.restore();
    }
}
