import { IS_STATE } from './state.js';

// represents running instance of component in program 
function View() {
    return {
        customListeners: {},
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

const domManipulator = {
    createElement(type, parent) {
        const el = document.createElement(type);
        if (parent) parent.appendChild(el);
        return el;
    },
    updateElement(el, newData, oldData) {
        Object.entries(newData).forEach(([k, v]) => {
            if (k === 'text' && v !== oldData.text) {
                el.innerText = v;
            }
            if (k === 'value' && v !== oldData.value) {
                el.value = v;
            }
            if (k === 'style') {
                Object.entries(v).forEach(([cssProp, cssVal]) => {
                    el.style[cssProp] = cssVal;
                });
            }
            if (k === 'classes') {
                el.className = v.join(' ');
            }
        });
    },
    isElement(x) {
        return x instanceof Node;
    },
    addEventListener: (el, ...args) => el.addEventListener(...args),
    removeEventListener: (el, ...args) => el.removeEventListener(...args),
};

const manipulator = domManipulator;


function resolveUpdates(updates) {
    const newData = {};
    const deps = {};
    Object.entries(updates).forEach(([k, thing]) => {
        if (thing && thing[IS_STATE]) {
            deps[k] = thing;
            newData[k] = thing.get();
        } else {
            newData[k] = thing;
        }
    });
    return { newData, deps };
}


function rawUpdate(view, newData) {
    const { data, el } = view;
    manipulator.updateElement(el, newData, data);
    Object.assign(data, newData);
}


function cleanup(view) {
    // emit(item, {type: '$cleanup'});
    view.cleanups.forEach(cleanup => cleanup());
    view.children.forEach(child => cleanup(child));
}

export function create(desc, parent) {
    const view = new View();
    const [type, data, children = []] = typeof desc == 'function'? desc(view) : desc;
    const el = manipulator.createElement(type, parent);
    Object.assign(view, {
        el, 
        data: {},
        children: children.map(child => create(child, el)),
    });

    update(view, data);
    if (data.events) on(view, data.events);
    if (data.onceEvents) on(view, data.onceEvents, true);
    view.initializers.forEach(initializer => initializer(view));
    return view;
}

let id = 0;
export function update(view, updates) {
    const { newData, deps } = resolveUpdates(updates);
    Object.entries(deps).forEach(([k, thing]) => {
        const _id = id++;
        view.cleanups.push(thing.subscribe((action) => {
            console.log("SUBSCRIBE", action);
            rawUpdate(view, {[k]: action.newValue});
        }));
        // console.log("SUBSKRYPCAJ!", item.cleanups.length, )
    });
    Object.assign(view.deps, deps);
    rawUpdate(view, newData);
}

export function remove(view) {
    console.log("REMOVE, CLEANUPS", view.cleanups.slice())
    cleanup(view);
    view.el.remove();
}


export function once(target, eventType) {
    return new Promise(resolve => {
        const handlers = {};
        const eventTypes = Array.isArray(eventType)? eventType : [eventType];
        eventTypes.forEach(type => handlers[type] = resolve);
        on(target, handlers, true);
    });
}

function on(target, events, once = false) {
    if (manipulator.isElement(target)) {
        return on({el: target}, events, once);
    } else Object.entries(events).forEach(([type, listener]) => {
        if (type.indexOf('$') == 0) {
            (target.customListeners[type] || (target.customListeners[type] = [])).push(listener);
        } else {
            const internalListener = (e) => {
                listener(e, target);
                if (once) {
                    manipulator.removeEventListener(target.el, type, internalListener);
                }
            };
            manipulator.addEventListener(target.el, type, internalListener);
        }
    });
}

export function emit(view, event) {
    const listeners = view.customListeners[event.type] || [];
    listeners.forEach(listener => {
        listener(event, view);
    })
}


