// Global test setup. Runs before every test file.
// Registers @testing-library/jest-dom matchers so tests can call
// expect(el).toBeInTheDocument(), .toHaveTextContent(), etc.
// Also resets the DOM between tests so leaked elements don't
// produce false positives.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
