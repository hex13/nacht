import * as assert from 'node:assert';
import { resolveObject } from '../resolver.js';
import { Engine, h, TYPE, FRAGMENT_TYPE, CHILDREN } from '../framework.js';
import { isView } from '../view.js';
import { State, set } from '../state.js';
import { merge } from '../objects.js';

function TestElement(type, props = {}) {
    return {
        isTestElement: true, type, props,
    };
}

const clone = o => JSON.parse(JSON.stringify(o));
const ChildrenMixin = (children) => ({[CHILDREN]: children});
describe('Engine', () => {
    let adapter;
    let engine;
    let events ;
    beforeEach(() => {
        events = [];
        adapter = {
            updateElement(el, parentEl, newData, oldData) {
                events.push([
                    'updateElement',
                    el, parentEl, clone(newData), clone(oldData),
                ]);
                if (!el) {
                    el = {
                        isTestElement: true, type: newData.type, props: {},
                        // TODO
                        // children: []
                    };
                }
                merge(el.props, clone(newData));
                return el;
            },
            removeElement(el) {
                events.push(['removeElement', el]);
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
            ...ChildrenMixin([]),
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
                ...ChildrenMixin([]),
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
        const ChildrenDesc = () => [
            ['child1', {foo: 'hello'}],
            ['child2', {foo: 'hello2'}],
        ];

        const Foo = (props) => {
            events.push(['Foo', props]);
            return [
                'app',
                {abc: 'xyz'},
                ChildrenDesc(),
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
            ...ChildrenMixin(ChildrenDesc()),
            abc: 'xyz',
        });
        assert.deepStrictEqual(componentRoot.el, {
            isTestElement: true,
            [TYPE]: 'app',
            props: {type: 'app', abc: 'xyz', ...ChildrenMixin(ChildrenDesc())},
        });

        assert.strictEqual(componentRoot.children.length, 2);
        assert.deepStrictEqual(componentRoot.children[0].data, {[TYPE]: 'child1', foo: 'hello', ...ChildrenMixin([])});
        assert.deepStrictEqual(componentRoot.children[1].data, {[TYPE]: 'child2', foo: 'hello2', ...ChildrenMixin([]),});
    });

    it('create() should create children views', () => {
        const ChildrenDesc = () => [
            ['foo', {yo: 'hey'}],
            ['bar', {hey: 'yo'}],
        ];
        const root = engine.create([
            'main', {someProp: {abc: 1}}, ChildrenDesc(),
        ]);
        assert.strictEqual(root.children.length, 2);
        assert.deepStrictEqual(root.data, {
            type: 'main',
            ...ChildrenMixin(ChildrenDesc()),
            someProp: {abc: 1},
        });
        assert.deepStrictEqual(root.el, {
            isTestElement: true,
            type: 'main',
            props: {type: 'main', ...ChildrenMixin(ChildrenDesc()), someProp: {abc: 1}},
        });

        assert.deepStrictEqual(root.children[0].data, {
            type: 'foo',
            ...ChildrenMixin([]),
            yo: 'hey',
        });
        assert.deepStrictEqual(root.children[0].el, {
            isTestElement: true,
            type: 'foo',
            props: {type: 'foo', yo: 'hey', ...ChildrenMixin([])},
        });

        assert.deepStrictEqual(root.children[1].data, {
            type: 'bar',
            ...ChildrenMixin([]),
            hey: 'yo',
        });
        assert.deepStrictEqual(root.children[1].el, {
            isTestElement: true,
            type: 'bar',
            props: {type: 'bar', hey: 'yo', ...ChildrenMixin([])},
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
            ...ChildrenMixin([]),
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
    it('replaceChildren() should remove previous children and create new', () => {
        const root = engine.create(['main', {}, [
                ['foo', {}],
                ['bar', {}],
            ]]
        );
        events = [];
        engine.replaceChildren(root, [
            ['baz', {}],
            ['qwe', {}],
            ['rty', {}],
        ]);

        const mainEl =  TestElement('main', {[TYPE]: 'main', ...ChildrenMixin([['foo', {}],['bar', {}]])});

        assert.deepStrictEqual(events, [
            ['removeElement', TestElement('foo', {[TYPE]: 'foo', ...ChildrenMixin([])})],
            ['removeElement', TestElement('bar', {[TYPE]: 'bar', ...ChildrenMixin([])})],
            ['updateElement', null, mainEl, {[TYPE]: 'baz', ...ChildrenMixin([])}, {}],
            ['updateElement', null, mainEl, {[TYPE]: 'qwe', ...ChildrenMixin([])}, {}],
            ['updateElement', null, mainEl, {[TYPE]: 'rty', ...ChildrenMixin([])}, {}],
        ]);
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
        set(color, 'blue');
        set(element, 'water');
        setTimeout(() => {
            const expected = {
                ...ChildrenMixin([]),
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