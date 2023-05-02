import { create, once, update, emit, remove, State } from './framework.js';

const TitleView = initialTitle => view => {
    let c = 0;
    const title = State(initialTitle);
    console.log("TITLEV", view.el)
    view.onCreate(view => {
        // view.el.style.background = 'red';
    });
    // view.withCleanup(useInterval(() => {
    //     console.log("INTERVAL AAZXX")
    //     title.set("Title #" + (++c));
    // }, 100));

    const classes = State([]);
    view.withCleanup(useInterval(() => {
        classes.set(classes.get().length == 0? ['shadow', 'border'] : []);
        console.log("YYYCB")
    }, 3200), );
    return ['div', {}, [
        ['h1', {classes, text: title}],
        Input(title),
        ['button', {text: 'change title', events: {click() { title.set('Kotek ' + Math.random())} }}],
        ['button', {text: 'remove', events: {click(e, item) { remove(item); } }}],
    ]];
}


setTimeout(() => {
    title.set('Nowy tytuł');
}, 1000);

// if (down) update(item, {text: Math.random()})

let down = false;

const dragEvents = {
    mousedown() {
        down = true;
    },
    mousemove(e, item) {
        if (down) emit(item, {type: '$drag'});
    },
    mouseup() {
        down = false;
    },
};

async function eventHandler(item) {
    while (true) {
        let c = 0;
        await once(item, 'mousedown');
        while (true) {
            const e = once(item, ['mousemove', 'mouseup']);
            if (e.type == 'mouseup') break;
            console.log(c++); 
        }    
    }
}

function useInterval(handler, duration) {
    const interval = setInterval(handler, duration);
    return () => {
        clearInterval(interval);
    };
}


const title = State('Title');

const todos = [
    'posprzątać pokój',
    'obejrzeć serial',
];

const tree = create([
    'div', {}, [
        TitleView('koteczek'),
        // TitleView('piesek'),
        ['div', {}, [
            ['h1', {text: title}],
            Input(title),
            ['button', {text: 'change title', events: {click() { title.set('Kotek ' + Math.random())} }}],            
        ]],
        (item) => {
            const model = State("Hello");
            const style = State({color: "orange"});
            setTimeout(() => {
                // remove(item);
                model.set("Koty są najlepsze!")
                style.set({color: '#f0f'});
            }, 3000);
            return ['h2', {style, text: model}];
        },
        
        ['button', {text: 'pierwszy button', events: {...dragEvents, $drag() { console.log("DRAG!") } }}],
        [
            'button', {
                text: 'drugi button', 
                events: {
                    ...dragEvents, 
                    $drag(e, item) {
                        update(item, {text: Math.random()});
                    },
                }
            },
        ],
        ['button', {text: 'trzeci button', events: {
            async mousedown(e, item) {
                // TODO blocking
                let nextEvent;
                do {
                    nextEvent = await once(document, ['mousemove', 'mouseup']);
                    update(item, {text: Math.random()} )
                } while (nextEvent.type !== 'mouseup');
            }
        }}],
        ['button', {text: 'tylko raz', onceEvents: {click() {alert("KLIKO!")}  }}],
        ['ul', {}, todos.map(todo => ['li', {text: todo}])],
        (item) => {
            const items = [['li', {text: '???'}]];
            setTimeout(() => {
                // item.invoke('push', );
            }, 1000);
            return ['ul', {}, items]
        },
    ],    
]);


document.getElementById('app').appendChild(tree.el);

const texts = ['kotek', 'piesek', 'małpka', 'kaczka', 'wiewiórka'];


setTimeout(() => {
    remove(tree.children[0])
    remove(tree.children[1])
}, 13000);
setInterval(() => {
    title.set(Math.random());
    // update(tree.children[0], {text: texts.shift()});
}, 1000);
/*
{
    type: 'div',
    children: []
}

['div', {text: 'kotek'}, []]
*/

function Input(model) {
    return ['input', {
        value: model, 
        events: {
            input(e, item) { 
                item.deps.value.set(e.target.value);
            } 
        }
    }, ];
}



// proposal: JSX 
/*
function TitleView(initialTitle) {
    const title = State(initialTitle);
    return <div>
        <h1>{title}</h1>
        <input value={title} onInput={(e, item) => item.deps.value.set(e.target.value)}/>
        <button onClick={() => title.set('Kotek ' + Math.random())}>change title</button>
    </div>
}
*/