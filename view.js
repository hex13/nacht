
// represents running instance of component in program
export function View(parent) {
    return {
        parent,
        customListeners: {},
        data: {},
        deps: {},
        cleanups: [],
        initializers: [],
        withCleanup(cleanup) {
            this.cleanups.push(cleanup);
        },
        onCreate(initializer) {
            this.initializers.push(initializer);
        }
    };
}
