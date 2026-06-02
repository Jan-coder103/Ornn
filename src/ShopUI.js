import { INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { playerData } from './GameData.js';
import {
    getShopItems, getBuyPrice, getSellValue,
    addItem, removeItemByIndex, getInventoryItems,
    getItemDef, getRarityColor, getMaxSlots, calculateStats
} from './Inventory.js';
import { save } from './SaveManager.js';
import * as Input from './Input.js';

const VISIBLE_ITEMS = 9;
const ITEM_H = 11;
const LIST_Y = 28;
const LIST_X = 10;

export class ShopUI {
    constructor(onMessage) {
        this._closed = false;
        this._tab = 'buy';
        this._selectedIndex = 0;
        this._scrollOffset = 0;
        this._message = '';
        this._messageTimer = 0;
        this._onMessage = onMessage;
        this._buyItems = getShopItems(playerData.realmUnlocked);
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
            this._tab = this._tab === 'buy' ? 'sell' : 'buy';
            this._selectedIndex = 0;
            this._scrollOffset = 0;
        }

        const items = this._tab === 'buy' ? this._buyItems : this._getSellItems();
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

    _getSellItems() {
        return getInventoryItems();
    }

    _adjustScroll() {
        if (this._selectedIndex < this._scrollOffset) {
            this._scrollOffset = this._selectedIndex;
        } else if (this._selectedIndex >= this._scrollOffset + VISIBLE_ITEMS) {
            this._scrollOffset = this._selectedIndex - VISIBLE_ITEMS + 1;
        }
    }

    _selectItem(items) {
        const item = items[this._selectedIndex];
        if (!item) return;

        if (this._tab === 'buy') {
            const price = getBuyPrice(item.id);
            if (playerData.coinsBank < price) {
                this._message = 'Not enough coins!';
                this._messageTimer = 1.5;
                return;
            }
            const success = addItem(item.id, 1);
            if (!success) {
                this._message = 'Inventory full!';
                this._messageTimer = 1.5;
                return;
            }
            playerData.coinsBank -= price;
            this._message = `Bought ${item.name}`;
            this._messageTimer = 1.5;
            save();
        } else {
            const price = getSellValue(item.itemId);
            removeItemByIndex(item.inventoryIndex, 1);
            playerData.coinsBank += price;
            this._message = `Sold for $${price}`;
            this._messageTimer = 1.5;
            save();
            const sellItems = this._getSellItems();
            this._selectedIndex = Math.min(this._selectedIndex, Math.max(0, sellItems.length - 1));
            this._adjustScroll();
        }
    }

    render(ctx) {
        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

        ctx.fillStyle = '#fff';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SHOP', INTERNAL_W / 2, 12);

        const tabY = 20;
        const buyX = INTERNAL_W / 2 - 30;
        const sellX = INTERNAL_W / 2 + 10;

        ctx.font = '5px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = this._tab === 'buy' ? '#ffc107' : '#888';
        ctx.fillText('[B] Buy', buyX, tabY);
        ctx.fillStyle = this._tab === 'sell' ? '#ffc107' : '#888';
        ctx.fillText('[S] Sell', sellX, tabY);

        const items = this._tab === 'buy' ? this._buyItems : this._getSellItems();
        this._renderItemList(ctx, items);

        ctx.fillStyle = '#ffc107';
        ctx.font = '5px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('$' + playerData.coinsBank, INTERNAL_W - 8, INTERNAL_H - 8);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '4px monospace';
        ctx.fillText('TAB: switch  ENTER: select  ESC: close', INTERNAL_W / 2, INTERNAL_H - 4);

        if (this._messageTimer > 0 && this._message) {
            ctx.fillStyle = '#4caf50';
            ctx.font = '5px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this._message, INTERNAL_W / 2, INTERNAL_H - 16);
        }

        ctx.restore();
    }

    _renderItemList(ctx, items) {
        for (let i = 0; i < VISIBLE_ITEMS; i++) {
            const itemIdx = this._scrollOffset + i;
            if (itemIdx >= items.length) break;

            const item = items[itemIdx];
            const y = LIST_Y + i * ITEM_H;
            const selected = itemIdx === this._selectedIndex;

            if (selected) {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(LIST_X - 2, y - 1, INTERNAL_W - LIST_X * 2 + 4, ITEM_H - 1);
            }

            ctx.font = '5px monospace';
            ctx.textAlign = 'left';

            if (this._tab === 'buy') {
                const def = item;
                ctx.fillStyle = getRarityColor(def.rarity);
                ctx.fillText(def.name, LIST_X + 2, y + 6);

                ctx.fillStyle = selected ? '#ffc107' : '#aaa';
                ctx.textAlign = 'right';
                ctx.fillText('$' + def.sellValue, INTERNAL_W - LIST_X - 2, y + 6);
            } else {
                const def = getItemDef(item.itemId);
                const name = def ? def.name : item.itemId;
                const qty = item.quantity > 1 ? ` x${item.quantity}` : '';
                ctx.fillStyle = def ? getRarityColor(def.rarity) : '#fff';
                ctx.fillText(name + qty, LIST_X + 2, y + 6);

                const sellPrice = getSellValue(item.itemId);
                ctx.fillStyle = selected ? '#ffc107' : '#aaa';
                ctx.textAlign = 'right';
                ctx.fillText('$' + sellPrice, INTERNAL_W - LIST_X - 2, y + 6);
            }
        }

        if (items.length === 0) {
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.font = '5px monospace';
            ctx.fillText(this._tab === 'buy' ? 'No items available' : 'Inventory empty', INTERNAL_W / 2, LIST_Y + 20);
        }
    }

    isClosed() { return this._closed; }
}
