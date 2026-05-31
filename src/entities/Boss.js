import { Body } from '../Physics.js';
import { TILE, ENEMY_HIT_STUN_FRAMES } from '../CONFIG.js';

const BS = { IDLE: 0, TELEGRAPH: 1, EXECUTE: 2, RECOVERY: 3, DEAD: 4 };
const ATK = { NONE: 0, CHARGE: 1, JUMP_SLAM: 2, SPREAD: 3 };

const TELEGRAPH_P1 = 36;
const TELEGRAPH_P2 = 24;
const CHARGE_SPEED = 4;
const CHARGE_DURATION = 25;
const JUMP_VEL = -6;
const JUMP_HVEL = 1.5;
const PROJ_SPEED = 1.5;
const PROJ_LIFE = 90;
const IMPACT_RADIUS = 28;
const RECOVERY_FRAMES = 30;
const IDLE_WAIT = 60;

let nextId = 1;

export class Boss {
    constructor(x, y) {
        this.id = nextId++;
        this.body = new Body(x, y, 16, 16);
        this.hp = 20;
        this.maxHp = 20;
        this.damage = 2;
        this.facing = -1;
        this.phase = 1;

        this.state = BS.IDLE;
        this.attack = ATK.NONE;
        this.timer = IDLE_WAIT;
        this.prevAttack = ATK.NONE;

        this._flashTimer = 0;
        this._deathTimer = 0;
        this._deathDone = false;
        this._wasAirborne = false;
        this._projectiles = [];
        this.slamImpact = null;
    }

    get isDead() { return this.state === BS.DEAD; }
    get isDeathDone() { return this._deathDone; }
    get projectiles() { return this._projectiles; }

    takeDamage(amount) {
        if (this.state === BS.DEAD) return false;
        this.hp -= amount;
        this._flashTimer = ENEMY_HIT_STUN_FRAMES;

        if (this.hp <= Math.floor(this.maxHp / 2) && this.phase === 1) {
            this.phase = 2;
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.state = BS.DEAD;
            this._deathTimer = 90;
            this.body.vel.x = 0;
            this.body.vel.y = 0;
            return true;
        }
        return false;
    }

    update(playerBody) {
        if (this.state === BS.DEAD) {
            this._deathTimer--;
            if (this._deathTimer <= 0) this._deathDone = true;
            return;
        }

        if (this._flashTimer > 0) this._flashTimer--;

        this.slamImpact = null;

        const dx = playerBody.centerX - this.body.centerX;
        this.facing = dx > 0 ? 1 : -1;

        switch (this.state) {
            case BS.IDLE:
                this.body.vel.x = this.facing * 0.3;
                this.timer--;
                if (this.timer <= 0) this._chooseAttack();
                break;

            case BS.TELEGRAPH:
                this.body.vel.x = 0;
                this.timer--;
                if (this.timer <= 0) {
                    this.state = BS.EXECUTE;
                    this._startAttack(playerBody);
                }
                break;

            case BS.EXECUTE:
                this._executeAttack(playerBody);
                break;

            case BS.RECOVERY:
                this.body.vel.x = 0;
                this.timer--;
                if (this.timer <= 0) {
                    this.state = BS.IDLE;
                    this.timer = this.phase === 2 ? 40 : IDLE_WAIT;
                }
                break;
        }

        for (let i = this._projectiles.length - 1; i >= 0; i--) {
            const p = this._projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this._projectiles.splice(i, 1);
        }
    }

    _chooseAttack() {
        let opts = [ATK.CHARGE, ATK.JUMP_SLAM, ATK.SPREAD].filter(a => a !== this.prevAttack);
        this.attack = opts[Math.floor(Math.random() * opts.length)];
        this.prevAttack = this.attack;
        this.state = BS.TELEGRAPH;
        this.timer = this.phase === 2 ? TELEGRAPH_P2 : TELEGRAPH_P1;
    }

    _startAttack(playerBody) {
        switch (this.attack) {
            case ATK.CHARGE:
                this._chargeDir = this.facing;
                this._chargeTimer = CHARGE_DURATION;
                break;
            case ATK.JUMP_SLAM:
                this.body.vel.y = JUMP_VEL;
                this.body.vel.x = Math.sign(playerBody.centerX - this.body.centerX) * JUMP_HVEL;
                this._wasAirborne = true;
                break;
            case ATK.SPREAD:
                this._fireProjectiles(playerBody);
                this.state = BS.RECOVERY;
                this.timer = RECOVERY_FRAMES;
                break;
        }
    }

