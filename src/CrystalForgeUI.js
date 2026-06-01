import { INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { playerData } from './GameData.js';
import {
    getCrystalsInInventory, upgradeCrystal, scrapCrystal,
    getItemDef, getRarityColor, removeItemByIndex
} from './Inventory.js';
import * as Input from './Input.js';

const VISIBLE_ITEMS = 8;
const ITEM_H = 12;
const LIST_Y = 30;
const LIST_X = 10;

export class CrystalForgeUI {
    constructor(onMessage) {
        this._closed = false;
        this._tab = 'scrap';
        this._selectedIndex = 0;
        this._scrollOffset = 0;
        this._message = '';
        this._messageTimer = 0;
        this._onMessage = onMessage;
    }

    update(dt) {
        if (this._messageTimer > 0) {
            this._messageTimer -= dt;
        }

        if (Input.wasKeyPressed('Escape')) {
            this._closed = true;
            return;
        }

        if (Input.wasKeyPressed('Tab') || Input.wasKeyPressed('q') || Input.wasKeyPressed('Q')) {
            this._tab = this._tab === 'scrap' ? 'upgrade' : 'scrap';
            this._selectedIndex = 0;
            this._scrollOffset = 0;
        }

        const items = this._getItems();
        const maxIdx = Math.max(0, items.length - 1);

        if (Input.wasKeyPressed('ArrowUp') || Input.wasKeyPressed('w') || Input.wasKeyPressed('W')) {
            this._selectedIndex = Math.max(0, this._selectedIndex - 1);
            this._adjustScroll();
        }
        if (Input.wasKeyPressed('ArrowDown') || Input.wasKeyPressed('s') || Input.wasKeyPressed('S')) {
            this._selectedIndex = Math.min(maxIdx, this._selectedIndex + 1);
            this._adjustScroll();
        }

        if (Input.wasKeyPressed('Enter') || Input.interactPressed()) {
            if (items.length > 0 && this._selectedIndex < items.length) {
                this._selectItem(items);
            }
        }
    }

    _getItems() {
        const crystals = getCrystalsInInventory();
        if (this._tab === 'upgrade') {
            return crystals.filter(c => c.totalQty >= 3);
        }
        return crystals;
    }

    _adjustScroll() {
        if (this._selectedIndex < this._scrollOffset) {
            this._scrollOffset = this._selectedIndex;
        } else if (this._selectedIndex >= this._scrollOffset + VISIBLE_ITEMS) {
            this._scrollOffset = this._selectedIndex - VISIBLE_ITEMS + 1;
        }
    }

    _selectItem(items) {
        const crystal = items[this._selectedIndex];
        if (!crystal) return;

        if (this._tab === 'scrap') {
            const idx = crystal.indices[0];
            const dustGain = scrapCrystal(idx);
            if (dustGain > 0) {
                this._message = `Scrapped for ${dustGain} dust`;
                this._messageTimer = 1.5;
                this._selectedIndex = Math.min(this._selectedIndex, Math.max(0, this._getItems().length - 1));
            }
        } else {
            const success = upgradeCrystal(crystal.itemId);
            if (success) {
                const def = getItemDef(crystal.itemId);
                const nextTier = def.tier + 1;
                const nextDef = getItemDef(`crystal_${def.subtype}_${nextTier}`);
                this._message = `Upgraded to ${nextDef ? nextDef.name : 'next tier'}!`;
                this._messageTimer = 1.5;
                this._selectedIndex = Math.min(this._selectedIndex, Math.max(0, this._getItems().length - 1));
            } else {
                this._message = 'Upgrade failed!';
                this._messageTimer = 1.5;
            }
        }
    }

    render(ctx) {
        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

        ctx.fillStyle = '#e65100';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CRYSTAL FORGE', INTERNAL_W / 2, 12);

        const tabY = 22;
        ctx.font = '5px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = this._tab === 'scrap' ? '#ffc107' : '#888';
        ctx.fillText('[1] Scrap', LIST_X, tabY);
        ctx.fillStyle = this._tab === 'upgrade' ? '#ffc107' : '#888';
        ctx.fillText('[2] Upgrade', LIST_X + 70, tabY);

        const items = this._getItems();
        this._renderItemList(ctx, items);

        ctx.fillStyle = '#ab47bc';
        ctx.font = '5px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('Dust: ' + playerData.crystalDust, INTERNAL_W - 8, INTERNAL_H - 16);

        ctx.fillStyle = '#ffc107';
        ctx.fillText('$' + playerData.coinsBank, INTERNAL_W - 8, INTERNAL_H - 8);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '4px monospace';
        ctx.fillText('TAB: switch  ENTER: confirm  ESC: close', INTERNAL_W / 2, INTERNAL_H - 4);

        if (this._messageTimer > 0 && this._message) {
            ctx.fillStyle = '#4caf50';
            ctx.font = '5px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this._message, INTERNAL_W / 2, INTERNAL_H - 24);
        }

        ctx.restore();
    }

    _renderItemList(ctx, items) {
        for (let i = 0; i < VISIBLE_ITEMS; i++) {
            const itemIdx = this._scrollOffset + i;
            if (itemIdx >= items.length) break;

            const crystal = items[itemIdx];
            const y = LIST_Y + i * ITEM_H;
            const selected = itemIdx === this._selectedIndex;

            if (selected) {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(LIST_X - 2, y - 1, INTERNAL_W - LIST_X * 2 + 4, ITEM_H - 1);
            }

            ctx.font = '5px monospace';
            ctx.textAlign = 'left';

            const def = crystal.def;
            ctx.fillStyle = getRarityColor(def.rarity);
            ctx.fillText(`${def.name} x${crystal.totalQty}`, LIST_X + 2, y + 6);

            ctx.textAlign = 'right';
            if (this._tab === 'scrap') {
                ctx.fillStyle = '#aaa';
                ctx.fillText('+' + (def.tier * 5) + ' dust', INTERNAL_W - LIST_X - 2, y + 6);
            } else {
                const nextTier = def.tier + 1;
                const nextDef = getItemDef(`crystal_${def.subtype}_${nextTier}`);
                ctx.fillStyle = nextDef ? getRarityColor(nextDef.rarity) : '#aaa';
                ctx.fillText('-> ' + (nextDef ? nextDef.name : '?'), INTERNAL_W - LIST_X - 2, y + 6);
            }
        }

        if (items.length === 0) {
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.font = '5px monospace';
            if (this._tab === 'scrap') {
                ctx.fillText('No crystals to scrap', INTERNAL_W / 2, LIST_Y + 20);
            } else {
                ctx.fillText('Need 3 of same crystal to upgrade', INTERNAL_W / 2, LIST_Y + 20);
            }
        }
    }

    isClosed() { return this._closed; }
}
