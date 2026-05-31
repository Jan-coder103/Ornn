import { TILE, GRAVITY } from './CONFIG.js';

const MAX_FALL_SPEED = TILE - 1;

export class Body {
    constructor(x, y, w, h) {
        this.pos = { x, y };
        this.vel = { x: 0, y: 0 };
        this.w = w;
        this.h = h;
        this.grounded = false;
        this.dead = false;
    }

    get left() { return this.pos.x; }
    get right() { return this.pos.x + this.w; }
    get top() { return this.pos.y; }
    get bottom() { return this.pos.y + this.h; }
    get centerX() { return this.pos.x + this.w * 0.5; }
    get centerY() { return this.pos.y + this.h * 0.5; }
}

export class Physics {
    constructor() {
        this.tilemap = null;
        this.mapPixelW = 0;
        this.mapPixelH = 0;
        this.gravity = GRAVITY;
        this.onDeath = null;
    }

    setMap(tilemap) {
        this.tilemap = tilemap;
        if (tilemap) {
            this.mapPixelW = tilemap.mapW * TILE;
            this.mapPixelH = tilemap.mapH * TILE;
        }
    }

    update(body) {
        body.dead = false;
        body.grounded = false;

        body.vel.y += this.gravity;
        if (body.vel.y > MAX_FALL_SPEED) {
            body.vel.y = MAX_FALL_SPEED;
        }

        body.pos.x += body.vel.x;
        this._resolveX(body);

        const prevBottom = body.pos.y + body.h;
        body.pos.y += body.vel.y;
        this._resolveY(body, prevBottom);

        this._checkBounds(body);
    }

    _getOverlappingTiles(body) {
        const tiles = [];
        const startCol = Math.floor(body.pos.x / TILE);
        const endCol = Math.floor((body.pos.x + body.w - 0.001) / TILE);
        const startRow = Math.floor(body.pos.y / TILE);
        const endRow = Math.floor((body.pos.y + body.h - 0.001) / TILE);

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                tiles.push({ col, row });
            }
        }
        return tiles;
    }

    _resolveX(body) {
        if (!this.tilemap) return;

        const tiles = this._getOverlappingTiles(body);
        for (const { col, row } of tiles) {
            if (!this.tilemap.isSolid(col, row)) continue;

            if (body.vel.x > 0) {
                body.pos.x = col * TILE - body.w;
            } else if (body.vel.x < 0) {
                body.pos.x = (col + 1) * TILE;
            }
            body.vel.x = 0;
            return;
        }
    }

    _resolveY(body, prevBottom) {
        if (!this.tilemap) return;

        const tiles = this._getOverlappingTiles(body);
        for (const { col, row } of tiles) {
            const solid = this.tilemap.isSolid(col, row);
            const platform = this.tilemap.isPlatform(col, row);

            if (!solid && !platform) continue;

            if (platform) {
                if (body.vel.y <= 0) continue;
                if (prevBottom > row * TILE + 1) continue;
            }

            if (body.vel.y > 0) {
                body.pos.y = row * TILE - body.h;
                body.vel.y = 0;
                body.grounded = true;
            } else if (body.vel.y < 0) {
                body.pos.y = (row + 1) * TILE;
                body.vel.y = 0;
            }
            return;
        }
    }

    _checkBounds(body) {
        if (this.mapPixelH > 0 && body.pos.y > this.mapPixelH + TILE) {
            body.dead = true;
            if (this.onDeath) this.onDeath(body);
        }
    }
}
