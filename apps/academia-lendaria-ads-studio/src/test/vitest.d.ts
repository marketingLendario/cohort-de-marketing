// Tipos dos matchers do @testing-library/jest-dom para o Vitest.
// O registro em runtime é feito em src/test/setup.ts (expect.extend(matchers)).
// Aqui estendemos a interface Assertion do Vitest para o tsc conhecer
// toBeInTheDocument/toHaveTextContent/etc. (corrige TS2339 no typecheck).
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// Module augmentation: as interfaces precisam estender com corpo vazio (padrão
// canônico vitest + jest-dom). O no-empty-object-type é desabilitado aqui por
// isso ser augmentation, não um tipo "vazio" real.
declare module 'vitest' {
  /* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
  interface Assertion<T = any> extends TestingLibraryMatchers<unknown, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, unknown> {}
  /* eslint-enable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
}
