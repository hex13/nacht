export function State(value) {
    let listeners = [];
    return {
        [IS_STATE]: true,
        get: () => value,
        trigger(action) {
            listeners.forEach(listener => {
                listener(action);
            });
        },
        set(newValue) {
            this.trigger({type: 'set', newValue, oldValue: value})
            value = newValue;
        },
        subscribe(listener) {
            listeners.push(listener);
            return () => {
                listeners = listeners.filter(x => x !== listener);
            };
        }
    }
}

export const IS_STATE = Symbol('State');
