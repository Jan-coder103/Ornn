import { ctx, INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { STATES } from '../GameStateManager.js';
import { transitionTo, isInputBlocked } from '../Transition.js';
import { wasKeyPressed as wasPressed } from '../Input.js';
import { hasSave, load, applySaveData, deleteSave } from '../SaveManager.js';
import { resetPlayerData } from '../GameData.js';
import * as Audio from '../AudioManager.js';
import { fillText, fillTextCenter } from '../Draw.js';

const MENU_CONTINUE = [
    { label: 'Continue', key: 'continue' },
    { label: 'New Game', key: 'newgame' },
];

const MENU_NEW = [
    { label: 'New Game', key: 'newgame' },
];

let menuItems = MENU_NEW;
let selectedIndex = 0;

export default {
    enter() {
        if (hasSave()) {
            menuItems = MENU_CONTINUE;
            selectedIndex = 0;
        } else {
            menuItems = MENU_NEW;
            selectedIndex = 0;
        }
    },
    exit() {},
    update(dt) {
        if (isInputBlocked()) return;

        if (wasPressed('ArrowUp') || wasPressed('w') || wasPressed('W')) {
            selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
        }
        if (wasPressed('ArrowDown') || wasPressed('s') || wasPressed('S')) {
            selectedIndex = (selectedIndex + 1) % menuItems.length;
        }
        if (wasPressed('Enter')) {
            const item = menuItems[selectedIndex];
            if (!item) return;

            if (item.key === 'continue') {
                const data = load();
                if (data) {
                    applySaveData(data);
                } else {
                    resetPlayerData();
                }
                transitionTo(STATES.HUB);
            } else if (item.key === 'newgame') {
                deleteSave();
                resetPlayerData();
                transitionTo(STATES.HUB);
            }
        }
    },
    render(c, alpha) {
        c.fillStyle = '#111';
        c.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

        fillTextCenter('ORNN', INTERNAL_H / 2 - 30 - 8, '#fff', '16px "Kenney Mini"');

        const startY = INTERNAL_H / 2 - 8;
        const lineH = 14;
        for (let i = 0; i < menuItems.length; i++) {
            const y = startY + i * lineH;
            const selected = i === selectedIndex;
            fillTextCenter((selected ? '> ' : '  ') + menuItems[i].label, y, selected ? '#ffc107' : '#aaa');
        }

        fillTextCenter('Enter: select  Up/Down: navigate', INTERNAL_H - 14, '#555');
    },
};
