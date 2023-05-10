import * as assert from 'node:assert';
import {
    Emitter,
    isEventTarget,
    on,
    once,
} from '../events.js';
import { State, IS_STATE, subscribe } from '../state.js';

it('isEventTarget() should correctly decide on whether something is EventTarget-like', () => {
   assert.strictEqual(isEventTarget({}), false);
   assert.strictEqual(isEventTarget([]), false);
   assert.strictEqual(isEventTarget(true), false);
   assert.strictEqual(isEventTarget(false), false);
   assert.strictEqual(isEventTarget(999), false);
   assert.strictEqual(isEventTarget('beers'), false);
   assert.strictEqual(isEventTarget(State()), false);
   assert.strictEqual(isEventTarget(EventTarget), false);
   assert.strictEqual(isEventTarget(new EventTarget), true);
   assert.strictEqual(isEventTarget({
        addEventListener() {},
        removeEventListener() {},
   }), true);
   assert.strictEqual(isEventTarget({
        addEventListener: true,
        removeEventListener: true,
    }), false);
});

describe('Emitter', () => {
    it('should return different State object for any event type and always the same State object for the same event type', () => {
        const emitter = new Emitter();
        const onBear = emitter.on('bear');
        const onPanda = emitter.on('panda');
        const onBear2 = emitter.on('bear');
        const onPanda2 = emitter.on('panda');

        assert.ok(onBear[IS_STATE]);
        assert.ok(onPanda[IS_STATE]);
        assert.ok(onBear2[IS_STATE]);
        assert.ok(onPanda2[IS_STATE]);

        assert.notStrictEqual(onBear, onPanda);
        assert.strictEqual(onBear, onBear2);
        assert.strictEqual(onPanda, onPanda2);
    });
    it('.emit() should get called listeners of state', (done) => {
        const emitter = new Emitter();
        const events = [];
        subscribe(emitter.on('panda'), e => {
            events.push(['panda', e]);
        });
        subscribe(emitter.on('pannieda'), e => {
            events.push(['pannieda', e]);
        });
        emitter.emit('panda', 2);
        emitter.emit('panda', 3);
        emitter.emit('pannieda', 2);
        setTimeout(() => {
            assert.deepStrictEqual(events, [
                ['panda', {type: 'set', oldValue: undefined, newValue: 2}],
                ['panda', {type: 'set', oldValue: 2, newValue: 3}],
                ['pannieda', {type: 'set', oldValue: undefined, newValue: 2}],
            ]);
            done();
        }, 0);
    });
});


describe('on()', () => {
    let events;
    let handlers;
    beforeEach(() => {
        events = [];
        handlers = {
            say(e) {
                events.push(['say', e?.what]);
            },
            walk(e) {
                events.push(['walk', e?.what]);
            },
            nothing(e) {
                events.push(['nothing', e?.what]);
            }
        };
    });
    it('should add event listeners when calling with EventTarget instance', (done) => {
        const et = new EventTarget();

        on(et, handlers);

        let e;
        e = new Event('say');
        e.what = 'nice things';
        et.dispatchEvent(e);

        e = new Event('walk');
        e.what = 'away';
        et.dispatchEvent(e);

        e = new Event('say');
        e.what = 'hello again';
        et.dispatchEvent(e);
        setTimeout(() => {
            assert.deepStrictEqual(events, [
                ['say', 'nice things'],
                ['walk', 'away'],
                ['say', 'hello again'],
            ]);
            done();
        }, 0);
    });
    it('should add event listeners when calling with object with Emitter inside', (done) => {
        const emitter = new Emitter();
        on({ emitter }, handlers);
        emitter.emit('say', {what: 'hau'});
        emitter.emit('say', {what: 'miau'});
        emitter.emit('walk', {what: 'shoes'});
        setTimeout(() => {
            assert.deepStrictEqual(events, [
                ['say', 'hau'],
                ['say', 'miau'],
                ['walk', 'shoes'],
            ]);
            done();
        }, 0);

    });
})


describe('once()', () => {
    let events;
    let handlers;
    const createTestEvent = (type, what) => {
        const e = new Event(type);
        e.what = what;
        return e;
    };
    beforeEach(() => {
        events = [];
    });
    it('should allow for one-time subscription to single event', (done) => {
        const et = new EventTarget();
        const eventType = 'foo';
        once(et, eventType).then((e) => {
            events.push([e.type, e.what]);
        });
        once(et, 'notEmitted').then(() => {
            events.push(['notEmitted']);
        });

        et.dispatchEvent(createTestEvent(eventType, 19));
        et.dispatchEvent(createTestEvent(eventType, 22319));

        setTimeout(() => {
            assert.deepStrictEqual(events, [
                [eventType, 19],
            ]);
            done();
        }, 0);
    });

    it('should allow for one-time subscription to multiple events and promise should resolve on first one', (done) => {
        const et = new EventTarget();
        const eventType1 = 'bar';
        const eventType2 = 'baz';
        once(et, [eventType1, eventType2]).then((e) => {
            events.push([e.type, e.what]);
        });
        once(et, 'notEmitted').then(() => {
            events.push(['notEmitted']);
        });

        et.dispatchEvent(createTestEvent(eventType2, 'kotek'));
        et.dispatchEvent(createTestEvent(eventType1, 'piesek'));
        et.dispatchEvent(createTestEvent(eventType2, 'wiewiórka'));
        et.dispatchEvent(createTestEvent(eventType1, 'mysz'));

        setTimeout(() => {
            assert.deepStrictEqual(events, [
                [eventType2, 'kotek'],
            ]);
            done();
        }, 0);
    });

});