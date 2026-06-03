import { TILE, INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { drawImage } from './Draw.js';

export class TilemapRenderer {
    constructor() {
        this.layers = {};
        this.tileset = null;
        this.tileW = TILE;
        this.tileH = TILE;
        this.spacing = 1;
        this.mapW = 0;
        this.mapH = 0;
        this.colsInSheet = 0;
    }

    load(mapData, tilesetImage) {
        this.tileset = tilesetImage;
        this.mapW = mapData.width;
        this.mapH = mapData.height;
        this.layers = {};

        for (const layer of mapData.layers) {
            this.layers[layer.name] = layer.data;
        }

        if (tilesetImage) {
            this.colsInSheet = Math.floor((tilesetImage.width + this.spacing) / (this.tileW + this.spacing));
        }
    }

    getCollisionLayer() {
        return this.layers['collision'] || null;
    }

    isSolid(col, row) {
        const collision = this.layers['collision'];
        if (!collision) return false;
        if (col < 0 || col >= this.mapW || row < 0 || row >= this.mapH) return false;
        return collision[row * this.mapW + col] === 1;
    }

    isPlatform(col, row) {
        const collision = this.layers['collision'];
        if (!collision) return false;
        if (col < 0 || col >= this.mapW || row < 0 || row >= this.mapH) return false;
        return collision[row * this.mapW + col] === 2;
    }

    render(renderLayers, cameraX, cameraY) {
        if (!this.tileset) return;

        const startCol = Math.floor(cameraX / this.tileW);
        const startRow = Math.floor(cameraY / this.tileH);
        const endCol = Math.min(startCol + Math.ceil(INTERNAL_W / this.tileW) + 1, this.mapW);
        const endRow = Math.min(startRow + Math.ceil(INTERNAL_H / this.tileH) + 1, this.mapH);

        for (const layerName of renderLayers) {
            const data = this.layers[layerName];
            if (!data) continue;

            for (let row = startRow; row < endRow; row++) {
                for (let col = startCol; col < endCol; col++) {
                    const tileIndex = data[row * this.mapW + col];
                    if (tileIndex === 0) continue;

                    const srcCol = (tileIndex - 1) % this.colsInSheet;
                    const srcRow = Math.floor((tileIndex - 1) / this.colsInSheet);
                    const sx = srcCol * (this.tileW + this.spacing);
                    const sy = srcRow * (this.tileH + this.spacing);

                    const dx = col * this.tileW - cameraX;
                    const dy = row * this.tileH - cameraY;

                    drawImage(
                        this.tileset,
                        sx, sy, this.tileW, this.tileH,
                        dx, dy, this.tileW, this.tileH,
                        false
                    );
                }
            }
        }
    }
}
