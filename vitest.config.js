import { defineConfig } from 'vitest/config';

// Guard tests only; the Playwright specs in tests/e2e run separately.
export default defineConfig({
	test: {
		include: ['tests/unit/**/*.test.js']
	}
});
