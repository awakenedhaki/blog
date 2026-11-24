/**
 * figure-imports.js: each <Figure> gets its files from the post's own folder.
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { figureImports } from '../../figure-imports.js';

const folder = mkdtempSync(join(tmpdir(), 'post-'));
for (const f of ['plot.svg', 'photo.png', 'photo-dark.png']) writeFileSync(join(folder, f), '');
const run = (content) => figureImports().markup({ content, filename: join(folder, 'index.md') });

describe('figure imports', () => {
	it('imports an SVG as markup from the post folder', () => {
		const { code } = run('<script>\n</script>\n<Figure src="plot.svg" alt="A > B, in words" />');
		expect(code).toContain("import __figure_0 from './plot.svg?raw';");
		expect(code).toContain('<Figure markup={__figure_0} src="plot.svg" alt="A > B, in words" />');
	});

	it('imports a raster and its dark variant as URLs', () => {
		const { code } = run('<Figure\n  src="photo.png"\n  darkSrc="photo-dark.png"\n  alt="x" />');
		expect(code).toMatch(/import __figure_\d from '\.\/photo\.png\?url';/);
		expect(code).toMatch(/import __figure_\d from '\.\/photo-dark\.png\?url';/);
		expect(code).toMatch(/<Figure url=\{__figure_\d\} darkUrl=\{__figure_\d\}/);
		expect(code.startsWith('<script>')).toBe(true); // a script block is added when there is none
	});

	it('leaves a missing file alone, so Figure shows its notice', () => {
		expect(run('<script></script><Figure src="missing.svg" alt="x" />')).toBeUndefined();
	});

	it('ignores escaped examples inside code samples', () => {
		expect(run('<pre>&lt;Figure src="plot.svg" /&gt;</pre>')).toBeUndefined();
	});

	it('uses the instance script, not the module one mdsvex adds', () => {
		const { code } = run('<script context="module">export const metadata = {};</script>\n<script>\n</script>\n<Figure src="plot.svg" alt="x" />');
		expect(code).toMatch(/<script context="module">export const metadata = \{\};<\/script>\n<script>\n\timport __figure_0/);
	});
});
