import { resolveObject } from './resolver.js';
import { View } from './view.js';
import { Emitter, on } from './events.js';
import { merge, setProperty } from './objects.js';
import { IS_STATE, subscribe, State, get } from './state.js';


export function Engine(manipulator) {
    function create(desc, parent) {
        // TODO handling cases of creating views for strings, numbers, observables
        if (typeof desc.type == 'function') {
            return create(desc.type(desc), parent);
        }

        const view = new View(parent);
        view.state = State(desc);
        // TODO tests for cleanups
        view.cleanups.push(subscribe(view.state, action => {
            rawUpdate(view, action.updates || action.newValue);
        }));
        rawUpdate(view, get(view.state));
        return view;
    }

    function rawUpdate(view, newData) {
        const prevEl = view.el;
        if (newData[TYPE] == FRAGMENT_TYPE) {
            view.el = view.parent.el;
        } else {
            view.el = manipulator.updateElement(view.el, view.parent?.el, newData, {});
        }
        if (view.el !== prevEl) {
            view.emitter = new Emitter(view.el);
        }
        if (newData[CHILDREN]) {
            replaceChildren(view, newData[CHILDREN]);
        }
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

    return { create, remove, replaceChildren };
}

export function h(type, props, ...children) {
    return createViewData(type, props, children);
};

export function createViewData(type, props, children) {
    return {
        ...props,
        [TYPE]: type,
        [CHILDREN]: children,
    };
}

export const TYPE = 'type';
export const FRAGMENT_TYPE = '$fragment';
export const CHILDREN = '$$children';