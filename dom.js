export const domManipulator = {
    document,
    createElement(type, parent) {
        const el = this.document.createElement(type);
        if (parent) parent.appendChild(el);
        return el;
    },
    updateElement({ el, parent }, newData, oldData) {
        if (!el) {
            el = this.createElement(newData.type, parent);
        }
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
        return el;
    },
    removeElement(el) {
        el.remove();
    },
    isElement(x) {
        return x instanceof Node;
    },
    addEventListener: (el, ...args) => el.addEventListener(...args),
    removeEventListener: (el, ...args) => el.removeEventListener(...args),
};
