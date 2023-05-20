import * as objectUtils from './objects.js';
import { resolveObject } from './resolver.js';

export function State(initialState) {
    let root;
    if (initialState && typeof initialState == 'object') {
        const { resolvedData, deps } = resolveObject(initialState);
        root = resolvedData;
        deps.forEach(([path, state]) => {
            subscribe(state, PropertySetterListener(root, path));
        });
    } else {
        root = initialState;
    }

    return {
        listeners: [],
        value: root,
        [IS_STATE]: true,
    };
}

export const IS_STATE = Symbol('State');

export const PropertySetterListener = (root, path) => {
    return (action) => objectUtils.setProperty(root, path, action.newValue);
}

export const subscribe = (state, listener) => {
    state.listeners.push(listener);
    return () => {
        state.listeners = state.listeners.filter(x => x !== listener);
    };
};

export const get = (state) => {
    return state.value;
};

export const set = (state, newValue) => {
    trigger(state, {type: 'set', newValue, oldValue: state.value});
    state.value = newValue;
};

export const trigger = (state, action) => {
    state.listeners.forEach(listener => {
        listener(action);
    });
};

export const update = (state, handler) => {
    handler(get(state));
    const newValue = get(state);
    trigger(state, {type: 'set', newValue, oldValue: state.value});
}

export const merge = (state, props) => {
    update(state, d => {
        objectUtils.merge(d, props);
    })
};
