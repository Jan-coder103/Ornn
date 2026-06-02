let audioCtx = null;
let masterGain = null;
let initialized = false;
const pool = {};
const MAX_POOL_SIZE = 8;

function ensureContext() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(audioCtx.destination);
}

function getFromPool(name) {
    if (!pool[name]) pool[name] = [];
    if (pool[name].length < MAX_POOL_SIZE) {
        const buffer = generateBuffer(name);
        pool[name].push(buffer);
    }
    return pool[name][pool[name].length - 1];
}

function generateBuffer(name) {
    const sampleRate = audioCtx.sampleRate;
    const recipes = {
        jump:      { duration: 0.12, freq: [260, 520], type: 'square', decay: true },
        throw:     { duration: 0.15, freq: [400, 200], type: 'sawtooth', decay: true },
        catch:     { duration: 0.1,  freq: [500, 600], type: 'sine', decay: true },
        hit:       { duration: 0.08, freq: [200, 80],  type: 'square', decay: true },
        kill:      { duration: 0.2,  freq: [300, 600], type: 'square', decay: true },
        pickup:    { duration: 0.12, freq: [600, 900], type: 'sine', decay: false },
        coin:      { duration: 0.06, freq: [1200, 1800], type: 'sine', decay: true },
        portal:    { duration: 0.25, freq: [300, 500, 700], type: 'sine', decay: false },
        shop:      { duration: 0.15, freq: [400, 600, 800], type: 'triangle', decay: false },
        error:     { duration: 0.12, freq: [150, 100], type: 'square', decay: true },
        boss_hit:  { duration: 0.15, freq: [150, 60],  type: 'sawtooth', decay: true },
        level_up:  { duration: 0.4,  freq: [400, 600, 800, 1000], type: 'sine', decay: false },
        death:     { duration: 0.3,  freq: [400, 100], type: 'sawtooth', decay: true },
    };

    const recipe = recipes[name];
    if (!recipe) return null;

    const len = Math.floor(sampleRate * recipe.duration);
    const buffer = audioCtx.createBuffer(1, len, sampleRate);
    const data = buffer.getChannelData(0);
    const freqs = recipe.freq;
    const freqStep = freqs.length > 1 ? 1 / (freqs.length - 1) : 1;

    for (let i = 0; i < len; i++) {
        const t = i / sampleRate;
        const progress = i / len;
        const freqIdx = Math.min(Math.floor(progress / freqStep), freqs.length - 2);
        const freqLerp = freqs.length > 1
            ? (progress - freqIdx * freqStep) / freqStep
            : 0;
        const freq = freqs[freqIdx] + (freqs[Math.min(freqIdx + 1, freqs.length - 1)] - freqs[freqIdx]) * freqLerp;

        let sample = 0;
        const phase = t * freq * Math.PI * 2;

        switch (recipe.type) {
            case 'square':
                sample = (Math.sin(phase) > 0 ? 1 : -1) * 0.3;
                break;
            case 'sawtooth':
                sample = ((t * freq % 1) * 2 - 1) * 0.3;
                break;
            case 'triangle':
                sample = (Math.abs(((t * freq % 1) * 2) - 1) * 2 - 1) * 0.3;
                break;
            case 'sine':
            default:
                sample = Math.sin(phase) * 0.3;
                break;
        }

        if (recipe.decay) {
            sample *= 1 - progress;
        }

        data[i] = sample;
    }

    return buffer;
}

export function init() {
    ensureContext();
    initialized = true;
}

export function play(name, volume) {
    if (!initialized) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const buffer = getFromPool(name);
    if (!buffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.value = volume !== undefined ? volume : 1.0;
    source.connect(gain);
    gain.connect(masterGain);
    source.start();
}

export function setMasterVolume(v) {
    if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
}

export function isInitialized() {
    return initialized;
}
