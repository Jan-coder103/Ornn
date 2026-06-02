import { ctx, INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { STATES } from '../GameStateManager.js';
import { transitionTo, isInputBlocked } from '../Transition.js';
import { wasKeyPressed as wasPressed } from '../Input.js';
import { hasSave, load, applySaveData, deleteSave } from '../SaveManager.js';
import { resetPlayerData } from '../GameData.js';

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

        c.fillStyle = '#fff';
        c.font = '10px monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('ORNN', INTERNAL_W / 2, INTERNAL_H / 2 - 30);

        const startY = INTERNAL_H / 2;
        const lineH = 14;
        for (let i = 0; i < menuItems.length; i++) {
            const y = startY + i * lineH;
            const selected = i === selectedIndex;
            c.font = '6px monospace';
            c.textAlign = 'center';
            c.textBaseline = 'alphabetic';
            c.fillStyle = selected ? '#ffc107' : '#aaa';
            c.fillText((selected ? '> ' : '  ') + menuItems[i].label, INTERNAL_W / 2, y);
        }

        c.font = '4px monospace';
        c.fillStyle = '#555';
        c.textAlign = 'center';
        c.fillText('Enter: select  Up/Down: navigate', INTERNAL_W / 2, INTERNAL_H - 6);
    },
};
