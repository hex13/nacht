import * as assert from 'node:assert';
import { setProperty, merge } from '../objects.js';

describe('setProperty()', () => {
    it('should set existing properties', () => {
        const create = () => ({
            a: {
                b: 2
            },
            c: 0,
            d: 13,
        });
        const a = create();
        const b = create();
        setProperty(a, ['c'], 13);
        setProperty(a, ['a', 'b'], 3);
        b.c = 13;
        b.a.b = 3;
        assert.deepStrictEqual(a, b);
    });
    it('should set non-existing properties', () => {
        const a = {};
        const b = {foo: {bar: 9}};
        setProperty(a, ['foo', 'bar'], 9);
        assert.deepStrictEqual(a, b);
    });
});

describe('merge()', () => {
    it('should merge to existing properties', () => {
        const create = () => ({
            some: {
                deep: {
                    object: {
                        value: 99
                    }
                }
            },
            value: 44,
        });

        const a = create();
        const b = create();
        merge(a, {
            some: {
                deep: {
                    object: {
                        value: 98
                    }
                }
            }
        });
        b.some.deep.object.value = 98;
        assert.deepStrictEqual(a, b);
    });

    it('should merge to non-existing properties', () => {
        const a = {};
        const b = {
            some: {
                deep: {
                    object: {
                        value: 98
                    }
                }
            }
        };
        merge(a, {
            some: {
                deep: {
                    object: {
                        value: 98
                    }
                }
            }
        });
        assert.deepStrictEqual(a, b);
    });
    it('should merge arrays correctly', () => {
        const a = {};
        const B = () => ({
            b: [1, 2],
            c: {
                d: [],
            }
        });
        const b = B();
        merge(a, b)
        assert.deepStrictEqual(a, b);
    });
})