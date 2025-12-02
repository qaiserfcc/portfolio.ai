// Setup file for vitest and React Testing Library
import '@testing-library/jest-dom';

// Reduce noise in test logs by filtering known non-actionable warnings from Gemini client
const originalWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
	const message = args.map(a => String(a)).join(' ');
	if (message.includes('Gemini model') || message.includes('Transient error from Gemini API')) {
		// swallow this known noise from simulated provider errors
		return;
	}
	originalWarn(...args as any);
};

// Polyfill for URL if needed or other global shims
// globalThis.URL = globalThis.URL;
