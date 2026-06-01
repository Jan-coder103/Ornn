import { XP_BASE, REALM2_LEVEL, REALM3_LEVEL } from './CONFIG.js';
import { playerData } from './GameData.js';

export function getXpForLevel(level) {
    return XP_BASE * level;
}

export function addXP(amount) {
    playerData.xp += amount;

    while (playerData.xp >= getXpForLevel(playerData.level)) {
        playerData.xp -= getXpForLevel(playerData.level);
        playerData.level++;
        checkRealmUnlock();
    }
}

export function checkRealmUnlock() {
    if (playerData.level >= REALM3_LEVEL && playerData.realmUnlocked < 3) {
        playerData.realmUnlocked = 3;
    } else if (playerData.level >= REALM2_LEVEL && playerData.realmUnlocked < 2) {
        playerData.realmUnlocked = 2;
    }
}

export function getXPProgress() {
    const needed = getXpForLevel(playerData.level);
    return {
        current: playerData.xp,
        needed,
        fraction: playerData.xp / needed,
    };
}

export function isRealmUnlocked(realm) {
    if (realm === 1) return true;
    if (realm === 2) return playerData.level >= REALM2_LEVEL;
    if (realm === 3) return playerData.level >= REALM3_LEVEL;
    return false;
}
