import { drawImage } from './Draw.js';

export class Sprite {
    constructor(image, frameW, frameH, animations) {
        this.image = image;
        this.frameW = frameW;
        this.frameH = frameH;
        this.animations = animations || {};
        this.spacing = 1;

        this.currentAnim = null;
        this.frameIndex = 0;
        this.time = 0;
        this.speed = 8;
    }

    play(name, speed) {
        if (this.currentAnim === name) return;
        this.currentAnim = name;
        this.frameIndex = 0;
        this.time = 0;
        if (speed !== undefined) this.speed = speed;
    }

    update(dt) {
        if (!this.currentAnim) return;
        const frames = this.animations[this.currentAnim];
        if (!frames || frames.length <= 1) return;

        this.time += dt * this.speed;
        this.frameIndex = Math.floor(this.time) % frames.length;
    }

    getFrame() {
        const frames = this.currentAnim ? this.animations[this.currentAnim] : null;
        const idx = frames ? frames[this.frameIndex] : 0;
        const cols = Math.floor(this.image.width / (this.frameW + this.spacing));
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        return { col, row };
    }

    render(x, y, flipX) {
        const { col, row } = this.getFrame();
        const sx = col * (this.frameW + this.spacing);
        const sy = row * (this.frameH + this.spacing);
        drawImage(this.image, sx, sy, this.frameW, this.frameH, x, y, this.frameW, this.frameH, flipX);
    }
}
