import { ctx, INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { STATES, changeState } from '../GameStateManager.js';

let timer = 0;

export default {
    enter() {
        timer = 0;
    },
    exit() {},
    update(dt) {
        timer += dt;
        if (timer > 0.5) {
            changeState(STATES.MAIN_MENU);
        }
    },
    render(c, alpha) {
        c.fillStyle = '#000';
        c.fillRect(0, 0, INTERNAL_W, INTERNAL_H);
        c.fillStyle = '#fff';
        c.font = '8px monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('Ornn', INTERNAL_W / 2, INTERNAL_H / 2);
    },
};
