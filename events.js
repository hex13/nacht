import { State, subscribe } from './state.js';

export function Emitter(eventTarget) {
    const observables = Object.create(null);
    return {
        on(type) {
            let subject = observables[type];
            if (!subject) {
                subject = State();
                if (eventTarget && type.indexOf('$') != 0) {
                    eventTarget.addEventListener(type, (e) => {
                        subject.set(e);
                    });
                }
            }
            observables[type] = subject;
            return subject;
        },
        emit(type, event) {
            this.on(type).set(event);
        }
    }
}

export function isEventTarget(target) {
    return target && typeof target.addEventListener == 'function' && typeof target.removeEventListener == 'function';
}

export function once(target, eventType) {
    return new Promise(resolve => {
        const handlers = {};
        const eventTypes = Array.isArray(eventType)? eventType : [eventType];
        eventTypes.forEach(type => handlers[type] = resolve);
        on(target, handlers, true);
    });
}

export function on(target, events, once = false) {
    Object.entries(events).forEach(([type, listener]) => {
        if (target.emitter) {
            const dispose = subscribe(target.emitter.on(type), action => {
                listener(action.newValue, target);
                if (once) dispose();
            });
        } else if (isEventTarget(target)) {
            const internalListener = (e) => {
                listener(e, target);
                if (once) {
                    target.removeEventListener(type, internalListener);
                }
            };
            target.addEventListener(type, internalListener);
        } else throw new Error("wrong target for on(): " + String(target));
    });
}
