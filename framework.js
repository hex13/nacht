import { resolveObject } from './resolver.js';
import { View } from './view.js';
import { Emitter, on } from './events.js';
import { merge, set } from './objects.js';
import { IS_STATE, subscribe } from './state.js';


export function Engine(manipulator) {
    function create(desc, parent) {
        const view = new View(parent);
        const [type, descData, children = []] = desc;
        const data = {...descData};
        if (typeof type == 'function') {
            return create(type(descData), parent);
        }
        data.type = type;
        data[CHILDREN] = data[CHILDREN] || children;
        update(view, data);
        if (data.events) on(view, data.events);
        if (data.onceEvents) on(view, data.onceEvents, true);
        view.initializers.forEach(initializer => initializer(view));
        return view;
    }

    function rawUpdate(view, newData) {
        const { data } = view;
        const prevEl = view.el;
        if (newData[TYPE] == FRAGMENT_TYPE) {
            view.el = view.parent.el;
        } else {
            view.el = manipulator.updateElement(view.el, view.parent?.el, newData, data);
        }
        if (view.el !== prevEl) {
            view.emitter = new Emitter(view.el);
        }
        if (newData[CHILDREN]) {
            replaceChildren(view, newData[CHILDREN]);
        }
        merge(data, newData);
    }


    function update(view, updates) {
        const { resolvedData, deps } = resolveObject(updates);
        deps.forEach(([path, state]) => {
            view.cleanups.push(subscribe(state, action => {
                const updates = {};
                set(updates, path, action.newValue);
                rawUpdate(view, updates);
            }));
        });
        rawUpdate(view, resolvedData);
    }

    function replaceChildren(view, newChildren) {
        if (view.children) {
            view.children.forEach(child => {
                remove(child);
            });
        }
        view.children = newChildren.map(child => create(child, view))
    }

    function cleanup(view) {
        view.cleanups.forEach(cleanup => cleanup());
        view.children.forEach(child => cleanup(child));
    }

    function remove(view) {
        cleanup(view);
        manipulator.removeElement(view.el);
    }

    return { create, update, remove, replaceChildren };
}

export function h(type, props, ...children) {
    return [
        type,
        props || {},
        children.map(x => {
            if (typeof x == 'number' || typeof x == 'string' || (x && x[IS_STATE])) return ['span', {text: x}];
            return x;
        })
    ];
};

export const TYPE = 'type';
export const FRAGMENT_TYPE = '$fragment';
export const CHILDREN = '$$children';