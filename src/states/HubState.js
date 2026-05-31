import { Scene } from '../Scene.js';
import { isInputBlocked } from '../Transition.js';

let scene = null;

export default {
    enter() {
        scene = new Scene({ mapPath: 'data/maps/placeholder.json', type: 'hub' });
        scene.load();
    },
    exit() {
        if (scene) scene.destroy();
        scene = null;
    },
    update(dt) {
        if (scene) scene.update(dt);
    },
    render(c) {
        if (scene) scene.render(c);
    },
    getDebugInfo() {
        return scene ? scene.getDebugInfo() : {};
    },
};
