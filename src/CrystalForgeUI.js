import { INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { playerData } from './GameData.js';
import {
    getCrystalsInInventory, upgradeCrystal, scrapCrystal,
    getItemDef, getRarityColor, removeItemByIndex
} from './Inventory.js';
import { save } from './SaveManager.js';
import { fillText, fillTextCenter } from './Draw.js';
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

        if (Input.wasKeyPressed('Tab')) {
            this._tab = this._tab === 'scrap' ? 'upgrade' : 'scrap';
            this._selectedIndex = 0;
            this._scrollOffset = 0;
        }
        if (Input.wasKeyPressed('1') && this._tab !== 'scrap') {
            this._tab = 'scrap';
            this._selectedIndex = 0;
            this._scrollOffset = 0;
        }
        if (Input.wasKeyPressed('2') && this._tab !== 'upgrade') {
            this._tab = 'upgrade';
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
                save();
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
                save();
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

        fillTextCenter('CRYSTAL FORGE', 4, '#e65100');

        const tabY = 14;
        fillText('[1] Scrap', LIST_X, tabY, this._tab === 'scrap' ? '#ffc107' : '#888');
        fillText('[2] Upgrade', LIST_X + 70, tabY, this._tab === 'upgrade' ? '#ffc107' : '#888');

        const items = this._getItems();
        this._renderItemList(ctx, items);

        fillText('Dust: ' + playerData.crystalDust, INTERNAL_W - 8, INTERNAL_H - 24, '#ab47bc');
        fillText('$' + playerData.coinsBank, INTERNAL_W - 8, INTERNAL_H - 12, '#ffc107');

        fillTextCenter('TAB: switch  ENTER: confirm  ESC: close', INTERNAL_H - 12, '#888');

        if (this._messageTimer > 0 && this._message) {
            fillTextCenter(this._message, INTERNAL_H - 32, '#4caf50');
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

            const def = crystal.def;
            fillText(`${def.name} x${crystal.totalQty}`, LIST_X + 2, y, getRarityColor(def.rarity));

            if (this._tab === 'scrap') {
                fillText('+' + (def.tier * 5) + ' dust', INTERNAL_W - LIST_X - 2, y, '#aaa');
            } else {
                const nextTier = def.tier + 1;
                const nextDef = getItemDef(`crystal_${def.subtype}_${nextTier}`);
                fillText('-> ' + (nextDef ? nextDef.name : '?'), INTERNAL_W - LIST_X - 2, y, nextDef ? getRarityColor(nextDef.rarity) : '#aaa');
            }
        }

        if (items.length === 0) {
            if (this._tab === 'scrap') {
                fillTextCenter('No crystals to scrap', LIST_Y + 14, '#888');
            } else {
                fillTextCenter('Need 3 of same crystal to upgrade', LIST_Y + 14, '#888');
            }
        }
    }

    isClosed() { return this._closed; }
}
