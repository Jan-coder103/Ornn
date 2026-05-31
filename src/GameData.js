export const playerData = {
    coinsBank: 0,
    inventory: [],
    equipped: {},
    level: 1,
    xp: 0,
    realmUnlocked: 1,
    health: 6,
};

export function resetPlayerData() {
    playerData.coinsBank = 0;
    playerData.inventory = [];
    playerData.equipped = {};
    playerData.level = 1;
    playerData.xp = 0;
    playerData.realmUnlocked = 1;
    playerData.health = 6;
}
