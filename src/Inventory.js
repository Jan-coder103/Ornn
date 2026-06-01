import { playerData } from './GameData.js';

const MAX_SLOTS = 24;
const EQUIP_SLOTS = ['helmet', 'chest', 'shoes', 'ring1', 'ring2', 'tome', 'mount'];
const ARMOR_SLOTS = ['helmet', 'chest', 'shoes'];

let itemsDB = null;
let lootTables = null;
let rarityColors = null;

export function setItemsDB(data) {
    itemsDB = data.items || {};
    lootTables = data.lootTables || {};
    rarityColors = data.rarityColors || {};
}

export function getItemsDB() {
    return itemsDB;
}

export function getItemDef(itemId) {
    return itemsDB ? itemsDB[itemId] || null : null;
}

export function getRarityColor(rarity) {
    return rarityColors ? rarityColors[rarity] || '#bdbdbd' : '#bdbdbd';
}

export function getMaxSlots() {
    return MAX_SLOTS;
}

export function getEquipSlots() {
    return EQUIP_SLOTS;
}

export function initInventory() {
    if (!playerData.inventory || !Array.isArray(playerData.inventory)) {
        playerData.inventory = [];
    }
    while (playerData.inventory.length < MAX_SLOTS) {
        playerData.inventory.push(null);
    }
    if (!playerData.equipped || typeof playerData.equipped !== 'object') {
        playerData.equipped = {};
    }
    for (const slot of EQUIP_SLOTS) {
        if (!(slot in playerData.equipped)) {
            playerData.equipped[slot] = null;
        }
    }
}

function normalizeEquipped() {
    for (const slot of EQUIP_SLOTS) {
        const entry = playerData.equipped[slot];
        if (entry && typeof entry === 'object') {
            if (entry.itemId === null || entry.itemId === undefined) {
                playerData.equipped[slot] = null;
            }
        } else if (typeof entry === 'string') {
            playerData.equipped[slot] = { itemId: entry, crystal: null };
        }
    }
}

export function getInventorySlot(index) {
    if (index < 0 || index >= MAX_SLOTS) return null;
    return playerData.inventory[index];
}

export function setInventorySlot(index, slotData) {
    if (index < 0 || index >= MAX_SLOTS) return false;
    playerData.inventory[index] = slotData;
    return true;
}

export function findEmptySlot() {
    for (let i = 0; i < MAX_SLOTS; i++) {
        if (!playerData.inventory[i]) return i;
    }
    return -1;
}

export function findItemSlot(itemId) {
    for (let i = 0; i < MAX_SLOTS; i++) {
        const slot = playerData.inventory[i];
        if (slot && slot.itemId === itemId) return i;
    }
    return -1;
}

export function isFull() {
    return findEmptySlot() === -1;
}

export function addItem(itemId, quantity) {
    if (!itemsDB) return false;
    const def = itemsDB[itemId];
    if (!def) return false;

    quantity = quantity || 1;

    if (def.stackable) {
        for (let i = 0; i < MAX_SLOTS; i++) {
            const slot = playerData.inventory[i];
            if (slot && slot.itemId === itemId && slot.quantity < def.maxStack) {
                const space = def.maxStack - slot.quantity;
                const add = Math.min(quantity, space);
                slot.quantity += add;
                quantity -= add;
                if (quantity <= 0) return true;
            }
        }
        while (quantity > 0) {
            const idx = findEmptySlot();
            if (idx === -1) return false;
            const add = Math.min(quantity, def.maxStack);
            playerData.inventory[idx] = { itemId, quantity: add };
            quantity -= add;
        }
        return true;
    } else {
        for (let i = 0; i < quantity; i++) {
            const idx = findEmptySlot();
            if (idx === -1) return false;
            playerData.inventory[idx] = { itemId, quantity: 1 };
        }
        return true;
    }
}

export function removeItemByIndex(index, quantity) {
    const slot = playerData.inventory[index];
    if (!slot) return false;

    quantity = quantity || 1;
    slot.quantity -= quantity;
    if (slot.quantity <= 0) {
        playerData.inventory[index] = null;
    }
    return true;
}

