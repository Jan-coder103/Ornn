import { Scene } from '../Scene.js';

let scene = null;

export default {
    enter() {
        scene = new Scene({ mapPath: 'data/maps/overworld.json', type: 'overworld' });
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
