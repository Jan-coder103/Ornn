import { TILE } from '../CONFIG.js';

export class CoinDrop {
    constructor(x, y, amount) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.w = 4;
        this.h = 4;
        this.active = true;
        this._animTime = 0;
        this._bounceVy = -2.5;
        this._bounceY = 0;
        this._bouncing = true;
    }

    update(dt) {
        this._animTime += dt;

        if (this._bouncing) {
            this._bounceY += this._bounceVy;
            this._bounceVy += 0.12;
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

        const x = Math.floor(this.x - cameraX);
        const y = Math.floor(this.y + this._bounceY - cameraY);

        const glow = 0.4 + 0.3 * Math.sin(this._animTime * 5);
        ctx.fillStyle = `rgba(255, 193, 7, ${glow * 0.4})`;
        ctx.fillRect(x - 1, y - 1, this.w + 2, this.h + 2);

        ctx.fillStyle = '#ffc107';
        ctx.fillRect(x, y, this.w, this.h);

        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 1, y + 1, 1, 1);
    }
}
