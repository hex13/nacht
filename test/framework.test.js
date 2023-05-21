import * as assert from 'node:assert';
import { resolveObject } from '../resolver.js';
import { Engine, h, TYPE, FRAGMENT_TYPE, CHILDREN, createViewData } from '../framework.js';
import { isView } from '../view.js';
import { State, set, get, merge as mergeState } from '../state.js';
import { merge } from '../objects.js';

function TestElement(type, props = {}) {
    return {
        isTestElement: true, type, props,
    };
}

const clone = o => JSON.parse(JSON.stringify(o));
const test_getViewData = view => {
    return get(view.state)
}

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
        const root = engine.create(h('div', props));
        assert.ok(isView(root));
        const viewData =  createViewData('div', {
            foo: 'wchodzi kotek',
            abc: {
                def: 91,
            }
        }, []);
        const rootData = test_getViewData(root);
        assert.deepStrictEqual(rootData, viewData);
        assert.deepStrictEqual(root.el, {
            isTestElement: true,
            type: 'div',
            props: viewData,
        });
        assert.notStrictEqual(rootData, props);
        assert.notStrictEqual(rootData.abc, props.abc);
        assert.deepStrictEqual(props, createTestProps());
    });
    it('create() should accept function as a type and handle it as component', () => {
        const events = [];
        const Children = () => [
            h('child1', {foo: 'hello'}),
            h('child2', {foo: 'hello2'}),
        ];

        const Foo = (props) => {
            events.push(['Foo', props]);
            return h('app', {abc: 'xyz'}, ...Children());
        };
        const root = engine.create(
            h('main', {}, h(Foo, {year: 2023}))
        );
        assert.ok(isView(root));
        assert.deepStrictEqual(events, [
            ['Foo', createViewData(Foo, {year: 2023}, [])],
        ]);

        assert.strictEqual(root.children.length, 1);
        const componentRoot = root.children[0];
        assert.strictEqual(componentRoot.parent, root);

        const viewData = createViewData('app', {abc: 'xyz'}, Children());
        assert.deepStrictEqual(test_getViewData(componentRoot), viewData);
        assert.deepStrictEqual(componentRoot.el, {
            isTestElement: true,
            [TYPE]: 'app',
            props: viewData,
        });

        assert.strictEqual(componentRoot.children.length, 2);
        assert.deepStrictEqual(test_getViewData(componentRoot.children[0]), createViewData('child1', {foo: 'hello'}, []));
        assert.deepStrictEqual(test_getViewData(componentRoot.children[1]), createViewData('child2', {foo: 'hello2'}, []));
    });

    it('create() should create children views', () => {
        const Children = () => [
            h('foo', {yo: 'hey'}),
            h('bar', {hey: 'yo'}),
        ];
        const root = engine.create(
            h('main', {someProp: {abc: 1}}, ...Children()),
        );
        assert.strictEqual(root.children.length, 2);
        assert.deepStrictEqual(test_getViewData(root), createViewData('main', {someProp: {abc: 1}}, Children()));
        assert.deepStrictEqual(root.el, {
            isTestElement: true,
            type: 'main',
            props: createViewData('main', {someProp: {abc: 1}}, Children()),
        });

        let viewData = createViewData('foo', {yo: 'hey'}, []);
        assert.deepStrictEqual(test_getViewData(root.children[0]), viewData);
        assert.deepStrictEqual(root.children[0].el, {
            isTestElement: true,
            type: 'foo',
            props: viewData,
        });

        viewData = createViewData('bar', {hey: 'yo'}, []);
        assert.deepStrictEqual(test_getViewData(root.children[1]), viewData);
        assert.deepStrictEqual(root.children[1].el, {
            isTestElement: true,
            type: 'bar',
            props: viewData,
        });
    });
    it('create() should create fragment', () => {
        const root = engine.create(
            h('main', {},
                h('foo1', {}),
                h(FRAGMENT_TYPE, {},
                    ['foo2', {}],
                    ['foo3', {}],
                ),
            ),
        );
        const fragment = root.children[1];
        assert.deepStrictEqual(test_getViewData(fragment)[TYPE], FRAGMENT_TYPE);
        assert.strictEqual(fragment.children.length, 2);
        assert.strictEqual(fragment.el, root.el);
    });
    it('update() should update view', () => {
        const root = engine.create(h(
            'app', {
                foo: 'whoa',
                counter: 10,
                some: {
                    deep: 101,
                    tief: 100,
                },
                reactive: State('red'),
            },
        ));
        mergeState(root.state, {
            bar: 'baz',
            counter: 11,
            some: {
                tief: 102,
            }
        });
        const expected = createViewData('app', {
            foo: 'whoa',
            counter: 11,
            bar: 'baz',
            reactive: 'red',
            some: {
                deep: 101,
                tief: 102,
            }
        }, []);
        assert.deepStrictEqual(test_getViewData(root), expected);
        assert.deepStrictEqual(root.el, {
            isTestElement: true,
            type: 'app',
            props: expected,
        });
    });
    it('replaceChildren() should remove previous children and create new', () => {
        const root = engine.create(h('main', {},
                h('foo', {}),
                h('bar', {}),
            )
        );
        events = [];
        engine.replaceChildren(root, [
            h('baz', {}),
            h('qwe', {}),
            h('rty', {}),
        ]);

        const mainEl =  TestElement('main', createViewData('main', {}, [h('foo', {}),h('bar', {})]));

        assert.deepStrictEqual(events, [
            ['removeElement', TestElement('foo', createViewData('foo', {}, []))],
            ['removeElement', TestElement('bar', createViewData('bar', {}, []))],
            ['updateElement', null, mainEl, createViewData('baz', {}, []), {}],
            ['updateElement', null, mainEl, createViewData('qwe', {}, []), {}],
            ['updateElement', null, mainEl, createViewData('rty', {}, []), {}],
        ]);
    });

    it('should be reactive and automatically update view when State value changes', (done) => {
        const color = State('red');
        const element = State('fire');
        const root = engine.create(
            h('app', {
                foo: 'whoa',
                color,
                nested: {
                    element,
                }
            })
        );
        set(color, 'blue');
        set(element, 'water');
        setTimeout(() => {
            const expected = createViewData('app', {
                foo: 'whoa',
                color: 'blue',
                nested: {
                    element: 'water',
                },
            }, []);
            assert.deepStrictEqual(test_getViewData(root), expected);
            assert.deepStrictEqual(root.el, {
                isTestElement: true,
                type: 'app',
                props: expected,
            });
            done();
        }, 0);
    });

});

describe.skip('h()', () => {
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