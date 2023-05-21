const IS_VIEW = Symbol('IS_VIEW');
// represents running instance of component in program
export function View(parent) {
    return {
        [IS_VIEW]: true,
        parent,
        cleanups: [],
        el: null,
        emitter: null,
        withCleanup(cleanup) {
            this.cleanups.push(cleanup);
        },
    };
}

export const isView = (thing) => thing[IS_VIEW];