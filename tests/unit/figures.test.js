/**
 * WP6: no vector mark in any figure is under 3:1 against its tile, in
 * either mode.
 *
 * Each SVG goes through the same prepareSvg the site uses, then every fill
 * and stroke is resolved through the mode's tokens and blended over the tile
 * by its opacity, since a 60%-opaque bar reads as the blend, not the colour.
 *
 * Not marks, so not checked: colours that resolve to the tile, page or
 * divider (backgrounds, point edges, gridlines); fills and strokes under 35%
 * opacity (shaded bands behind the data); and the ON_RASTER colours below,
 * which sit on an embedded image rather than on the tile. Raster parts
 * themselves are images and are left as they are.
 *
 * Opacity is counted on purpose: a mark drawn at 60% reads as its blend with
 * the tile. Whether translucent marks should be held to 3:1 is open (see the
 * WP6 audit); this test takes the strict reading until that is decided.
 */
import { describe, expect, it } from 'vitest';
import { prepareSvg } from '../../src/lib/figures.js';
import { contrast, parseHex, read, themeTokens, walk } from './helpers.js';

const WASH = 0.35;
const themes = themeTokens();

// Value labels printed over the heatmap's cells, light on dark cells and
// dark on light ones.
const ON_RASTER = { 'iris-correlation.svg': ['#fafafa', '#101010'] };

function toHex(rgb) {
	return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

function blend(fg, bg, alpha) {
	const [f, b] = [parseHex(fg), parseHex(bg)];
	return toHex(f.map((c, i) => c * alpha + b[i] * (1 - alpha)));
}

/** Every fill/stroke in the figure with its effective opacity. */
export function marks(svg) {
	const found = [];
	for (const [, style] of svg.matchAll(/\sstyle="([^"]*)"/g)) {
		const decl = Object.fromEntries(
			style
				.split(';')
				.map((d) => d.split(':').map((s) => s.trim()))
				.filter(([k, v]) => k && v)
		);
		const opacity = Number(decl.opacity ?? 1);
		for (const prop of ['fill', 'stroke']) {
			const value = decl[prop];
			if (!value || value === 'none' || value.startsWith('url(')) continue;
			found.push({ prop, value, alpha: opacity * Number(decl[`${prop}-opacity`] ?? 1) });
		}
	}
	return found;
}

/** Marks under 3:1 in one mode, as readable strings. */
export function faintMarks(svg, tokens, skip = []) {
	const background = new Set(['--tile', '--page', '--divider'].map((n) => tokens[n]?.toLowerCase()));
	const tile = tokens['--tile'];
	const resolve = (v) => v.replace(/^var\((--[\w-]+)\)$/, (_, n) => tokens[n] ?? v).toLowerCase();
	const faint = new Map();
	for (const { prop, value, alpha } of marks(svg)) {
		const colour = resolve(value);
		if (background.has(colour) || skip.includes(colour)) continue;
		if (alpha < WASH) continue;
		const ratio = contrast(blend(colour, tile, alpha), tile);
		if (ratio < 3) faint.set(`${prop} ${value} @${alpha}`, ratio.toFixed(2));
	}
	return [...faint].map(([k, r]) => `${k}: ${r}`);
}

// Every figure, in its post's folder: [file name, path].
const figures = walk('src/posts', (f) => f.endsWith('.svg')).map((f) => [f.split('/').pop(), f]);

describe.each(['light', 'dark'])('%s mode', (mode) => {
	it.each(figures)('%s has no vector mark under 3:1', (name, file) => {
		const svg = prepareSvg(read(file), {}, name);
		expect(faintMarks(svg, themes[mode], ON_RASTER[name])).toEqual([]);
	});
});

describe('figure names (WP9)', () => {
	const svg = '<svg width="10" height="10" role="presentation" viewBox="0 0 10 10"><rect/></svg>';

	it('puts role="img" and the alt text on the root <svg>, escaped', () => {
		const out = prepareSvg(svg, {}, 'x.svg', 'A "quoted" <alt> & more');
		expect(out).toMatch(/^<svg[^>]* role="img" aria-label="A &quot;quoted&quot; &lt;alt> &amp; more">/);
		expect(out.match(/role=/g)).toHaveLength(1);
		expect(out).not.toMatch(/\s(width|height)="/);
	});
});
