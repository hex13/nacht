export const domManipulator = {
    createElement(type, parent) {
        const el = document.createElement(type);
        if (parent) parent.appendChild(el);
        return el;
    },
    updateElement(el, newData, oldData) {
        Object.entries(newData).forEach(([k, v]) => {
            if (k === 'text' && v !== oldData.text) {
                el.innerText = v;
            }
            if (k === 'value' && v !== oldData.value) {
                el.value = v;
            }
            if (k === 'style') {
                Object.entries(v).forEach(([cssProp, cssVal]) => {
                    el.style[cssProp] = cssVal;
                });
            }
            if (k === 'classes') {
                el.className = v.join(' ');
            }
        });
    },
    isElement(x) {
        return x instanceof Node;
    },
    addEventListener: (el, ...args) => el.addEventListener(...args),
    removeEventListener: (el, ...args) => el.removeEventListener(...args),
};
