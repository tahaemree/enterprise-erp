// Jest-dom or testing-library setups can go here.
// For now, this just prevents the "Cannot find module vitest.setup.ts" error.
import { vi } from 'vitest'

// Mock standard browser/node globals if needed
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
})
