import { Body } from '../Physics.js';
import { TILE, ENEMY_HIT_STUN_FRAMES, ENEMY_KNOCKBACK_FORCE, ENEMY_MAX_KNOCKBACK } from '../CONFIG.js';

const AI = { IDLE: 0, PATROL: 1, CHASE: 2, ATTACK: 3, HIT_STUN: 4, DEAD: 5 };

let nextId = 0;

export class Enemy {
    constructor(x, y, template) {
        this.id = ++nextId;
        this.body = new Body(x, y, template.w, template.h);
        this.hp = template.hp;
        this.maxHp = template.hp;
        this.damage = template.damage;
        this.speed = template.speed;
        this.chaseSpeed = template.chaseSpeed;
        this.aggroRange = template.aggroRange;
        this.attackRange = template.attackRange;
        this.attackCooldown = template.attackCooldown;
        this.knockbackResistance = template.knockbackResistance;
        this.color = template.color || '#f44336';

        this.facing = Math.random() < 0.5 ? -1 : 1;
        this.state = AI.PATROL;

        this._patrolTimer = this._randomPatrolDuration();
        this._attackTimer = 0;
        this._hitStunTimer = 0;
        this._dealtDamageThisAttack = false;
    }

    _randomPatrolDuration() {
        return 180 + Math.floor(Math.random() * 120);
    }

    get isDead() { return this.state === AI.DEAD; }

    update(playerBody, tilemap) {
        if (this.state === AI.DEAD) return;

        if (this.state === AI.HIT_STUN) {
            this._hitStunTimer--;
            if (this._hitStunTimer <= 0) {
                this.state = AI.CHASE;
            }
            return;
        }

        const dx = playerBody.centerX - this.body.centerX;
        const dy = playerBody.centerY - this.body.centerY;
        const distX = Math.abs(dx);
        const distY = Math.abs(dy);
        const dist = Math.sqrt(dx * dx + dy * dy);

        switch (this.state) {
            case AI.IDLE:
                this.body.vel.x = 0;
                this._idleTimer--;
                if (this._idleTimer <= 0) {
                    this.state = AI.PATROL;
                    this._patrolTimer = this._randomPatrolDuration();
                }
                if (distX < this.aggroRange && distY < TILE * 2) {
                    this.state = AI.CHASE;
                    this.facing = dx > 0 ? 1 : -1;
                }
                break;

            case AI.PATROL:
                this.body.vel.x = this.facing * this.speed;
                this._patrolTimer--;

                if (this.body.grounded && this._checkEdge(tilemap)) {
                    this.facing *= -1;
                    this.body.vel.x = this.facing * this.speed;
                }
                if (this._checkWall(tilemap)) {
                    this.facing *= -1;
                    this.body.vel.x = this.facing * this.speed;
                }

                if (this._patrolTimer <= 0) {
                    this.state = AI.IDLE;
                    this._idleTimer = 60 + Math.floor(Math.random() * 60);
                    this.body.vel.x = 0;
                }
                if (distX < this.aggroRange && distY < TILE * 2) {
                    this.state = AI.CHASE;
                    this.facing = dx > 0 ? 1 : -1;
                }
                break;

            case AI.CHASE:
                this.facing = dx > 0 ? 1 : -1;
                this.body.vel.x = this.facing * this.chaseSpeed;

                if (dist < this.attackRange) {
                    this.state = AI.ATTACK;
                    this._attackTimer = this.attackCooldown;
                    this._dealtDamageThisAttack = false;
                    this.body.vel.x = 0;
                }
                if (distX > this.aggroRange * 2) {
                    this.state = AI.PATROL;
                    this._patrolTimer = this._randomPatrolDuration();
                }
                break;

            case AI.ATTACK:
                this.body.vel.x = 0;
                this._attackTimer--;
                if (this._attackTimer <= 0) {
                    this.state = AI.CHASE;
                }
                break;
        }
    }

    _checkEdge(tilemap) {
        if (!tilemap) return false;
        const checkX = this.facing === 1
            ? this.body.pos.x + this.body.w + 1
            : this.body.pos.x - 1;
        const col = Math.floor(checkX / TILE);
        const row = Math.floor((this.body.pos.y + this.body.h + 1) / TILE);
        if (col < 0 || col >= tilemap.mapW || row < 0 || row >= tilemap.mapH) return true;
        return !tilemap.isSolid(col, row) && !tilemap.isPlatform(col, row);
    }

    _checkWall(tilemap) {
        if (!tilemap) return false;
        const checkX = this.facing === 1
            ? this.body.pos.x + this.body.w + 1
            : this.body.pos.x - 1;
        const col = Math.floor(checkX / TILE);
        const row = Math.floor(this.body.centerY / TILE);
        return tilemap.isSolid(col, row);
    }

    takeDamage(amount, knockbackDir) {
        if (this.state === AI.HIT_STUN || this.state === AI.DEAD) return false;

        this.hp -= amount;
        this.state = AI.HIT_STUN;
        this._hitStunTimer = ENEMY_HIT_STUN_FRAMES;

        const force = ENEMY_KNOCKBACK_FORCE * (1 - this.knockbackResistance);
        this.body.vel.x = knockbackDir * Math.min(Math.abs(force), ENEMY_MAX_KNOCKBACK);
        this.body.vel.y = -2;

        if (this.hp <= 0) {
            this.state = AI.DEAD;
            return true;
        }
        return false;
    }

    render(ctx, cameraX, cameraY) {
        if (this.state === AI.DEAD) return;

        const x = Math.floor(this.body.pos.x - cameraX);
        const y = Math.floor(this.body.pos.y - cameraY);
        const w = this.body.w;
        const h = this.body.h;

        if (this.state === AI.HIT_STUN && this._hitStunTimer % 2 === 0) {
            ctx.fillStyle = '#fff';
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(x, y, w, h);

        if (this.state !== AI.HIT_STUN || this._hitStunTimer % 2 !== 0) {
            ctx.fillStyle = '#fff';
            const eyeX = this.facing === 1 ? x + w - 4 : x + 2;
            ctx.fillRect(eyeX, y + Math.floor(h * 0.3), 2, 2);
        }

        if (this.state === AI.ATTACK) {
            ctx.fillStyle = '#f44336';
            const ex = this.facing === 1 ? x + w + 1 : x - 3;
            ctx.fillRect(ex, y + Math.floor(h * 0.3), 2, 2);
        }
    }
}
