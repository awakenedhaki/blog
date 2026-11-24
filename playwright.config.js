import { defineConfig } from '@playwright/test';

// Tests run against the production build, served the way GitHub Pages serves
// it (scripts/serve-pages.mjs), so they see exactly what ships. `npm test`
// builds first; run `npm run build` yourself before `npx playwright test`.
export default defineConfig({
	testDir: 'tests/e2e',
	snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
	fullyParallel: true,
	reporter: [['list']],
	use: {
		baseURL: 'http://localhost:4173',
		browserName: 'chromium',
		reducedMotion: 'reduce'
	},
	expect: {
		toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.001 }
	},
	webServer: {
		command: 'node scripts/serve-pages.mjs',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI
	}
});
