import * as assert from 'node:assert';
import { State, subscribe, IS_STATE, get, set, trigger, update } from '../state.js';
import { merge } from '../objects.js';
import { merge as mergeState } from '../state.js';

describe('State', () => {
    it('should have non-falsy [IS_STATE] property', () => {
        assert.ok(State()[IS_STATE]);
    });
    it('get() should return initial *primitive* value after creating and it should be possible to set() and get() values', () => {
        const state = State(9);
        assert.strictEqual(get(state), 9);
        set(state, 19);
        assert.strictEqual(get(state), 19);
        set(state, 2);
        assert.strictEqual(get(state), 2);
    });
    it('get() should return initial *object* value after creating and it should be possible to set() and get() values', () => {
        const state = State({x: 1, y: 10});
        assert.deepEqual(get(state), {x: 1, y: 10});
        set(state, {x: 2, z: 19});
        assert.deepEqual(get(state), {x: 2, z: 19});
        set(state, {x: 3})
        assert.deepEqual(get(state), {x: 3});
    });
    it('update() should update object with handler', (done) => {
        const state = State({x: 12, y: 101});
        subscribe(state, (action) => {
            assert.deepEqual(get(state), {x: 102, y: 101});
            assert.deepEqual(action.newValue, {x: 102, y: 101});
            done();
        });

        update(state, d => {
            d.x = d.y + 1;
        });
    });
    it('state merge() should merge updates into state in a way that is consistent with objectUtils.merge()', (done) => {
        const createData = () => ({
            player: {
                name: 'Alice',
                points: 191,
            }
        });
        const state = State(createData());
        mergeState(state, {player: {points: 200}});
        const expected = createData();
        merge(expected, {player: {points: 200}});
        setTimeout(() => {
            assert.deepEqual(get(state), expected);
            done();
        }, 0);
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
