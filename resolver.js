import { IS_STATE } from './state.js';

export function resolveObject(object) {
    const resolvedData = {};
    const deps = {};
    Object.entries(object).forEach(([k, thing]) => {
        if (thing && thing[IS_STATE]) {
            deps[k] = thing;
            resolvedData[k] = thing.get();
        } else {
            resolvedData[k] = thing;
        }
    });
    return { resolvedData, deps };
}
