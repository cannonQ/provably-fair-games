/**
 * Jest Setup File
 *
 * This file runs before all tests.
 * It sets up testing utilities and custom matchers.
 */

// Import Jest DOM custom matchers
import '@testing-library/jest-dom';

// Suppress console warnings during tests (optional - keeps test output clean)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
