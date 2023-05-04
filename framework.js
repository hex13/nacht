import { resolveObject } from './resolver.js';
import { domManipulator as manipulator } from './dom.js';
import { View } from './view.js';
import { Emitter, on } from './events.js';

export function create(desc, parent) {
    const view = new View(parent);
    const [type, data, children = []] = typeof desc == 'function'? desc(view) : desc;
    data.type = type;

    update(view, data);

    view.children = resolveObject({children}).resolvedData.children.map(child => create(child, view.el));

    if (data.events) on(view, data.events);
    if (data.onceEvents) on(view, data.onceEvents, true);
    view.initializers.forEach(initializer => initializer(view));
    return view;
}

function merge(dest, src) {
    for (const k in src) {
        if (src[k] && typeof src[k] == 'object') {
            if (!dest[k]) dest[k] = {};
            merge(dest[k], src[k])
        } else {
            dest[k] = src[k];
        }
    }
}

function rawUpdate(view, newData) {
    const { data } = view;
    const prevEl = view.el;
    view.el = manipulator.updateElement(view, newData, data);
    if (view.el !== prevEl) {
        view.emitter = new Emitter(view.el);
    }
    merge(data, newData);
}

function set(o, path, v) {
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

export function update(view, updates) {
    const { resolvedData, deps } = resolveObject(updates, true);
    const visit = (node, path) => {
        Object.entries(node).forEach(([k, thing]) => {
            if (thing.subscribe) {
                view.cleanups.push(thing.subscribe((action) => {
                    const updates = {};
                    set(updates, path.concat(k), action.newValue);
                    rawUpdate(view, updates);
                }));
            } else if (thing && typeof thing == 'object') {
                visit(thing, path.concat(k));
            }
        });
    };
    visit(deps, []);
    merge(view.deps, deps);
    rawUpdate(view, resolvedData);
}

function cleanup(view) {
    view.cleanups.forEach(cleanup => cleanup());
    view.children.forEach(child => cleanup(child));
}

export function remove(view) {
    cleanup(view);
    manipulator.removeElement(view.el);
}
