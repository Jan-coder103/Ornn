const MAX_PARTICLES = 50;

class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 1;
        this.size = 2;
        this.color = '#fff';
        this.glow = false;
        this.active = false;
    }

    init(x, y, vx, vy, life, size, color, glow) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.glow = glow || false;
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx, cameraX, cameraY) {
        const alpha = this.life / this.maxLife;
        const sx = Math.floor(this.x - cameraX);
        const sy = Math.floor(this.y - cameraY);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(sx - this.size / 2, sy - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

const pool = [];
for (let i = 0; i < MAX_PARTICLES; i++) {
    pool.push(new Particle());
}

function acquire() {
    for (const p of pool) {
        if (!p.active) return p;
    }
    return null;
}

export class ParticleSystem {
    emit(x, y, count, opts) {
        const glow = opts.glow || false;
        for (let i = 0; i < count; i++) {
            const p = acquire();
            if (!p) return;

            const angle = Math.random() * Math.PI * 2;
            const speed = (opts.speedMin || 0.2) + Math.random() * ((opts.speedMax || 0.8) - (opts.speedMin || 0.2));
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = (opts.lifeMin || 8) + Math.floor(Math.random() * ((opts.lifeMax || 16) - (opts.lifeMin || 8)));
            const size = opts.size || 2;
            const color = opts.colors ? opts.colors[Math.floor(Math.random() * opts.colors.length)] : '#fff';
            p.init(x, y, vx, vy, life, size, color, glow);
        }
    }

    update() {
        for (const p of pool) {
            if (p.active) p.update();
        }
    }

    render(ctx, cameraX, cameraY) {
        let hasGlow = false;
        for (const p of pool) {
            if (p.active && p.glow) {
                hasGlow = true;
                break;
            }
        }

        if (hasGlow) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (const p of pool) {
                if (p.active && p.glow) {
                    p.render(ctx, cameraX, cameraY);
                }
            }
            ctx.restore();
        }

        for (const p of pool) {
            if (p.active && !p.glow) {
                p.render(ctx, cameraX, cameraY);
            }
        }
    }

    get count() {
        let c = 0;
        for (const p of pool) {
            if (p.active) c++;
        }
        return c;
    }
}
