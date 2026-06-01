export const playerData = {
    coinsBank: 0,
    inventory: [],
    equipped: {
        helmet: null,
        chest: null,
        shoes: null,
        ring1: null,
        ring2: null,
        tome: null,
        mount: null,
    },
    level: 1,
    xp: 0,
    realmUnlocked: 1,
    health: 6,
    totalStats: {
        hpBonus: 0,
        damageBonus: 0,
        speedBonus: 0,
        mountSpeedMult: 1.0,
    },

    fromDungeon: false,
    pendingDungeonID: 1,
    pendingDungeonEntranceIndex: -1,
    justClearedDungeon: false,
    deathMessage: '',
    deathMessageTimer: 0,
    inventoryMessage: '',
    inventoryMessageTimer: 0,
};

export function resetPlayerData() {
    playerData.coinsBank = 0;
    playerData.inventory = [];
    playerData.equipped = {
        helmet: null,
        chest: null,
        shoes: null,
        ring1: null,
        ring2: null,
        tome: null,
        mount: null,
    };
    playerData.level = 1;
    playerData.xp = 0;
    playerData.realmUnlocked = 1;
    playerData.health = 6;
    playerData.totalStats = {
        hpBonus: 0,
        damageBonus: 0,
        speedBonus: 0,
        mountSpeedMult: 1.0,
    };
    playerData.fromDungeon = false;
    playerData.pendingDungeonID = 1;
    playerData.pendingDungeonEntranceIndex = -1;
    playerData.justClearedDungeon = false;
    playerData.deathMessage = '';
    playerData.deathMessageTimer = 0;
    playerData.inventoryMessage = '';
    playerData.inventoryMessageTimer = 0;
}
