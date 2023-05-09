export function set(o, path, v) {
    const [k, ...rest] = path;
    if (path.length == 1) {
        o[k] = v;
    } else {
        if (o[k] == undefined) {
            o[k] = {};
        }
        set(o[k], rest, v);
    }
}

export function merge(dest, src) {
    for (const k in src) {
        if (src[k] && typeof src[k] == 'object' && !Array.isArray(src[k])) {
            if (!dest[k]) dest[k] = {};
            merge(dest[k], src[k])
        } else {
            dest[k] = src[k];
        }
    }
}
