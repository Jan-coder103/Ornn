import { INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { playerData } from './GameData.js';
import {
    getMountItems, getBuyPrice, addItem,
    unequipItem, equipItem, findEmptySlot,
    calculateStats, getItemDef
} from './Inventory.js';
import { save } from './SaveManager.js';
import { fillText, fillTextCenter } from './Draw.js';
import * as Input from './Input.js';

const ITEM_H = 16;
const LIST_Y = 24;
const LIST_X = 10;

export class MountShopUI {
    constructor(onMessage) {
        this._closed = false;
        this._selectedIndex = 0;
        this._message = '';
        this._messageTimer = 0;
        this._onMessage = onMessage;
        this._mounts = getMountItems(playerData.realmUnlocked);
    }

    update(dt) {
        if (this._messageTimer > 0) {
            this._messageTimer -= dt;
        }

        if (Input.wasKeyPressed('Escape')) {
            this._closed = true;
            return;
        }

        const maxIdx = Math.max(0, this._mounts.length - 1);

        if (Input.wasKeyPressed('ArrowUp') || Input.wasKeyPressed('w') || Input.wasKeyPressed('W')) {
            this._selectedIndex = Math.max(0, this._selectedIndex - 1);
        }
        if (Input.wasKeyPressed('ArrowDown') || Input.wasKeyPressed('s') || Input.wasKeyPressed('S')) {
            this._selectedIndex = Math.min(maxIdx, this._selectedIndex + 1);
        }

        if (Input.wasKeyPressed('Enter') || Input.interactPressed()) {
            if (this._mounts.length > 0 && this._selectedIndex < this._mounts.length) {
                this._buyMount(this._mounts[this._selectedIndex]);
            }
        }
    }

    _buyMount(mountDef) {
        const price = getBuyPrice(mountDef.id);
        if (playerData.coinsBank < price) {
            this._message = 'Not enough coins!';
            this._messageTimer = 1.5;
            return;
        }

        if (playerData.equipped.mount && playerData.equipped.mount.itemId) {
            unequipItem('mount');
        }

        const emptyIdx = findEmptySlot();
        if (emptyIdx === -1) {
            this._message = 'Inventory full!';
            this._messageTimer = 1.5;
            return;
        }

        playerData.coinsBank -= price;
        addItem(mountDef.id, 1);
        equipItem(emptyIdx, 'mount');
        calculateStats();

        this._message = `Bought ${mountDef.name}!`;
        this._messageTimer = 1.5;
        save();
    }

    render(ctx) {
        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

        fillTextCenter('MOUNT SHOP', 4, '#8d6e63');

        const equipped = playerData.equipped.mount;
        if (equipped && equipped.itemId) {
            const def = getItemDef(equipped.itemId);
            fillTextCenter('Equipped: ' + (def ? def.name : equipped.itemId), 13, '#aaa');
        }

        this._renderMountList(ctx);

        fillText('$' + playerData.coinsBank, INTERNAL_W - 8, INTERNAL_H - 12, '#ffc107');

        fillTextCenter('ENTER: buy & equip  ESC: close', INTERNAL_H - 12, '#888');

        if (this._messageTimer > 0 && this._message) {
            fillTextCenter(this._message, INTERNAL_H - 22, '#4caf50');
        }

        ctx.restore();
    }

    _renderMountList(ctx) {
        for (let i = 0; i < this._mounts.length; i++) {
            const mount = this._mounts[i];
            const y = LIST_Y + i * ITEM_H;
            const selected = i === this._selectedIndex;

            if (selected) {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(LIST_X - 2, y - 1, INTERNAL_W - LIST_X * 2 + 4, ITEM_H - 1);
            }

            ctx.fillStyle = mount.color;
            ctx.fillRect(LIST_X + 2, y + 2, 8, 8);

            fillText(mount.name, LIST_X + 14, y, '#fff');

            const speedMult = mount.stats.mountSpeedMult || 1.0;
            fillText(speedMult.toFixed(1) + 'x speed', LIST_X + 14, y + 9, '#aaa');

            fillText('$' + mount.sellValue, INTERNAL_W - LIST_X - 2, y, selected ? '#ffc107' : '#aaa');
        }

        if (this._mounts.length === 0) {
            fillTextCenter('No mounts available', LIST_Y + 14, '#888');
        }
    }

    isClosed() { return this._closed; }
}
