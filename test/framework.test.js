import * as assert from 'node:assert';
import { resolveObject } from '../resolver.js';
import { Engine, h, TYPE, FRAGMENT_TYPE } from '../framework.js';
import { isView } from '../view.js';
import { State } from '../state.js';
import { merge } from '../objects.js';


describe('Engine', () => {
    let adapter;
    let engine;
    beforeEach(() => {
        adapter = {
            updateElement(el, parentEl, newData, oldData) {
                if (!el) {
                    el = {
                        isTestElement: true, type: newData.type, props: {},
                        // TODO
                        // children: []
                    };
                }
                merge(el.props, structuredClone(newData));
                return el;
            },
            removeElement() {

            }
        };
        engine = new Engine(adapter);
    });
    it('create() should create single view', () => {
        const someState = State(91);
        const createTestProps = () => ({
            foo: 'wchodzi kotek',
            abc: {
                def: someState,
            }
        });
        const props = createTestProps();
        const root = engine.create(['div', props]);
        assert.ok(isView(root));
        assert.deepStrictEqual(root.data, {
            type: 'div',
            foo: 'wchodzi kotek',
            abc: {
                def: 91,
            }
        });
        assert.deepStrictEqual(root.el, {
            isTestElement: true,
            type: 'div',
            props: {
                type: 'div',
                foo: 'wchodzi kotek',
                abc: {
                    def: 91,
                }
            }
        });
        assert.notStrictEqual(root.data, props);
        assert.notStrictEqual(root.data.abc, props.abc);
        assert.deepStrictEqual(props, createTestProps());
    });
    it('create() should accept function as a type and handle it as component', () => {
        const events = [];
        const Foo = (props) => {
            events.push(['Foo', props]);
            return [
                'app',
                {abc: 'xyz'},
                [
                    ['child1', {foo: 'hello'}],
                    ['child2', {foo: 'hello2'}],
                ],
            ]
        };
        const root = engine.create([
            'main', {}, [
                [Foo, {year: 2023}]
            ]
        ]);
        assert.ok(isView(root));
        assert.deepStrictEqual(events, [
            ['Foo', {year: 2023}],
        ]);

        assert.strictEqual(root.children.length, 1);
        const componentRoot = root.children[0];
        assert.strictEqual(componentRoot.parent, root);

        assert.deepStrictEqual(componentRoot.data, {
            [TYPE]: 'app',
            abc: 'xyz',
        });
        assert.deepStrictEqual(componentRoot.el, {
            isTestElement: true,
            [TYPE]: 'app',
            props: {type: 'app', abc: 'xyz'},
        });

        assert.strictEqual(componentRoot.children.length, 2);
        assert.deepStrictEqual(componentRoot.children[0].data, {[TYPE]: 'child1', foo: 'hello'});
        assert.deepStrictEqual(componentRoot.children[1].data, {[TYPE]: 'child2', foo: 'hello2'});
    });

    it('create() should create children views', () => {
        const root = engine.create([
            'main', {someProp: {abc: 1}}, [
                ['foo', {yo: 'hey'}],
                ['bar', {hey: 'yo'}],
            ]
        ]);
        assert.strictEqual(root.children.length, 2);
        assert.deepStrictEqual(root.data, {
            type: 'main',
            someProp: {abc: 1},
        });
        assert.deepStrictEqual(root.el, {
            isTestElement: true,
            type: 'main',
            props: {type: 'main', someProp: {abc: 1}},
        });

        assert.deepStrictEqual(root.children[0].data, {
            type: 'foo',
            yo: 'hey',
        });
        assert.deepStrictEqual(root.children[0].el, {
            isTestElement: true,
            type: 'foo',
            props: {type: 'foo', yo: 'hey'},
        });

        assert.deepStrictEqual(root.children[1].data, {
            type: 'bar',
            hey: 'yo',
        });
        assert.deepStrictEqual(root.children[1].el, {
            isTestElement: true,
            type: 'bar',
            props: {type: 'bar', hey: 'yo'},
        });
    });
    it('create() should create fragment', () => {
        const root = engine.create([
            'main', {}, [
                ['foo1', {}],
                [FRAGMENT_TYPE, {}, [
                    ['foo2', {}],
                    ['foo3', {}],
                ]],
            ]
        ]);
        const fragment = root.children[1];
        assert.deepStrictEqual(fragment.data[TYPE], FRAGMENT_TYPE);
        assert.strictEqual(fragment.el, root.el);
    });
    it('update() should update view', () => {
        const root = engine.create([
            'app', {
                foo: 'whoa',
                counter: 10,
                some: {
                    deep: 101,
                    tief: 100,
                },
                reactive: State('red'),
            },
        ]);
        engine.update(root, {
            bar: 'baz',
            counter: 11,
            some: {
                tief: 102,
            }
        });
        const expected = {
            type: 'app',
            foo: 'whoa',
            counter: 11,
            bar: 'baz',
            reactive: 'red',
            some: {
                deep: 101,
                tief: 102,
            }
        };
        assert.deepStrictEqual(root.data, expected);
        assert.deepStrictEqual(root.el, {
            isTestElement: true,
            type: 'app',
            props: expected,
        });
    });

    it('should be reactive and automatically update view when State value changes', (done) => {
        const color = State('red');
        const element = State('fire');
        const root = engine.create([
            'app', {
                foo: 'whoa',
                color,
                nested: {
                    element,
                }
            },
        ]);
        color.set('blue');
        element.set('water');
        setTimeout(() => {
            const expected = {
                type: 'app',
                foo: 'whoa',
                color: 'blue',
                nested: {
                    element: 'water',
                },
            };
            assert.deepStrictEqual(root.data, expected);
            assert.deepStrictEqual(root.el, {
                isTestElement: true,
                type: 'app',
                props: expected,
            });
            done();
        }, 0);
    });

});

describe('h()', () => {
    it('single element without props', () => {
        assert.deepStrictEqual(h('foo'), ['foo', {}, []]);
    });
    it('single element with props', () => {
        assert.deepStrictEqual(h('foo', {a: 1, foo: {bar: 2}}), ['foo', {a: 1, foo: {bar: 2}}, []]);
    });
    it('element with children', () => {
        const tree = h(
            'foo', {a: 1},
            h('child1'),
            h('child2', {}, h('grandchild')),
        );
        assert.deepStrictEqual(tree, [
            'foo', {a: 1}, [
                ['child1', {}, []],
                ['child2', {}, [['grandchild', {}, []]]],
            ]
        ]);
    });
    it('string as child', () => {
        assert.deepStrictEqual(h('foo', {baz: 3}, "kotek"), ['foo', {baz: 3}, [['span', {text: 'kotek'}]]]);
    });
    it('State as child', () => {
        const state = State(10);
        const tree = h('foo', {baz: 3}, state);
        assert.deepStrictEqual(tree, ['foo', {baz: 3}, [['span', {text: state}]]]);
        assert.strictEqual(tree[2][0][1].text, state);
    });
});