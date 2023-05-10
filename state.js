export function State(value) {
    return {
        listeners: [],
        value,
        [IS_STATE]: true,
    };
}

export const IS_STATE = Symbol('State');

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
