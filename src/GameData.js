export const playerData = {
    coinsBank: 0,
    inventory: [],
    equipped: {},
    level: 1,
    xp: 0,
    realmUnlocked: 1,
    health: 6,

    fromDungeon: false,
    pendingDungeonID: 1,
    pendingDungeonEntranceIndex: -1,
    justClearedDungeon: false,
    deathMessage: '',
    deathMessageTimer: 0,
};

export function resetPlayerData() {
    playerData.coinsBank = 0;
    playerData.inventory = [];
    playerData.equipped = {};
    playerData.level = 1;
    playerData.xp = 0;
    playerData.realmUnlocked = 1;
    playerData.health = 6;
    playerData.fromDungeon = false;
    playerData.pendingDungeonID = 1;
    playerData.pendingDungeonEntranceIndex = -1;
    playerData.justClearedDungeon = false;
    playerData.deathMessage = '';
    playerData.deathMessageTimer = 0;
}
