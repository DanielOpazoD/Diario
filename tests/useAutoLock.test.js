import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
import { loadTsModule } from './utils/loadTsModule.js';

const shallowEqualDeps = (nextDeps, prevDeps) => {
  if (!prevDeps || !nextDeps) return false;
  if (nextDeps.length !== prevDeps.length) return false;
  return nextDeps.every((dep, index) => Object.is(dep, prevDeps[index]));
};

const createHookRenderer = () => {
  const realRequire = createRequire(import.meta.url);
  const stateStore = [];
  const refStore = [];
  const callbackStore = [];
  const callbackDepsStore = [];
  const effectDepsStore = [];
  const cleanupStore = [];
  let currentProps;
  let hookResult;
  let hook;
  let effectsForRender = [];
  let stateIndex = 0;
  let refIndex = 0;
  let callbackIndex = 0;
  let effectIndex = 0;

  const rerender = (props = currentProps) => render(props);

  const ReactMock = {
    useState(initial) {
      const index = stateIndex++;
      if (!(index in stateStore)) {
        stateStore[index] = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (value) => {
        const nextValue = typeof value === 'function' ? value(stateStore[index]) : value;
        if (!Object.is(stateStore[index], nextValue)) {
          stateStore[index] = nextValue;
          rerender();
        }
      };
      return [stateStore[index], setState];
    },
    useRef(initial) {
      const index = refIndex++;
      if (!(index in refStore)) {
        refStore[index] = { current: initial };
      }
      return refStore[index];
    },
    useCallback(fn, deps = []) {
      const index = callbackIndex++;
      const prevDeps = callbackDepsStore[index];
      if (!prevDeps || !shallowEqualDeps(deps, prevDeps)) {
        callbackStore[index] = fn;
        callbackDepsStore[index] = deps;
      }
      return callbackStore[index];
    },
    useEffect(effect, deps) {
      const index = effectIndex++;
      effectsForRender.push({ effect, deps, index });
    },
  };

  const runEffects = () => {
    effectsForRender.forEach(({ effect, deps, index }) => {
      const prevDeps = effectDepsStore[index];
      if (!prevDeps || !shallowEqualDeps(deps, prevDeps)) {
        cleanupStore[index]?.();
        const cleanup = effect();
        cleanupStore[index] = typeof cleanup === 'function' ? cleanup : undefined;
        effectDepsStore[index] = deps;
      }
    });
  };

  const render = (props) => {
    currentProps = props;
    stateIndex = 0;
    refIndex = 0;
    callbackIndex = 0;
    effectIndex = 0;
    effectsForRender = [];
    hookResult = hook(props);
    runEffects();
    return hookResult;
  };

  const unmount = () => {
    cleanupStore.forEach((cleanup) => cleanup?.());
    cleanupStore.length = 0;
  };

  const hookModule = loadTsModule('shared/hooks/useAutoLock.ts', {
    require: (specifier) => (specifier === 'react' ? ReactMock : realRequire(specifier)),
    window: globalThis.window,
  });
  hook = hookModule.default;

  return {
    render,
    rerender,
    unmount,
    get result() {
      return hookResult;
    },
  };
};

test('locks after inactivity and calls callbacks', (t) => {
  t.mock.timers.enable({ now: 0 });
  globalThis.window = new EventTarget();
  const events = [];
  const renderer = createHookRenderer();

  renderer.render({
    securityPin: '1234',
    autoLockMinutes: 1,
    onLock: () => events.push('lock'),
    onUnlock: () => events.push('unlock'),
  });

  assert.equal(renderer.result.isLocked, true);

  assert.equal(renderer.result.handleUnlock('1234'), true);
  assert.equal(renderer.result.isLocked, false);
  assert.deepEqual(events, ['unlock']);

  t.mock.timers.tick(61_000);
  assert.equal(renderer.result.isLocked, true);
  assert.deepEqual(events, ['unlock', 'lock']);

  renderer.unmount();
});

test('activity resets the auto-lock timer', (t) => {
  t.mock.timers.enable({ now: 0 });
  const activityWindow = new EventTarget();
  globalThis.window = activityWindow;
  const renderer = createHookRenderer();

  renderer.render({
    securityPin: '1234',
    autoLockMinutes: 1,
    onLock: () => {},
    onUnlock: () => {},
  });

  renderer.result.handleUnlock('1234');
  assert.equal(renderer.result.isLocked, false);

  t.mock.timers.tick(30_000);
  activityWindow.dispatchEvent(new Event('mousemove'));
  t.mock.timers.tick(40_000);
  assert.equal(renderer.result.isLocked, false);

  t.mock.timers.tick(21_000);
  assert.equal(renderer.result.isLocked, true);

  renderer.unmount();
});
