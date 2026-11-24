/**
 * Shared helpers for the guard tests: reading source files, parsing the two
 * token blocks in app.css, and WCAG contrast arithmetic.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const ROOT = new URL('../../', import.meta.url).pathname;

export function read(path) {
	return readFileSync(join(ROOT, path), 'utf8');
}

/** Every file under `dir` (relative to the repo root) whose name passes `keep`. */
export function walk(dir, keep = () => true) {
	const out = [];
	const visit = (abs) => {
		for (const name of readdirSync(abs)) {
			const full = join(abs, name);
			if (statSync(full).isDirectory()) visit(full);
			else if (keep(full)) out.push(relative(ROOT, full));
		}
	};
	visit(join(ROOT, dir));
	return out.sort();
}

/* ---- token blocks ------------------------------------------------------- */

/** The body of the first rule whose selector is exactly `selector`. */
function block(css, selector) {
	const re = new RegExp(`(^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`);
	const m = re.exec(css);
	if (!m) throw new Error(`app.css has no "${selector}" block`);
	let depth = 1;
	let i = m.index + m[0].length;
	const start = i;
	for (; i < css.length && depth; i++) {
		if (css[i] === '{') depth++;
		else if (css[i] === '}') depth--;
	}
	return css.slice(start, i - 1);
}

function declarations(body) {
	const clean = body.replace(/\/\*[\s\S]*?\*\//g, '');
	const tokens = {};
	for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
	return tokens;
}

/**
 * Tokens in effect in each mode. Dark inherits anything it does not redefine
 * from :root, exactly as the cascade does, and `var()` references resolve.
 */
export function themeTokens(css = read('src/app.css')) {
	const light = declarations(block(css, ':root'));
	const dark = { ...light, ...declarations(block(css, 'html.dark')) };
	return { light: resolveAll(light), dark: resolveAll(dark) };
}

function resolveAll(tokens) {
	const resolve = (value, seen = new Set()) =>
		value.replace(/var\((--[\w-]+)\)/g, (_, name) => {
			if (seen.has(name) || !(name in tokens)) return `var(${name})`;
			return resolve(tokens[name], new Set([...seen, name]));
		});
	return Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k, resolve(v)]));
}

/* ---- contrast ----------------------------------------------------------- */

export function parseHex(value) {
	const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
	if (!m) throw new Error(`not a solid hex colour: "${value}"`);
	let hex = m[1];
	if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
	return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
	const lin = (c) => {
		c /= 255;
		return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a, b) {
	const [hi, lo] = [luminance(parseHex(a)), luminance(parseHex(b))].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/* ---- source stripping --------------------------------------------------- */

/** Remove `{...}` Svelte expressions, counting nested braces and skipping strings. */
export function stripExpressions(src) {
	let out = '';
	let depth = 0;
	let quote = null;
	for (let i = 0; i < src.length; i++) {
		const c = src[i];
		if (depth === 0) {
			if (c === '{') depth = 1;
			else out += c;
			continue;
		}
		if (quote) {
			if (c === '\\') i++;
			else if (c === quote) quote = null;
		} else if (c === '"' || c === "'" || c === '`') quote = c;
		else if (c === '{') depth++;
		else if (c === '}') depth--;
	}
	return out;
}

export function stripBlocks(src) {
	return src
		.replace(/<script[\s\S]*?<\/script>/g, '')
		.replace(/<style[\s\S]*?<\/style>/g, '')
		.replace(/<!--[\s\S]*?-->/g, '');
}

/** Strip JS/CSS comments, leaving `//` inside URLs alone. */
export function stripCodeComments(src) {
	return src
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/(^|[\s;{}(),])\/\/.*$/gm, '$1');
}
