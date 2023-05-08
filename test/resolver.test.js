import * as assert from 'node:assert';
import { resolveObject } from '../resolver.js';
import { State } from '../state.js';

describe('resolveObject()', () => {
    it('should resolve flat object with primitive values', () => {
        const resolved = resolveObject({ax: 123, b: "kotek"});
        const expected = {
            resolvedData: {ax: 123, b: "kotek"},
            deps: [],
        };
        assert.deepStrictEqual(resolved, expected);
    });
    it('should resolve nested object with primitive values', () => {
        const createInitialObject = () => ({
            ax: 123,
            b: "kotek",
            nested: {
                oho: 90,
            },
        });
        const resolved = resolveObject(createInitialObject());
        const expected = {
            resolvedData: createInitialObject(),
            deps: [],
        };
        assert.deepStrictEqual(resolved, expected);
    });
    it('should resolve flat object with primitive values and State objects', () => {
        const counter = State(100);
        const counter2 = State(101);
        const resolved = resolveObject({desc: "this is counter", counter, counter2});
        const expected = {
            resolvedData: {desc: "this is counter", counter: 100, counter2: 101},
            deps: [
                [['counter'], counter],
                [['counter2'], counter2],
            ]
        };
        assert.deepStrictEqual(resolved, expected);
        assert.strictEqual(resolved.deps[0][1], counter);
        assert.strictEqual(resolved.deps[1][1], counter2);
    });
    it('should resolve nested object with primitive values and State objects', () => {
        const season = State('spring');
        const month = State('May');
        const createInitialObject = () => ({
            foo: 'bar',
            time: {
                season,
                month,
            },
        });
        const resolved = resolveObject(createInitialObject());
        const expected = {
            resolvedData: {
                foo: 'bar',
                time: {
                    season: 'spring',
                    month: 'May',
                }
            },
            deps: [
                [['time', 'season'], season],
                [['time', 'month'], month],
            ],
        };
        assert.deepStrictEqual(resolved, expected);
        assert.strictEqual(resolved.deps[0][1], season);
        assert.strictEqual(resolved.deps[1][1], month);
    });
});