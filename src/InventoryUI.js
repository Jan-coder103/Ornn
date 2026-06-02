import { INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { playerData } from './GameData.js';
import {
    getInventorySlot, getItemDef, getRarityColor, getMaxSlots,
    getEquippedItem, equipItem, unequipItem, calculateStats,
    getSellValue, socketCrystal
} from './Inventory.js';
import * as Input from './Input.js';

const INV_COLS = 8;
const INV_ROWS = 3;
const CELL = 12;
const GAP = 2;

const EQUIP_SLOTS = [
    { slot: 'helmet', abbr: 'Hlm' },
    { slot: 'chest', abbr: 'Cst' },
    { slot: 'shoes', abbr: 'Sho' },
    { slot: 'ring1', abbr: 'R1' },
    { slot: 'ring2', abbr: 'R2' },
    { slot: 'tome', abbr: 'Tom' },
    { slot: 'mount', abbr: 'Mnt' },
];

export class InventoryUI {
    constructor(onClose) {
        this._closed = false;
        this._section = 'inventory';
        this._invCursor = 0;
        this._equipCursor = 0;
        this._onClose = onClose;
        this._message = '';
        this._messageTimer = 0;
    }

    update(dt) {
        if (this._messageTimer > 0) this._messageTimer -= dt;

        if (Input.wasKeyPressed('Escape')) {
            this._closed = true;
            if (this._onClose) this._onClose();
            return;
        }

        if (Input.wasKeyPressed('Tab')) {
            this._section = this._section === 'inventory' ? 'equipment' : 'inventory';
        }

        if (this._section === 'equipment') {
            this._updateEquipmentNav();
        } else {
            this._updateInventoryNav();
        }
    }

    _updateEquipmentNav() {
        if (Input.wasKeyPressed('ArrowLeft') || Input.wasKeyPressed('a') || Input.wasKeyPressed('A')) {
            this._equipCursor = (this._equipCursor - 1 + EQUIP_SLOTS.length) % EQUIP_SLOTS.length;
        }
        if (Input.wasKeyPressed('ArrowRight') || Input.wasKeyPressed('d') || Input.wasKeyPressed('D')) {
            this._equipCursor = (this._equipCursor + 1) % EQUIP_SLOTS.length;
        }
        if (Input.wasKeyPressed('Enter') || Input.wasKeyPressed('u') || Input.wasKeyPressed('U')) {
            this._unequipSelected();
        }
    }

    _updateInventoryNav() {
        const col = this._invCursor % INV_COLS;
        const row = Math.floor(this._invCursor / INV_COLS);

        if (Input.wasKeyPressed('ArrowLeft') || Input.wasKeyPressed('a') || Input.wasKeyPressed('A')) {
            if (col > 0) this._invCursor--;
        }
        if (Input.wasKeyPressed('ArrowRight') || Input.wasKeyPressed('d') || Input.wasKeyPressed('D')) {
            if (col < INV_COLS - 1) this._invCursor++;
        }
        if (Input.wasKeyPressed('ArrowUp') || Input.wasKeyPressed('w') || Input.wasKeyPressed('W')) {
            if (row > 0) this._invCursor -= INV_COLS;
        }
        if (Input.wasKeyPressed('ArrowDown') || Input.wasKeyPressed('s') || Input.wasKeyPressed('S')) {
            if (row < INV_ROWS - 1) this._invCursor += INV_COLS;
        }

        if (Input.wasKeyPressed('Enter') || Input.wasKeyPressed('e') || Input.wasKeyPressed('E')) {
            this._equipSelected();
        }
    }

    _equipSelected() {
        const slot = getInventorySlot(this._invCursor);
        if (!slot || !slot.itemId) return;

        const def = getItemDef(slot.itemId);
        if (!def) return;

        if (def.type === 'crystal') {
            this._trySocketCrystal();
        } else if (def.type !== 'tool') {
            const success = equipItem(this._invCursor);
            if (success) {
                calculateStats();
                this._message = 'Equipped ' + def.name;
                this._messageTimer = 1;
            } else {
                this._message = 'Cannot equip';
                this._messageTimer = 1;
            }
        } else {
            this._message = 'Cannot equip tool';
            this._messageTimer = 1;
        }
    }

    _unequipSelected() {
        const eq = EQUIP_SLOTS[this._equipCursor];
        const entry = getEquippedItem(eq.slot);
        if (!entry || !entry.itemId) return;

        const success = unequipItem(eq.slot);
        if (success) {
            calculateStats();
            const def = getItemDef(entry.itemId);
            this._message = 'Unequipped ' + (def ? def.name : entry.itemId);
            this._messageTimer = 1;
        } else {
            this._message = 'Inventory full!';
            this._messageTimer = 1;
        }
    }

    _trySocketCrystal() {
        const slot = getInventorySlot(this._invCursor);
        if (!slot) return;

        for (const eq of EQUIP_SLOTS) {
            const entry = getEquippedItem(eq.slot);
            if (!entry || !entry.itemId) continue;
            const def = getItemDef(entry.itemId);
            if (def && def.crystalSlots > 0) {
                const success = socketCrystal(eq.slot, this._invCursor);
                if (success) {
                    calculateStats();
                    this._message = 'Socketed into ' + def.name;
                    this._messageTimer = 1;
                    return;
                }
            }
        }
        this._message = 'No armor to socket';
        this._messageTimer = 1;
    }

    render(c) {
        c.save();
        c.fillStyle = 'rgba(0,0,0,0.88)';
        c.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

        this._renderHeader(c);
        this._renderEquipment(c);
        this._renderGrid(c);
        this._renderTooltip(c);
        this._renderFooter(c);

        c.restore();
    }

    _renderHeader(c) {
        c.font = '7px monospace';
        c.textAlign = 'center';
        c.fillStyle = '#fff';
        c.fillText('INVENTORY', INTERNAL_W / 2, 8);

        c.font = '5px monospace';
        c.textAlign = 'right';
        c.fillStyle = '#ffc107';
        c.fillText('$' + playerData.coinsBank, INTERNAL_W - 4, 8);
    }

    _renderEquipment(c) {
        c.font = '4px monospace';
        c.textAlign = 'left';
        c.fillStyle = '#888';
        c.fillText('EQUIPPED', 4, 18);

        const eqTotalW = EQUIP_SLOTS.length * (CELL + GAP) - GAP;
        const eqStartX = Math.floor((INTERNAL_W - eqTotalW) / 2);
        const eqY = 22;

        for (let i = 0; i < EQUIP_SLOTS.length; i++) {
            const x = eqStartX + i * (CELL + GAP);
            const entry = getEquippedItem(EQUIP_SLOTS[i].slot);
            const selected = this._section === 'equipment' && i === this._equipCursor;

            c.fillStyle = selected ? 'rgba(255,193,7,0.3)' : 'rgba(255,255,255,0.08)';
            c.fillRect(x, eqY, CELL, CELL);

            c.strokeStyle = selected ? '#ffc107' : '#555';
            c.lineWidth = 1;
            c.strokeRect(x + 0.5, eqY + 0.5, CELL - 1, CELL - 1);

            if (entry && entry.itemId) {
                const def = getItemDef(entry.itemId);
                if (def) {
                    c.fillStyle = def.color || '#fff';
                    c.fillRect(x + 2, eqY + 2, CELL - 4, CELL - 4);

                    if (entry.crystal) {
                        const crystalDef = getItemDef(entry.crystal);
                        c.fillStyle = crystalDef ? crystalDef.color : '#fff';
                        c.fillRect(x + CELL - 4, eqY + CELL - 4, 3, 3);
                    }
                }
            }

            c.fillStyle = selected ? '#ffc107' : '#666';
            c.font = '3px monospace';
            c.textAlign = 'center';
            c.fillText(EQUIP_SLOTS[i].abbr, x + CELL / 2, eqY + CELL + 4);
        }
    }

    _renderGrid(c) {
        const gridLabelY = 40;
        c.font = '4px monospace';
        c.textAlign = 'left';
        c.fillStyle = '#888';
        c.fillText('ITEMS', 4, gridLabelY);

        const gridTotalW = INV_COLS * (CELL + GAP) - GAP;
        const gridStartX = Math.floor((INTERNAL_W - gridTotalW) / 2);
        const gridY = gridLabelY + 4;

        for (let i = 0; i < getMaxSlots(); i++) {
            const col = i % INV_COLS;
            const row = Math.floor(i / INV_COLS);
            const x = gridStartX + col * (CELL + GAP);
            const y = gridY + row * (CELL + GAP);
            const selected = this._section === 'inventory' && i === this._invCursor;
            const slot = getInventorySlot(i);

            c.fillStyle = selected ? 'rgba(255,193,7,0.3)' : 'rgba(255,255,255,0.05)';
            c.fillRect(x, y, CELL, CELL);

            c.strokeStyle = selected ? '#ffc107' : '#444';
            c.lineWidth = 1;
            c.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);

            if (slot && slot.itemId) {
                const def = getItemDef(slot.itemId);
                if (def) {
                    c.fillStyle = def.color || '#fff';
                    c.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);

                    if (slot.quantity > 1) {
                        c.fillStyle = '#fff';
                        c.font = '3px monospace';
                        c.textAlign = 'right';
                        c.fillText('' + slot.quantity, x + CELL - 1, y + CELL - 1);
                    }
                }
            }
        }
    }

    _renderTooltip(c) {
        const gridLabelY = 40;
        const gridY = gridLabelY + 4;
        const gridH = INV_ROWS * (CELL + GAP) - GAP;
        const tipY = gridY + gridH + 6;

        let def = null;
        let crystalDef = null;
        let quantity = 1;

        if (this._section === 'inventory') {
            const slot = getInventorySlot(this._invCursor);
            if (slot && slot.itemId) {
                def = getItemDef(slot.itemId);
                quantity = slot.quantity;
            }
        } else {
            const entry = getEquippedItem(EQUIP_SLOTS[this._equipCursor].slot);
            if (entry && entry.itemId) {
                def = getItemDef(entry.itemId);
                if (entry.crystal) crystalDef = getItemDef(entry.crystal);
            }
        }

        if (!def) {
            c.fillStyle = '#555';
            c.font = '4px monospace';
            c.textAlign = 'center';
            c.fillText('Empty slot', INTERNAL_W / 2, tipY + 6);
            return;
        }

        let y = tipY;

        c.fillStyle = getRarityColor(def.rarity);
        c.font = '5px monospace';
        c.textAlign = 'center';
        c.fillText(def.name, INTERNAL_W / 2, y + 5);
        y += 8;

        c.fillStyle = '#888';
        c.font = '4px monospace';
        c.fillText(def.type.toUpperCase() + (def.rarity ? ' \u00b7 ' + def.rarity.toUpperCase() : ''), INTERNAL_W / 2, y + 4);
        y += 7;

        const stats = def.stats || {};
        let statParts = [];
        if (stats.hpBonus) statParts.push('HP+' + stats.hpBonus);
        if (stats.damageBonus) statParts.push('DMG+' + stats.damageBonus);
        if (stats.speedBonus) statParts.push('SPD+' + stats.speedBonus.toFixed(2));
        if (stats.mountSpeedMult) statParts.push('x' + stats.mountSpeedMult + ' SPD');

        c.fillStyle = '#ccc';
        c.fillText(statParts.join('  ') || 'No bonuses', INTERNAL_W / 2, y + 4);
        y += 7;

        if (this._section === 'inventory' && def.type !== 'crystal' && def.type !== 'tool') {
            this._renderStatComparison(c, def, y);
            y += 7;
        }

        if (crystalDef) {
            c.fillStyle = crystalDef.color;
            c.font = '4px monospace';
            const cStats = crystalDef.stats || {};
            let cParts = [];
            if (cStats.hpBonus) cParts.push('HP+' + cStats.hpBonus);
            if (cStats.damageBonus) cParts.push('DMG+' + cStats.damageBonus);
            if (cStats.speedBonus) cParts.push('SPD+' + cStats.speedBonus.toFixed(2));
            c.fillText('Crystal: ' + crystalDef.name + ' (' + cParts.join(', ') + ')', INTERNAL_W / 2, y + 4);
            y += 7;
        } else if (def.crystalSlots > 0) {
            c.fillStyle = '#555';
            c.font = '4px monospace';
            c.fillText('Crystal slot: empty', INTERNAL_W / 2, y + 4);
            y += 7;
        }

        if (quantity > 1) {
            c.fillStyle = '#888';
            c.font = '4px monospace';
            c.fillText('Quantity: ' + quantity, INTERNAL_W / 2, y + 4);
            y += 7;
        }

        c.fillStyle = '#888';
        c.font = '4px monospace';
        c.fillText('Sell: $' + getSellValue(def.id), INTERNAL_W / 2, y + 4);
    }

    _renderStatComparison(c, def, y) {
        const newStats = def.stats || {};
        const targetSlot = def.type === 'ring' ? 'ring1' : def.type;
        let currentStats = { hpBonus: 0, damageBonus: 0, speedBonus: 0 };

        const current = getEquippedItem(targetSlot);
        if (current && current.itemId) {
            const currentDef = getItemDef(current.itemId);
            if (currentDef) currentStats = currentDef.stats || currentStats;
        }

        const diffHp = (newStats.hpBonus || 0) - (currentStats.hpBonus || 0);
        const diffDmg = (newStats.damageBonus || 0) - (currentStats.damageBonus || 0);
        const diffSpd = (newStats.speedBonus || 0) - (currentStats.speedBonus || 0);

        let parts = [];
        if (diffHp !== 0) parts.push((diffHp > 0 ? '+' : '') + diffHp + ' HP');
        if (diffDmg !== 0) parts.push((diffDmg > 0 ? '+' : '') + diffDmg + ' DMG');
        if (diffSpd !== 0) parts.push((diffSpd > 0 ? '+' : '') + diffSpd.toFixed(2) + ' SPD');

        c.font = '4px monospace';
        c.textAlign = 'center';

        if (parts.length > 0) {
            const hasPositive = diffHp > 0 || diffDmg > 0 || diffSpd > 0;
            const hasNegative = diffHp < 0 || diffDmg < 0 || diffSpd < 0;
            c.fillStyle = hasNegative ? '#f44336' : '#4caf50';
            c.fillText('vs equipped: ' + parts.join('  '), INTERNAL_W / 2, y + 4);
        } else {
            c.fillStyle = '#666';
            c.fillText('Same stats as equipped', INTERNAL_W / 2, y + 4);
        }
    }

    _renderFooter(c) {
        if (this._messageTimer > 0 && this._message) {
            c.fillStyle = '#4caf50';
            c.font = '5px monospace';
            c.textAlign = 'center';
            c.fillText(this._message, INTERNAL_W / 2, INTERNAL_H - 12);
        }

        c.font = '4px monospace';
        c.textAlign = 'center';
        c.fillStyle = '#555';
        c.fillText('Tab: switch  E: equip/socket  U: unequip  ESC: close', INTERNAL_W / 2, INTERNAL_H - 3);
    }

    isClosed() { return this._closed; }
}
