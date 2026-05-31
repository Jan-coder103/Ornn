import { ctx, INTERNAL_W, INTERNAL_H } from './RenderConfig.js';

export class AssetLoader {
    constructor() {
        this.assets = new Map();
        this.total = 0;
        this.loaded = 0;
        this.failed = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    async loadManifest(manifestPath) {
        const response = await fetch(manifestPath);
        if (!response.ok) throw new Error(`Failed to load manifest: ${response.status}`);
        const manifest = await response.json();

        const entries = Object.entries(manifest);
        this.total = entries.length;
        this.loaded = 0;
        this.failed = 0;

        const promises = entries.map(([key, path]) => this._loadAsset(key, path));
        await Promise.allSettled(promises);

        if (this.onComplete) this.onComplete(this.loaded, this.failed);
        return this.assets;
    }

    async _loadAsset(key, path) {
        try {
            if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
                const asset = await this._loadImage(path);
                this.assets.set(key, asset);
            } else {
                const response = await fetch(path);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                this.assets.set(key, data);
            }
            this.loaded++;
        } catch (err) {
            console.warn(`AssetLoader: failed to load "${key}" from "${path}"`, err);
            this.failed++;
        }

        if (this.onProgress) this.onProgress(this.loaded, this.total);
    }

    _loadImage(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
            img.src = path;
        });
    }

    get(key) {
        return this.assets.get(key);
    }

    has(key) {
        return this.assets.has(key);
    }
}

export function drawProgressBar(loaded, total) {
    const barW = INTERNAL_W * 0.6;
    const barH = 8;
    const x = (INTERNAL_W - barW) / 2;
    const y = (INTERNAL_H - barH) / 2;
    const progress = total > 0 ? loaded / total : 0;

    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, barW, barH);

    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, Math.floor(barW * progress), barH);

    ctx.fillStyle = '#fff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Loading... ${loaded}/${total}`, INTERNAL_W / 2, y - 6);
}
