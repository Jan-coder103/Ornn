import { Body } from '../Physics.js';
import {
    PLAYER_SPEED, JUMP_VEL, START_HEALTH,
    ACCEL, DECEL, COYOTE_FRAMES, JUMP_BUFFER_FRAMES,
    PLAYER_W, PLAYER_H, TILE,
    PLAYER_INVINCIBLE_FRAMES, PLAYER_KNOCKBACK_X, PLAYER_KNOCKBACK_Y
} from '../CONFIG.js';
import * as Input from '../Input.js';

export class Player {
    constructor(x, y) {
        this.body = new Body(x, y, PLAYER_W, PLAYER_H);
        this.facing = 1;
        this.health = START_HEALTH;
        this.maxHealth = START_HEALTH;
        this.canAttack = true;
        this._invincibleTimer = 0;

        this._coyoteTimer = 0;
        this._jumpBufferTimer = 0;
        this._jumpHeld = false;
        this._spawnX = x;
        this._spawnY = y;
    }

    tick() {
        if (this._invincibleTimer > 0) this._invincibleTimer--;
    }

    handleInput() {
        const axisX = Input.getAxisX();

        if (axisX !== 0) {
            this.body.vel.x += axisX * ACCEL;
            if (Math.abs(this.body.vel.x) > PLAYER_SPEED) {
                this.body.vel.x = Math.sign(this.body.vel.x) * PLAYER_SPEED;
            }
            this.facing = axisX;
        } else {
            if (this.body.vel.x > 0) {
                this.body.vel.x = Math.max(0, this.body.vel.x - DECEL);
            } else if (this.body.vel.x < 0) {
                this.body.vel.x = Math.min(0, this.body.vel.x + DECEL);
            }
        }

        if (this.body.grounded) {
            this._coyoteTimer = COYOTE_FRAMES;
        } else if (this._coyoteTimer > 0) {
            this._coyoteTimer--;
        }

        if (Input.jumpPressed()) {
            this._jumpBufferTimer = JUMP_BUFFER_FRAMES;
        } else if (this._jumpBufferTimer > 0) {
            this._jumpBufferTimer--;
        }

        if (this._jumpBufferTimer > 0 && this._coyoteTimer > 0) {
            this.body.vel.y = JUMP_VEL;
            this._coyoteTimer = 0;
            this._jumpBufferTimer = 0;
            this._jumpHeld = true;
        }

        if (this._jumpHeld && Input.wasKeyReleased(' ')) {
            if (this.body.vel.y < 0) {
                this.body.vel.y = 0;
            }
            this._jumpHeld = false;
        }

        if (!Input.isKeyDown(' ')) {
            this._jumpHeld = false;
        }
    }

    takeDamage(amount, fromX) {
        if (this._invincibleTimer > 0) return false;
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this._invincibleTimer = PLAYER_INVINCIBLE_FRAMES;
        const dir = this.body.centerX < fromX ? -1 : 1;
        this.body.vel.x = dir * PLAYER_KNOCKBACK_X;
        this.body.vel.y = PLAYER_KNOCKBACK_Y;
        return true;
    }

    respawn() {
        this.body.pos.x = this._spawnX;
        this.body.pos.y = this._spawnY;
        this.body.vel.x = 0;
        this.body.vel.y = 0;
        this.health = this.maxHealth;
        this._invincibleTimer = 0;
    }

    render(ctx, cameraX, cameraY) {
        if (this._invincibleTimer > 0 && Math.floor(this._invincibleTimer / 3) % 2 === 0) return;

        const x = Math.floor(this.body.pos.x - cameraX);
        const y = Math.floor(this.body.pos.y - cameraY);
        const w = this.body.w;
        const h = this.body.h;

        ctx.fillStyle = '#4fc3f7';
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = '#fff';
        const eyeX = this.facing === 1 ? x + 6 : x + 2;
        ctx.fillRect(eyeX, y + 3, 2, 2);
        ctx.fillRect(eyeX, y + 6, 1, 1);
    }
}
