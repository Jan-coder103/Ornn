const assets = new Map();

export function set(key, asset) {
    assets.set(key, asset);
}

export function get(key) {
    return assets.get(key);
}

export function has(key) {
    return assets.has(key);
}

export function loadAll(entries) {
    const promises = entries.map(([key, path]) => {
        if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => { assets.set(key, img); resolve(); };
                img.onerror = () => { console.warn(`AssetStore: failed to load "${key}" from "${path}"`); resolve(); };
                img.src = path;
            });
        }
        return Promise.resolve();
    });
    return Promise.all(promises);
}
