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

function rawUpdate(view, newData) {
    const { data } = view;
    const prevEl = view.el;
    view.el = manipulator.updateElement(view, newData, data);
    if (view.el !== prevEl) {
        view.emitter = new Emitter(view.el);
    }
    Object.assign(data, newData);
}

export function update(view, updates) {
    const { resolvedData, deps } = resolveObject(updates);
    Object.entries(deps).forEach(([k, thing]) => {
        view.cleanups.push(thing.subscribe((action) => {
            rawUpdate(view, {[k]: action.newValue});
        }));
    });
    Object.assign(view.deps, deps);
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
