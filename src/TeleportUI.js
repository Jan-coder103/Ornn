import { INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { playerData } from './GameData.js';
import { isRealmUnlocked, getXPProgress } from './XPSystem.js';
import { REALM2_LEVEL, REALM3_LEVEL } from './CONFIG.js';
import * as Input from './Input.js';

const REALM_NAMES = {
    1: 'Green Meadows',
    2: 'Scorched Lands',
    3: "Dragon's Peak",
};

const REALM_COLORS = {
    1: '#4caf50',
    2: '#ff9800',
    3: '#f44336',
};

const MAX_REALMS = 3;

export class TeleportUI {
    constructor(onRealmSelected) {
        this._closed = false;
        this._selectedIndex = 0;
        this._onRealmSelected = onRealmSelected;

        this._selectedIndex = Math.min(playerData.currentRealm - 1, MAX_REALMS - 1);
    }

    update(dt) {
        if (Input.wasKeyPressed('Escape')) {
            this._closed = true;
            return;
        }

        if (Input.wasKeyPressed('ArrowUp') || Input.wasKeyPressed('w') || Input.wasKeyPressed('W')) {
            this._selectedIndex = Math.max(0, this._selectedIndex - 1);
        }
        if (Input.wasKeyPressed('ArrowDown') || Input.wasKeyPressed('s') || Input.wasKeyPressed('S')) {
            this._selectedIndex = Math.min(MAX_REALMS - 1, this._selectedIndex + 1);
        }

        if (Input.wasKeyPressed('Enter') || Input.interactPressed()) {
            const realm = this._selectedIndex + 1;
            if (isRealmUnlocked(realm)) {
                if (this._onRealmSelected) {
                    this._onRealmSelected(realm);
                }
            }
        }
    }

    render(ctx) {
        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

        ctx.fillStyle = '#7b1fa2';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TELEPORT', INTERNAL_W / 2, 12);

        const startY = 30;
        const itemH = 22;

        for (let i = 0; i < MAX_REALMS; i++) {
            const realm = i + 1;
            const y = startY + i * itemH;
            const selected = i === this._selectedIndex;
            const unlocked = isRealmUnlocked(realm);
            const isCurrent = playerData.currentRealm === realm;

            if (selected) {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(20, y - 2, INTERNAL_W - 40, itemH - 2);
            }

            ctx.fillStyle = REALM_COLORS[realm];
            ctx.fillRect(24, y + 2, 6, 6);

            ctx.font = '6px monospace';
            ctx.textAlign = 'left';

            if (unlocked) {
                ctx.fillStyle = selected ? '#fff' : '#ccc';
                ctx.fillText(`Realm ${realm}: ${REALM_NAMES[realm]}`, 34, y + 8);

                if (isCurrent) {
                    ctx.fillStyle = '#ffc107';
                    ctx.font = '4px monospace';
                    ctx.fillText('(current)', 34, y + 15);
                }
            } else {
                ctx.fillStyle = '#666';
                ctx.fillText(`Realm ${realm}: ${REALM_NAMES[realm]}`, 34, y + 8);

                ctx.fillStyle = '#f44336';
                ctx.font = '4px monospace';
                let reqText = '';
                if (realm === 2) reqText = `Requires Lv.${REALM2_LEVEL}`;
                if (realm === 3) reqText = `Requires Lv.${REALM3_LEVEL}`;
                ctx.fillText(reqText, 34, y + 15);
            }
        }

        const xp = getXPProgress();
        ctx.fillStyle = '#aaa';
        ctx.font = '5px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Lv.${playerData.level}`, 20, INTERNAL_H - 28);

        const barX = 50;
        const barY = INTERNAL_H - 32;
        const barW = 80;
        const barH = 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#2196f3';
        ctx.fillRect(barX, barY, Math.floor(barW * xp.fraction), barH);
        ctx.fillStyle = '#aaa';
        ctx.font = '4px monospace';
        ctx.fillText(`${xp.current}/${xp.needed}`, barX + barW + 4, barY + 4);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = '4px monospace';
        ctx.fillText('ENTER: teleport  ESC: close', INTERNAL_W / 2, INTERNAL_H - 4);

        ctx.restore();
    }

    isClosed() { return this._closed; }
}
