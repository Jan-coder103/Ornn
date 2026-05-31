import { INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { CAMERA_LERP } from './CONFIG.js';

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.deadzoneX = 4;
        this.deadzoneY = 2;
    }

    follow(targetX, targetY) {
        const focusX = this.x + INTERNAL_W / 2;
        const focusY = this.y + INTERNAL_H / 2;

        const dx = targetX - focusX;
        const dy = targetY - focusY;

        if (Math.abs(dx) > this.deadzoneX) {
            this.x += (targetX - INTERNAL_W / 2 - this.x) * CAMERA_LERP;
        }
        if (Math.abs(dy) > this.deadzoneY) {
            this.y += (targetY - INTERNAL_H / 2 - this.y) * CAMERA_LERP;
        }
    }

    clamp(mapW, mapH) {
        const maxX = Math.max(0, mapW - INTERNAL_W);
        const maxY = Math.max(0, mapH - INTERNAL_H);
        this.x = Math.max(0, Math.min(this.x, maxX));
        this.y = Math.max(0, Math.min(this.y, maxY));
    }

    snapTo(targetX, targetY, mapW, mapH) {
        this.x = targetX - INTERNAL_W / 2;
        this.y = targetY - INTERNAL_H / 2;
        this.clamp(mapW, mapH);
    }
}
