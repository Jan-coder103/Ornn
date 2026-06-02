import { INTERNAL_W, INTERNAL_H } from './RenderConfig.js';
import { fillText, fillTextCenter } from './Draw.js';
import * as Input from './Input.js';

const MENU_ITEMS = [
    { label: 'Resume', key: 'resume' },
    { label: 'Inventory', key: 'inventory' },
    { label: 'Save', key: 'save' },
    { label: 'Quit to Hub', key: 'quit' },
];

export class PauseUI {
    constructor(actions) {
        this._closed = false;
        this._selectedIndex = 0;
        this._actions = actions || {};
        this._message = '';
        this._messageTimer = 0;
    }

    update(dt) {
        if (this._messageTimer > 0) this._messageTimer -= dt;

        if (Input.wasKeyPressed('ArrowUp') || Input.wasKeyPressed('w') || Input.wasKeyPressed('W')) {
            this._selectedIndex = (this._selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
        }
        if (Input.wasKeyPressed('ArrowDown') || Input.wasKeyPressed('s') || Input.wasKeyPressed('S')) {
            this._selectedIndex = (this._selectedIndex + 1) % MENU_ITEMS.length;
        }
        if (Input.wasKeyPressed('Enter') || Input.interactPressed()) {
            this._select();
        }
        if (Input.wasKeyPressed('Escape')) {
            this._closed = true;
        }
    }

    _select() {
        const item = MENU_ITEMS[this._selectedIndex];
        if (!item) return;

        if (item.key === 'resume') {
            this._closed = true;
        } else if (item.key === 'save') {
            if (this._actions.save) this._actions.save();
            this._message = 'Game saved!';
            this._messageTimer = 1.5;
        } else if (this._actions[item.key]) {
            this._actions[item.key]();
        }
    }

    render(c) {
        c.save();
        c.fillStyle = 'rgba(0,0,0,0.7)';
        c.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

        fillTextCenter('PAUSED', 41, '#fff');

        const startY = 57;
        const lineH = 14;
        for (let i = 0; i < MENU_ITEMS.length; i++) {
            const y = startY + i * lineH;
            const selected = i === this._selectedIndex;
            fillTextCenter((selected ? '> ' : '  ') + MENU_ITEMS[i].label, y, selected ? '#ffc107' : '#aaa');
        }

        if (this._messageTimer > 0 && this._message) {
            fillTextCenter(this._message, startY + MENU_ITEMS.length * lineH + 8, '#4caf50');
        }

        fillTextCenter('Enter: select  Esc: resume', INTERNAL_H - 14, '#555');

        c.restore();
    }

    isClosed() { return this._closed; }
}
