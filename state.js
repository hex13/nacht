export function State(value) {
    let listeners = [];
    return {
        [IS_STATE]: true,
        get: () => value,
        trigger(action) {
            listeners.forEach(listener => {
                listener(action);
            });
        },
        set(newValue) {
            this.trigger({type: 'set', newValue, oldValue: value})
            value = newValue;
        },
        subscribe(listener) {
            listeners.push(listener);
            return () => {
                listeners = listeners.filter(x => x !== listener);
            };
        },
    }
}

export function Emitter(eventTarget) {
    const observables = Object.create(null);
    return {
        on(type) {
            let subject = observables[type];
            if (!subject) {
                subject = State();
                eventTarget && eventTarget.addEventListener(type, (e) => {
                    subject.set(e);
                });
            }
            observables[type] = subject;
            return subject;
        }
    }
}

export const IS_STATE = Symbol('State');

// testing
const em = new Emitter();
const click = em.on('click');
click.subscribe(e => {
    console.log("emitter, value", e);
})
const click1 = em.on('click');
click.set(120);
click1.set(460);


const doc = new Emitter(document);

doc.on('click').subscribe(e => {
    console.log("document clicked:", e);
})