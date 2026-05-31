import { ctx, INTERNAL_W, INTERNAL_H } from './RenderConfig.js';

export class ParallaxLayer {
    constructor(image, speed) {
        this.image = image;
        this.speed = speed;
        this.offsetX = 0;
    }

    update(cameraX, dt) {
        this.offsetX = cameraX * this.speed;
    }

    render() {
        if (!this.image) return;

        const imgW = this.image.width;
        const imgH = this.image.height;

        const startX = -((this.offsetX % imgW) + imgW) % imgW;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        let x = startX;
        while (x < INTERNAL_W) {
            ctx.drawImage(this.image, Math.floor(x), Math.floor(INTERNAL_H - imgH));
            x += imgW;
        }

        ctx.restore();
    }
}

export class ParallaxBackground {
    constructor() {
        this.layers = [];
    }

    addLayer(image, speed) {
        this.layers.push(new ParallaxLayer(image, speed));
        this.layers.sort((a, b) => a.speed - b.speed);
    }

    update(cameraX, dt) {
        for (const layer of this.layers) {
            layer.update(cameraX, dt);
        }
    }

    render() {
        for (const layer of this.layers) {
            layer.render();
        }
    }
}
