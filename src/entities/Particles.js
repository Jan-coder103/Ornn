export class Particle {
    constructor(x, y, vx, vy, life, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
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

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, opts) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (opts.speedMin || 0.2) + Math.random() * ((opts.speedMax || 0.8) - (opts.speedMin || 0.2));
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = (opts.lifeMin || 8) + Math.floor(Math.random() * ((opts.lifeMax || 16) - (opts.lifeMin || 8)));
            const size = opts.size || 2;
            const color = opts.colors ? opts.colors[Math.floor(Math.random() * opts.colors.length)] : '#fff';
            this.particles.push(new Particle(x, y, vx, vy, life, size, color));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (!this.particles[i].active) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx, cameraX, cameraY) {
        for (const p of this.particles) {
            p.render(ctx, cameraX, cameraY);
        }
    }

    get count() {
        return this.particles.length;
    }
}
