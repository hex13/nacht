import { Engine, h } from '../framework.js';
import { State } from '../state.js';
import { createDomManipulator } from '../dom.js';
const { create } = new Engine(createDomManipulator(document));

// State represents reactive value
// similar to observables, atoms, signals etc.
// we can embed such State into JSX tree
// and it will be automatically updated after given State object changes
const count = State(0);

// just a helper function
const handleInc = (amount) => () => {
    count.set(count.get() + amount);
};

const root = create(<div style={{padding: '100px'}}>
    <div><span>Count: {count}</span></div>
    <button events={{click: handleInc(-1)}}> - </button>
    <button events={{click: handleInc(1)}}> + </button>
</div>);

// `root` variable now contains a View object which is used for representing one element and its data
// every View object has `el` property which contains its dom element
// and views will update itself automatically where embedded data will change
console.log('this is root view', root);
console.log('notice that many properties of View object are currently not a public API but rather the part of Nacht internals');

// let's add root's element
// views can also have child views so they will be added as well
document.getElementById('app').appendChild(root.el);