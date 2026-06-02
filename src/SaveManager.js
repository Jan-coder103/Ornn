import { playerData, resetPlayerData } from './GameData.js';
import { calculateStats, initInventory } from './Inventory.js';

const SAVE_KEY = 'ornn_save';
const CURRENT_VERSION = 1;

function buildSaveData() {
    return {
        version: CURRENT_VERSION,
        coinsBank: playerData.coinsBank,
        inventory: JSON.parse(JSON.stringify(playerData.inventory)),
        equipped: JSON.parse(JSON.stringify(playerData.equipped)),
        level: playerData.level,
        xp: playerData.xp,
        realmUnlocked: playerData.realmUnlocked,
        currentRealm: playerData.currentRealm,
        crystalDust: playerData.crystalDust,
        clearedDungeons: {
            realm1: [],
            realm2: [],
            realm3: [],
        },
        settings: {},
    };
}

function validateField(data, field, fallback) {
    if (data[field] === undefined || data[field] === null) {
        data[field] = fallback;
    }
}

function validateEquipped(equipped) {
    const slots = ['helmet', 'chest', 'shoes', 'ring1', 'ring2', 'tome', 'mount'];
    const result = {};
    for (const slot of slots) {
        if (equipped && equipped[slot] !== undefined) {
            const entry = equipped[slot];
            if (entry && typeof entry === 'string') {
                result[slot] = { itemId: entry, crystal: null };
            } else if (entry && typeof entry === 'object' && entry.itemId) {
                result[slot] = {
                    itemId: entry.itemId,
                    crystal: entry.crystal || null,
                };
            } else {
                result[slot] = null;
            }
        } else {
            result[slot] = null;
        }
    }
    return result;
}

function validateInventory(inventory) {
    if (!Array.isArray(inventory)) return new Array(24).fill(null);
    while (inventory.length < 24) {
        inventory.push(null);
    }
    return inventory.slice(0, 24).map(slot => {
        if (!slot || typeof slot !== 'object') return null;
        if (!slot.itemId) return null;
        return {
            itemId: slot.itemId,
            quantity: typeof slot.quantity === 'number' ? slot.quantity : 1,
        };
    });
}

function validateSaveData(data) {
    if (!data || typeof data !== 'object') return null;

    validateField(data, 'version', CURRENT_VERSION);
    validateField(data, 'coinsBank', 0);
    validateField(data, 'level', 1);
    validateField(data, 'xp', 0);
    validateField(data, 'realmUnlocked', 1);
    validateField(data, 'currentRealm', 1);
    validateField(data, 'crystalDust', 0);
    validateField(data, 'clearedDungeons', { realm1: [], realm2: [], realm3: [] });
    validateField(data, 'settings', {});

    data.coinsBank = Math.max(0, Math.floor(data.coinsBank));
    data.level = Math.max(1, Math.floor(data.level));
    data.xp = Math.max(0, Math.floor(data.xp));
    data.realmUnlocked = Math.max(1, Math.min(3, Math.floor(data.realmUnlocked)));
    data.currentRealm = Math.max(1, Math.min(3, Math.floor(data.currentRealm)));
    data.crystalDust = Math.max(0, Math.floor(data.crystalDust));

    data.inventory = validateInventory(data.inventory);
    data.equipped = validateEquipped(data.equipped);

    return data;
}

function migrateSaveData(data) {
    if (data.version < 1) {
        data.version = 1;
    }
    return data;
}

export function save() {
    try {
        const data = buildSaveData();
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        console.warn('SaveManager: save failed', e);
        return false;
    }
}

export function load() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;

        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return null;

        const migrated = migrateSaveData(data);
        const validated = validateSaveData(migrated);
        return validated;
    } catch (e) {
        console.warn('SaveManager: load failed', e);
        return null;
    }
}

export function hasSave() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        return data && typeof data === 'object';
    } catch (e) {
        return false;
    }
}

export function deleteSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
        return true;
    } catch (e) {
        return false;
    }
}

export function applySaveData(data) {
    if (!data) return false;

    resetPlayerData();

    playerData.coinsBank = data.coinsBank;
    playerData.inventory = data.inventory;
    playerData.equipped = data.equipped;
    playerData.level = data.level;
    playerData.xp = data.xp;
    playerData.realmUnlocked = data.realmUnlocked;
    playerData.currentRealm = data.currentRealm;
    playerData.crystalDust = data.crystalDust;
    playerData.health = -1;

    initInventory();

    return true;
}
