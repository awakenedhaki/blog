#!/usr/bin/env node
/**
 * Run every figure through the real prepareSvg pipeline and assert that
 * nothing was destroyed on the way.
 *
 * This exists because of a specific failure that shipped: the SVG sanitiser
 * blocked `data:` URLs wholesale to stop `data:text/html`, which also blanked
 * the `data:image/png` payloads matplotlib uses for `imshow` heatmaps,
 * colorbars and rasterised layers. The surrounding vector axes kept rendering
 * perfectly, so the build stayed green, no test failed, and the only symptom
 * was a broken-image icon inside an otherwise correct figure.
 *
 * That is the dangerous shape: a transform that damages CONTENT while leaving
 * STRUCTURE intact. Nothing else in the toolchain looks at figure output, so
 * these invariants are checked here instead.
 *
 * Runs via the `prebuild` hook.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { listPosts } from './posts.mjs';

// Figures live in each post's folder (src/posts/<slug>/), beside index.md.
const figures = [];
for (const post of await listPosts('src/posts')) {
	for (const name of await readdir(post.dir)) {
		if (name.endsWith('.svg')) figures.push({ name, file: join(post.dir, name) });
	}
}

// Import the real pipeline rather than a copy, so this can never drift from
// what the site actually runs. figures.js uses import.meta.glob (Vite-only),
// so the pure functions are extracted to a temp module.
const source = await readFile('src/lib/figures.js', 'utf8');
// Take everything from the colour map onward, a tail slice rather than a
// range: taking a range once meant silently dropping colorAttrsToStyle and
// normaliseHex.
const start = source.indexOf('export const DEFAULT_COLOR_MAP');
const shim = join(tmpdir(), `figpipe-${process.pid}.mjs`);
await writeFile(shim, source.slice(start).replace(/^export /gm, '') + '\nexport { prepareSvg };');
const { prepareSvg } = await import(`file://${shim}`);

const failures = [];

for (const { name, file } of figures) {
	const raw = await readFile(file, 'utf8');
	const out = prepareSvg(raw);

	const countIn = (s, re) => (s.match(re) ?? []).length;

	// 1. Embedded rasters must survive intact. This is the regression above.
	const rastersBefore = countIn(raw, /data:image\/(png|jpeg|jpg|gif|webp);base64/gi);
	const rastersAfter = countIn(out, /data:image\/(png|jpeg|jpg|gif|webp);base64/gi);
	if (rastersBefore !== rastersAfter) {
		failures.push(`${name}: ${rastersBefore - rastersAfter} embedded image(s) destroyed`);
	}

	// 2. No <image> or <use> should be left pointing at nothing.
	const blanked = countIn(out, /<(image|use)[^>]*(xlink:)?href\s*=\s*["']#["']/gi);
	if (blanked) failures.push(`${name}: ${blanked} element(s) left with a blanked href`);

	// 3. Drawable elements must not be lost wholesale.
	const drawBefore = countIn(raw, /<(path|rect|circle|polyline|polygon|text|image|use|line)\b/gi);
	const drawAfter = countIn(out, /<(path|rect|circle|polyline|polygon|text|image|use|line)\b/gi);
	if (drawAfter < drawBefore) {
		failures.push(`${name}: ${drawBefore - drawAfter} drawable element(s) removed`);
	}

	// 4. var() must never end up in a presentation attribute, where it is
	//    invalid and silently falls back to black.
	if (/(fill|stroke|stop-color)\s*=\s*["']var\(/i.test(out)) {
		failures.push(`${name}: var() left in a presentation attribute (invalid — will render black)`);
	}

	/*
	 * 5. The figure must be themeable by SOME route. There are two, and an
	 *    earlier version of this check only knew about one:
	 *
	 *      a) a chrome colour was remapped to var(--...), or
	 *      b) it contains <text> with no explicit fill, which Figure.svelte's
	 *         `fill: var(--ink)` default colours.
	 *
	 *    Checking only (a) produced a false failure on a t-SNE panel that
	 *    deliberately draws no axis spines: nothing to remap, but its axis
	 *    labels were still going to follow the theme perfectly well. A guard
	 *    that fires on correct output gets switched off, so it has to model
	 *    both routes.
	 *
	 *    What this still catches is the real mistake: a figure exported with
	 *    custom chrome colours the remap table does not know about AND no bare
	 *    text — which renders fixed-colour in both themes.
	 */
	const remapped = out.includes('var(--');
	const bareText = (out.match(/<text(?![^>]*fill)[^>]*>/gi) ?? []).length > 0;
	if (!remapped && !bareText) {
		failures.push(
			`${name}: nothing follows the theme — no chrome colour was remapped and ` +
				`no text relies on the default fill. Check the export used matplotlib/ggplot ` +
				`default chrome colours.`
		);
	}
}

if (failures.length) {
	console.error('\n  Figure pipeline check FAILED\n');
	for (const f of failures) console.error(`    - ${f}`);
	console.error('');
	process.exit(1);
}

console.log(`  figures     : ${figures.length} checked, rasters and chrome intact`);
