Reactive framework for GUI (WIP)
==

Main idea is that you can embed reactive values into JSX and it will update automatically.

```jsx

// reactive value
const count = State(0);
//...
<div>{count}</div>;

// in event handlers:

count.set(count.get() + 1);

```

Look into `examples` folder for more detailed example.
