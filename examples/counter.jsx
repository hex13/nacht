import { Engine, h } from '../framework.js';
import { State } from '../state.js';
import { createDomManipulator } from '../dom.js';
const { create } = new Engine(createDomManipulator(document));

const count = State(0);

const handleInc = (amount) => () => count.set(count.get() + amount);
const root = create(<div style={{padding: '100px'}}>
    <div><span>Count: {count}</span></div>
    <button events={{click: handleInc(-1)}}> - </button>
    <button events={{click: handleInc(1)}}> + </button>
</div>);

document.getElementById('app').appendChild(root.el);