export function removeItemById(itemId, quantity) {
    quantity = quantity || 1;
    for (let i = MAX_SLOTS - 1; i >= 0; i--) {
        const slot = playerData.inventory[i];
        if (slot && slot.itemId === itemId) {
            const remove = Math.min(quantity, slot.quantity);
            slot.quantity -= remove;
            quantity -= remove;
            if (slot.quantity <= 0) {
                playerData.inventory[i] = null;
            }
            if (quantity <= 0) return true;
        }
    }
    return quantity <= 0;
}

export function hasItem(itemId, quantity) {
    quantity = quantity || 1;
    let total = 0;
    for (const slot of playerData.inventory) {
        if (slot && slot.itemId === itemId) {
            total += slot.quantity;
        }
    }
    return total >= quantity;
}

export function equipItem(inventoryIndex, equipSlot) {
    const slot = playerData.inventory[inventoryIndex];
    if (!slot) return false;

    const def = itemsDB ? itemsDB[slot.itemId] : null;
    if (!def) return false;

    if (def.type === 'crystal' || def.type === 'tool') return false;

    const targetSlot = equipSlot || def.type;
    if (!EQUIP_SLOTS.includes(targetSlot)) return false;

    if (targetSlot === 'ring') {
        if (!playerData.equipped.ring1 || playerData.equipped.ring1.itemId === null) {
            return _equipToSlot(inventoryIndex, 'ring1');
        } else if (!playerData.equipped.ring2 || playerData.equipped.ring2.itemId === null) {
            return _equipToSlot(inventoryIndex, 'ring2');
        } else {
            return _equipToSlot(inventoryIndex, 'ring1');
        }
    }

    return _equipToSlot(inventoryIndex, targetSlot);
}

function _equipToSlot(inventoryIndex, equipSlot) {
    const slot = playerData.inventory[inventoryIndex];
    if (!slot) return false;

    const currentlyEquipped = playerData.equipped[equipSlot];

    playerData.inventory[inventoryIndex] = null;

    if (currentlyEquipped && currentlyEquipped.itemId) {
        const emptyIdx = findEmptySlot();
        if (emptyIdx === -1) {
            playerData.inventory[inventoryIndex] = slot;
            return false;
        }
        playerData.inventory[emptyIdx] = {
            itemId: currentlyEquipped.itemId,
            quantity: 1,
        };
    }

    playerData.equipped[equipSlot] = {
        itemId: slot.itemId,
        crystal: null,
    };

    return true;
}

export function unequipItem(equipSlot) {
    const entry = playerData.equipped[equipSlot];
    if (!entry || !entry.itemId) return false;

    const emptyIdx = findEmptySlot();
    if (emptyIdx === -1) return false;

    playerData.inventory[emptyIdx] = {
        itemId: entry.itemId,
        quantity: 1,
    };

    playerData.equipped[equipSlot] = null;
    return true;
}

export function getEquippedItem(equipSlot) {
    const entry = playerData.equipped[equipSlot];
    if (!entry || !entry.itemId) return null;
    return entry;
}

export function socketCrystal(equipSlot, crystalInventoryIndex) {
    const crystalSlot = playerData.inventory[crystalInventoryIndex];
    if (!crystalSlot) return false;

    const crystalDef = itemsDB ? itemsDB[crystalSlot.itemId] : null;
    if (!crystalDef || crystalDef.type !== 'crystal') return false;

    const armorEntry = playerData.equipped[equipSlot];
    if (!armorEntry || !armorEntry.itemId) return false;

    const armorDef = itemsDB[armorEntry.itemId];
    if (!armorDef || !armorDef.crystalSlots || armorDef.crystalSlots < 1) return false;

    if (armorEntry.crystal) {
        armorEntry.crystal = null;
    }

    removeItemByIndex(crystalInventoryIndex, 1);
    armorEntry.crystal = crystalSlot.itemId;

    return true;
}

export function calculateStats() {
    normalizeEquipped();

    const total = {
        hpBonus: 0,
        damageBonus: 0,
        speedBonus: 0,
        mountSpeedMult: 1.0,
    };

    for (const slot of EQUIP_SLOTS) {
        const entry = playerData.equipped[slot];
        if (!entry || !entry.itemId) continue;

        const def = itemsDB ? itemsDB[entry.itemId] : null;
        if (!def) continue;

        total.hpBonus += def.stats.hpBonus || 0;
        total.damageBonus += def.stats.damageBonus || 0;
        total.speedBonus += def.stats.speedBonus || 0;

        if (def.stats.mountSpeedMult && def.type === 'mount') {
            total.mountSpeedMult = def.stats.mountSpeedMult;
        }

        if (def.crystalSlots > 0 && entry.crystal) {
            const crystalDef = itemsDB[entry.crystal];
            if (crystalDef) {
                total.hpBonus += crystalDef.stats.hpBonus || 0;
                total.damageBonus += crystalDef.stats.damageBonus || 0;
                total.speedBonus += crystalDef.stats.speedBonus || 0;
            }
        }
    }

    playerData.totalStats = total;
    return total;
}

