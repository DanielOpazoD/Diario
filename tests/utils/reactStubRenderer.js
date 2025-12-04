export function createReactStub(options = {}) {
  const states = [];
  const setters = [];
  const effects = [];
  let stateIndex = 0;

  const ReactStub = {
    useState(initial) {
      const idx = stateIndex++;
      if (!(idx in states)) {
        states[idx] = typeof initial === 'function' ? initial() : initial;
      }
      const setter = (value) => {
        states[idx] = typeof value === 'function' ? value(states[idx]) : value;
        return states[idx];
      };
      setters[idx] = setter;
      return [states[idx], setter];
    },
    useEffect(fn) {
      effects.push(fn);
    },
    useMemo(fn) {
      return fn();
    },
    useCallback(fn) {
      return fn;
    },
    createElement(type, props, ...children) {
      return { type, props: props || {}, children };
    },
    Fragment: 'Fragment',
    lazy: options.lazy ?? ((factory) => factory()),
    Suspense: options.Suspense ?? (({ children }) => ({ type: 'Suspense', children })),
  };

  return {
    React: ReactStub,
    states,
    setters,
    effects,
    resetRender() {
      stateIndex = 0;
    },
    runEffects() {
      effects.forEach((fn) => fn());
    },
    getState(index) {
      return states[index];
    },
    setState(index, value) {
      return setters[index]?.(value);
    },
  };
}

export function flattenChildren(node) {
  if (!node) return [];
  const stack = Array.isArray(node) ? [...node] : [node];
  const result = [];

  while (stack.length) {
    const current = stack.shift();
    if (!current) continue;
    result.push(current);
    const children = current.children || current.props?.children;
    if (children) {
      if (Array.isArray(children)) {
        stack.push(...children.flat());
      } else {
        stack.push(children);
      }
    }
  }

  return result;
}

export function findInTree(root, predicate) {
  return flattenChildren(root).find(predicate);
}
