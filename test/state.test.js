import * as assert from 'node:assert';
import { State, subscribe, IS_STATE, set, trigger } from '../state.js';

describe('State', () => {
    it('should have non-falsy [IS_STATE] property', () => {
        assert.ok(State()[IS_STATE]);
    });
    it('.get() should return initial value after creating and it should be possible to .set() and .get() values', () => {
        const state = State(9);
        assert.strictEqual(state.get(), 9);
        set(state, 19);
        assert.strictEqual(state.get(), 19);
        set(state, 2);
        assert.strictEqual(state.get(), 2);
    });
    describe('.subscribe() should allow for subscribing and', () => {
        it('setting new values via .set() should get listeners called', (done) => {
            const state = State(1);
            const events = [];
            subscribe(state, action => {
                events.push(['first', action]);
            });
            subscribe(state, action => {
                events.push(['second', action]);
            });
            set(state, 'one beer');
            set(state, 'zero beers');
            set(state, '999 beers');
            setTimeout(() => {
                assert.deepStrictEqual(events, [
                    ['first', {type: 'set', oldValue: 1, newValue: 'one beer'}],
                    ['second', {type: 'set', oldValue: 1, newValue: 'one beer'}],
                    ['first', {type: 'set', oldValue: 'one beer', newValue: 'zero beers'}],
                    ['second', {type: 'set', oldValue: 'one beer', newValue: 'zero beers'}],
                    ['first', {type: 'set', oldValue: 'zero beers', newValue: '999 beers'}],
                    ['second', {type: 'set', oldValue: 'zero beers', newValue: '999 beers'}],
                ]);
                done();
            }, 0);
        });
        it('trigger() should get listeners called with passed action', (done) => {
            const state = State();
            const events = [];
            subscribe(state, action => {
                events.push(['first', action]);
            });
            subscribe(state, action => {
                events.push(['second', action]);
            });
            trigger(state, {type: 'foo', a: 1});
            trigger(state, {type: 'bar', a: 2});

            setTimeout(() => {
                assert.deepStrictEqual(events, [
                    ['first', {type: 'foo', a: 1}],
                    ['second', {type: 'foo', a: 1}],
                    ['first', {type: 'bar', a: 2}],
                    ['second', {type: 'bar', a: 2}],
                ]);
                done();
            }, 0);
        });
    })
});
