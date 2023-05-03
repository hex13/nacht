import { IS_STATE, State } from './state.js';

/*
for tree:
const state1 = State(123);
const state2 = State(456);
{a: {foo: state1}, b: state2, c: 1}
should return:
- resolved data:
    {a: {foo: 123}, b: 456, c: 1}
- deps:
    {a: {foo: state1}, b: state2}
*/

export function resolveObject(object, recursive = false) {
    const resolvedTree = {};
    const depTree = {};
    const visit = (node, resolvedObject, deps) => {
        Object.entries(node).forEach(([k, thing]) => {
            if (thing && thing[IS_STATE]) {
                deps[k] = thing;
                resolvedObject[k] = thing.get();
            } else if (recursive && thing && typeof thing == 'object') {
                Object.entries(node).forEach(([k, v]) => {
                    resolvedObject[k] = {};
                    deps[k] = {};
                    visit(v, resolvedObject[k], deps[k]);
                });
            } else {
                resolvedObject[k] = thing;
            }
        });
    }
    visit(object, resolvedTree, depTree);
    return { resolvedData: resolvedTree, deps: depTree };
}

function testResolve(object) {
    console.log("resolve object", object);
    console.log("result", resolveObject(object, true))
    console.log('---');
}


    testResolve({
        a: State(123),
    });

{
    const state1 = State(123);
    const state2 = State(456);
    testResolve({a: {foo: state1}, b: state2, c: 1});
}
