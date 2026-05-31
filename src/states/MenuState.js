import { ctx, INTERNAL_W, INTERNAL_H } from '../RenderConfig.js';
import { STATES } from '../GameStateManager.js';
import { transitionTo, isInputBlocked } from '../Transition.js';
import { wasKeyPressed as wasPressed } from '../Input.js';

export default {
    enter() {},
    exit() {},
    update(dt) {
        if (!isInputBlocked() && wasPressed('Enter')) {
            transitionTo(STATES.HUB);
        }
    },
    render(c, alpha) {
        c.fillStyle = '#111';
        c.fillRect(0, 0, INTERNAL_W, INTERNAL_H);

        c.fillStyle = '#fff';
        c.font = '10px monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('ORNN', INTERNAL_W / 2, INTERNAL_H / 2 - 20);

        c.font = '6px monospace';
        c.fillStyle = '#aaa';
        c.fillText('Press ENTER to start', INTERNAL_W / 2, INTERNAL_H / 2 + 10);
    },
};
