
// represents running instance of component in program
export function View(parent) {
    return {
        parent,
        data: {},
        deps: {},
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