    _executeAttack() {
        switch (this.attack) {
            case ATK.CHARGE:
                this.body.vel.x = this._chargeDir * CHARGE_SPEED;
                this._chargeTimer--;
                if (this._chargeTimer <= 0) {
                    this.body.vel.x = 0;
                    this.state = BS.RECOVERY;
                    this.timer = RECOVERY_FRAMES;
                }
                break;
            case ATK.JUMP_SLAM:
                if (this._wasAirborne && this.body.grounded) {
                    this._wasAirborne = false;
                    this.body.vel.x = 0;
                    this.slamImpact = {
                        x: this.body.centerX,
                        y: this.body.bottom,
                        radius: IMPACT_RADIUS,
                        damage: this.damage,
                    };
                    this.state = BS.RECOVERY;
                    this.timer = RECOVERY_FRAMES;
                }
                break;
        }
    }

    _fireProjectiles(playerBody) {
        const dx = playerBody.centerX - this.body.centerX;
        const dy = playerBody.centerY - this.body.centerY;
        const baseAngle = Math.atan2(dy, dx);
        const count = this.phase === 2 ? 5 : 3;
        const arc = Math.PI / 4;

        for (let i = 0; i < count; i++) {
            const t = count === 1 ? 0 : (i / (count - 1) - 0.5) * arc;
            const angle = baseAngle + t;
            this._projectiles.push({
                x: this.body.centerX,
                y: this.body.centerY,
                vx: Math.cos(angle) * PROJ_SPEED,
                vy: Math.sin(angle) * PROJ_SPEED,
                life: PROJ_LIFE,
                damage: 1,
            });
        }
    }

    render(ctx, cameraX, cameraY) {
        const x = Math.floor(this.body.pos.x - cameraX);
        const y = Math.floor(this.body.pos.y - cameraY);
        const w = this.body.w;
        const h = this.body.h;

        if (this.state === BS.DEAD) {
            if (this._deathTimer % 8 < 4) {
                ctx.fillStyle = '#fff';
            } else {
                ctx.fillStyle = '#7b1fa2';
            }
            const shake = this._deathTimer > 30 ? Math.floor(Math.random() * 3 - 1) : 0;
            ctx.fillRect(x + shake, y, w, h);
            this._renderHP(ctx, x, y, w);
            return;
        }

        if (this.state === BS.TELEGRAPH && this.timer % 6 < 3) {
            ctx.fillStyle = '#f44336';
            ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
        }

        let drawY = y;
        let drawH = h;
        if (this.state === BS.TELEGRAPH && this.attack === ATK.JUMP_SLAM) {
            drawH = h - 4;
            drawY = y + 4;
        }

        if (this._flashTimer > 0 && this._flashTimer % 2 === 0) {
            ctx.fillStyle = '#fff';
        } else {
            ctx.fillStyle = this.phase === 2 ? '#4a148c' : '#7b1fa2';
        }
        ctx.fillRect(x, drawY, w, drawH);

        ctx.fillStyle = this.phase === 2 ? '#f44336' : '#ffeb3b';
        ctx.fillRect(x + 3, y - 3, 2, 3);
        ctx.fillRect(x + w - 5, y - 3, 2, 3);

        ctx.fillStyle = '#fff';
        const eyeX = this.facing === 1 ? x + w - 6 : x + 3;
        ctx.fillRect(eyeX, y + 5, 3, 2);

        this._renderHP(ctx, x, y, w);

        for (const p of this._projectiles) {
            const px = Math.floor(p.x - cameraX);
            const py = Math.floor(p.y - cameraY);
            ctx.fillStyle = '#f44336';
            ctx.fillRect(px - 2, py - 2, 4, 4);
            ctx.fillStyle = '#ffeb3b';
            ctx.fillRect(px - 1, py - 1, 2, 2);
        }
    }

    _renderHP(ctx, x, y, w) {
        const barW = 30;
        const barH = 3;
        const barX = x + w / 2 - barW / 2;
        const barY = y - 8;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = this.phase === 2 ? '#f44336' : '#4caf50';
        ctx.fillRect(barX, barY, Math.floor(barW * (this.hp / this.maxHp)), barH);
    }
}
