import * as assert from 'node:assert';
import { resolveObject } from '../resolver.js';
import { Engine } from '../framework.js';
import { isView } from '../view.js';
import { State } from '../state.js';


describe('Engine', () => {
    it('create() should create View', () => {
        const adapter = {
            updateElement(view) {
                console.log("VVV", view);
            },
            removeElement() {

            }
        }
        const engine = new Engine(adapter);

        const someState = State(91);
        const createTestProps = () => ({
            foo: "wchodzi kotek",
            abc: {
                def: someState,
            }
        });
        const props = createTestProps();
        const root = engine.create(['div', props]);
        assert.ok(isView(root));
        assert.deepStrictEqual(root.data, {
            type: 'div',
            foo: "wchodzi kotek",
            abc: {
                def: 91,
            }
        });
        assert.notStrictEqual(root.data, props);
        assert.notStrictEqual(root.data.abc, props.abc);
        assert.deepStrictEqual(props, createTestProps());
    });
});