export function getSellValue(itemId) {
    const def = itemsDB ? itemsDB[itemId] : null;
    if (!def) return 0;
    return Math.floor(def.sellValue * 0.4);
}

export function getBuyPrice(itemId) {
    const def = itemsDB ? itemsDB[itemId] : null;
    if (!def) return 0;
    return def.sellValue;
}

export function getShopItems(maxRealm) {
    if (!itemsDB) return [];
    return Object.values(itemsDB).filter(item => {
        if (item.type === 'crystal' || item.type === 'tool' || item.type === 'mount') return false;
        if (item.realm > maxRealm) return false;
        return true;
    });
}

export function getMountItems(maxRealm) {
    if (!itemsDB) return [];
    return Object.values(itemsDB).filter(item => {
        if (item.type !== 'mount') return false;
        if (item.realm > maxRealm) return false;
        return true;
    });
}

export function getCrystalsInInventory() {
    if (!itemsDB) return [];
    const crystals = [];
    const grouped = {};
    for (let i = 0; i < MAX_SLOTS; i++) {
        const slot = playerData.inventory[i];
        if (!slot) continue;
        const def = itemsDB[slot.itemId];
        if (def && def.type === 'crystal') {
            const key = def.subtype + '_' + def.tier;
            if (!grouped[key]) {
                grouped[key] = { itemId: slot.itemId, def, totalQty: 0, indices: [] };
            }
            grouped[key].totalQty += slot.quantity;
            grouped[key].indices.push(i);
        }
    }
    return Object.values(grouped);
}

export function upgradeCrystal(itemId) {
    const def = itemsDB ? itemsDB[itemId] : null;
    if (!def || def.type !== 'crystal') return false;

    const nextTier = def.tier + 1;
    const upgradedId = `crystal_${def.subtype}_${nextTier}`;
    const upgradedDef = itemsDB ? itemsDB[upgradedId] : null;
    if (!upgradedDef) return false;

    if (!hasItem(itemId, 3)) return false;

    removeItemById(itemId, 3);
    addItem(upgradedId, 1);
    return true;
}

export function scrapCrystal(inventoryIndex) {
    const slot = playerData.inventory[inventoryIndex];
    if (!slot) return 0;

    const def = itemsDB ? itemsDB[slot.itemId] : null;
    if (!def || def.type !== 'crystal') return 0;

    const dustGain = def.tier * 5;
    removeItemByIndex(inventoryIndex, 1);
    playerData.crystalDust += dustGain;
    return dustGain;
}

export function getInventoryItems() {
    const items = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
        const slot = playerData.inventory[i];
        if (slot) {
            items.push({ ...slot, inventoryIndex: i });
        }
    }
    return items;
}

export function rollLoot(realm) {
    if (!itemsDB || !lootTables) return [];

    const table = lootTables[String(realm)] || lootTables['1'];
    if (!table) return [];

    const count = 2 + Math.floor(Math.random() * 3);
    const results = [];

    const rarities = ['common', 'uncommon', 'rare', 'epic'];
    const totalWeight = rarities.reduce((sum, r) => sum + (table[r] ? table[r].weight : 0), 0);

    for (let i = 0; i < count; i++) {
        let roll = Math.random() * totalWeight;
        let chosenRarity = 'common';

        for (const rarity of rarities) {
            const entry = table[rarity];
            if (!entry || entry.weight <= 0) continue;
            roll -= entry.weight;
            if (roll <= 0) {
                chosenRarity = rarity;
                break;
            }
        }

        const pool = table[chosenRarity];
        if (!pool || pool.items.length === 0) {
            const fallback = table['common'];
            if (fallback && fallback.items.length > 0) {
                results.push(fallback.items[Math.floor(Math.random() * fallback.items.length)]);
            }
            continue;
        }

        results.push(pool.items[Math.floor(Math.random() * pool.items.length)]);
    }

    return results;
}
