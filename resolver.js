import { IS_STATE, State, get } from './state.js';

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

export function resolveObject(object) {
    const resolvedTree = {};
    const deps = [];
    const visit = (node, resolvedObject, path) => {
        Object.entries(node).forEach(([k, thing]) => {
            resolvedObject[k] = thing;
            if (thing && thing[IS_STATE]) {
                deps.push([path.concat(k), thing]);
                resolvedObject[k] = get(thing);
            } else if (thing && typeof thing == 'object' && !Array.isArray(thing)) {
                resolvedObject[k] = {};
                visit(thing, resolvedObject[k], path.concat(k));
            }
        });
    }
    visit(object, resolvedTree, []);
    return { resolvedData: resolvedTree, deps };
}
