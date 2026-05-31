import { BOOMERANG_SPEED, BOOMERANG_RANGE, BOOMERANG_RETURN_MULT, BOOMERANG_CATCH_DIST } from '../CONFIG.js';

const STATE = { OUTBOUND: 0, RETURNING: 1 };

export class Boomerang {
    constructor(x, y, facing) {
        this.x = x;
        this.y = y;
        this.vx = facing * BOOMERANG_SPEED;
        this.vy = 0;
        this.facing = facing;
        this.state = STATE.OUTBOUND;
        this.travelDistance = 0;
        this.rotation = 0;
        this.active = true;
        this.hitList = new Set();
        this.size = 5;
    }

    update(playerX, playerY) {
        this.rotation += 0.15;

        if (this.state === STATE.OUTBOUND) {
            this.x += this.vx;
            this.y += this.vy;
            this.travelDistance += Math.abs(this.vx);

            if (this.travelDistance >= BOOMERANG_RANGE) {
                this.state = STATE.RETURNING;
            }
        } else {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < BOOMERANG_CATCH_DIST) {
                this.active = false;
                return;
            }

            const speed = BOOMERANG_SPEED * BOOMERANG_RETURN_MULT;
            this.vx = (dx / dist) * speed;
            this.vy = (dy / dist) * speed;
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    canHit(entityId) {
        return !this.hitList.has(entityId);
    }

    registerHit(entityId) {
        this.hitList.add(entityId);
    }

    render(ctx, cameraX, cameraY) {
        const sx = Math.floor(this.x - cameraX);
        const sy = Math.floor(this.y - cameraY);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.fillStyle = '#ff9800';
        ctx.fillRect(-this.size / 2 + 1, -this.size / 2 + 1, 2, 2);
        ctx.restore();
    }
}
