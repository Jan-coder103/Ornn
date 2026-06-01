import { TILE } from './CONFIG.js';

const NPC_COLORS = {
    shop: { body: '#2e7d32', accent: '#1b5e20', label: 'SHOP' },
    forge: { body: '#e65100', accent: '#bf360c', label: 'FORGE' },
    mount_shop: { body: '#5d4037', accent: '#3e2723', label: 'MOUNTS' },
    teleport: { body: '#7b1fa2', accent: '#4a148c', label: 'TELEPORT' },
};

export class NPC {
    constructor(tileX, tileY, npcType) {
        this.x = tileX * TILE;
        this.y = tileY * TILE;
        this.npcType = npcType;
        this._animTime = 0;

        if (npcType === 'teleport') {
            this.w = TILE * 2;
            this.h = 6;
        } else {
            this.w = 10;
            this.h = 14;
        }
    }

    update(dt) {
        this._animTime += dt;
    }

    isPlayerNear(playerBody) {
        const pad = 10;
        const nearX = playerBody.pos.x < this.x + this.w + pad &&
                      playerBody.pos.x + playerBody.w > this.x - pad;
        if (this.npcType === 'teleport') {
            return nearX &&
                   playerBody.pos.y < this.y + this.h + pad &&
                   playerBody.pos.y + playerBody.h > this.y - this.h - pad;
        }
        return nearX &&
               playerBody.pos.y < this.y + this.h + pad &&
               playerBody.pos.y + playerBody.h > this.y - pad;
    }

    render(ctx, cameraX, cameraY) {
        const x = Math.floor(this.x - cameraX);
        const y = Math.floor(this.y - cameraY);
        const colors = NPC_COLORS[this.npcType] || NPC_COLORS.shop;

        if (this.npcType === 'teleport') {
            this._renderTeleportPad(ctx, x, y, colors);
            return;
        }

        ctx.fillStyle = colors.accent;
        ctx.fillRect(x - 1, y + 10, this.w + 2, 4);

        ctx.fillStyle = colors.body;
        ctx.fillRect(x, y + 4, this.w, 10);

        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x + 2, y, 6, 6);

        ctx.fillStyle = '#333';
        const eyeX = 4;
        ctx.fillRect(x + eyeX, y + 2, 2, 2);
    }

    _renderTeleportPad(ctx, x, y, colors) {
        const pulse = 0.4 + 0.3 * Math.sin(this._animTime * 3);

        ctx.fillStyle = `rgba(123, 31, 162, ${pulse * 0.3})`;
        ctx.fillRect(x - 4, y - 4, this.w + 8, this.h + 8);

        ctx.fillStyle = colors.body;
        ctx.fillRect(x, y, this.w, this.h);

        ctx.fillStyle = `rgba(225, 190, 231, ${pulse})`;
        ctx.fillRect(x + 2, y + 1, this.w - 4, this.h - 2);

        ctx.fillStyle = '#fff';
        const cx = x + this.w / 2;
        ctx.fillRect(cx - 2, y + 1, 1, 1);
        ctx.fillRect(cx + 2, y + 2, 1, 1);
        ctx.fillRect(cx, y + 3, 1, 1);
    }

    renderPrompt(ctx, cameraX, cameraY) {
        const colors = NPC_COLORS[this.npcType] || NPC_COLORS.shop;
        const cx = Math.floor(this.x + this.w / 2 - cameraX);
        const py = Math.floor(this.y - 10 - cameraY);

        ctx.save();
        ctx.font = '5px monospace';
        ctx.textAlign = 'center';

        ctx.fillStyle = colors.body;
        ctx.fillText(colors.label, cx, py - 6);

        ctx.fillStyle = '#fff';
        ctx.fillText('[E]', cx, py);
        ctx.restore();
    }
}
