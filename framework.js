import { resolveObject } from './resolver.js';
import { View } from './view.js';
import { Emitter, on } from './events.js';
import { merge, set } from './objects.js';
import { IS_STATE } from './state.js';


export function Engine(manipulator) {
    function create(desc, parent) {
        const view = new View(parent);
        const [type, descData, children = []] = typeof desc == 'function'? desc(view) : desc;
        const data = {...descData};
        data.type = type;

        update(view, data);

        view.children = resolveObject({children}).resolvedData.children.map(child => create(child, view));

        if (data.events) on(view, data.events);
        if (data.onceEvents) on(view, data.onceEvents, true);
        view.initializers.forEach(initializer => initializer(view));
        return view;
    }

    function rawUpdate(view, newData) {
        const { data } = view;
        const prevEl = view.el;
        view.el = manipulator.updateElement(view.el, view.parent?.el, newData, data);
        if (view.el !== prevEl) {
            view.emitter = new Emitter(view.el);
        }
        merge(data, newData);
    }


    function update(view, updates) {
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

    function remove(view) {
        cleanup(view);
        manipulator.removeElement(view.el);
    }

    return { create, update, remove, h };
}

export function h(type, props, ...children) {
    return [
        type,
        props || {},
        children.map(x => {
            if (typeof x == 'string' || (x && x[IS_STATE])) return ['span', {text: x}];
            return x;
        })
    ];
};
