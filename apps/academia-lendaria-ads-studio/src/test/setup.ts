// Setup dos testes de componente (jsdom): matchers do jest-dom + cleanup.
//
// Registramos os matchers via `expect.extend(matchers)` usando o `expect` do
// Vitest diretamente (em vez de `import '@testing-library/jest-dom/vitest'`).
// Num monorepo com hoisting, o side-effect de `/vitest` estende um `expect`/chai
// que pode não ser a mesma instância usada pelos testes (jest-dom resolve no
// node_modules da raiz, chai no node_modules do app) — o resultado é
// "Invalid Chai property: toBeInTheDocument". Estendendo o `expect` importado do
// Vitest garantimos a mesma instância de chai dos testes.
import * as matchers from '@testing-library/jest-dom/matchers';
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';

expect.extend(matchers);

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();

  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => data.set(key, value),
  };
}

// Node 25 can expose an incomplete localStorage before jsdom initializes.
if (typeof globalThis.localStorage?.clear !== 'function') {
  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
}

afterEach(() => {
  cleanup();
});
