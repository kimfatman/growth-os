// Minimal zustand-compatible store implementation
// Will be replaced with actual zustand when npm is available
import { useCallback, useSyncExternalStore } from 'react';

export function create(createState) {
  let state;
  const listeners = new Set();

  const getState = () => state;

  const setState = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    if (next !== state) {
      state = Object.assign({}, state, next);
      listeners.forEach((l) => l(state));
    }
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const api = { getState, setState, subscribe };

  state = createState(setState, getState, api);

  const useStore = (selector) => {
    const slice = useSyncExternalStore(
      subscribe,
      useCallback(() => (selector || ((s) => s))(getState()), [selector])
    );
    return slice;
  };

  Object.assign(useStore, api);
  return useStore;
}
