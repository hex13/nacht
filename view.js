const IS_VIEW = Symbol('IS_VIEW');
// represents running instance of component in program
export function View(parent) {
    return {
        [IS_VIEW]: true,
        parent,
        data: {},
        cleanups: [],
        initializers: [],
        el: null,
        emitter: null,
        withCleanup(cleanup) {
            this.cleanups.push(cleanup);
        },
        onCreate(initializer) {
            this.initializers.push(initializer);
        },
    };
}

export const isView = (thing) => thing[IS_VIEW];