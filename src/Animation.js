export class Animation {
    constructor(frames, durations) {
        this.frames = frames;
        this.totalFrames = frames.length;
        this.durations = durations || null;
        this.time = 0;
        this.frameIndex = 0;
        this.finished = false;
        this.loop = true;
        this.defaultDuration = 0.1;
    }

    reset() {
        this.time = 0;
        this.frameIndex = 0;
        this.finished = false;
    }

    update(dt) {
        if (this.finished) return;

        this.time += dt;

        const duration = this._currentDuration();
        if (this.time >= duration) {
            this.time -= duration;
            this.frameIndex++;

            if (this.frameIndex >= this.totalFrames) {
                if (this.loop) {
                    this.frameIndex = 0;
                } else {
                    this.frameIndex = this.totalFrames - 1;
                    this.finished = true;
                }
            }
        }
    }

    _currentDuration() {
        if (this.durations) {
            return this.durations[this.frameIndex] ?? this.defaultDuration;
        }
        return this.defaultDuration;
    }

    getFrame() {
        return this.frames[this.frameIndex];
    }
}

export class Animator {
    constructor() {
        this.animations = {};
        this.current = null;
        this.currentName = null;
    }

    add(name, animation) {
        this.animations[name] = animation;
    }

    play(name, loop) {
        if (this.currentName === name) return;
        this.currentName = name;
        this.current = this.animations[name];
        if (this.current) {
            this.current.reset();
            if (loop !== undefined) this.current.loop = loop;
        }
    }

    update(dt) {
        if (this.current) this.current.update(dt);
    }

    getFrame() {
        return this.current ? this.current.getFrame() : 0;
    }

    isFinished() {
        return this.current ? this.current.finished : false;
    }
}
