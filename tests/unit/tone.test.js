/**
 * Tone guard for interface text only: navigation, labels, empty states and
 * errors. Post prose is the author's and is never scanned.
 *
 * Scanned: the markup of src/routes and src/lib/components with scripts,
 * styles, comments and {expressions} removed (plus the values of aria-label,
 * title, alt and placeholder), and the labels and blurbs in site.js.
 */
import { describe, expect, it } from 'vitest';
import { site, browseAxes, series, social, themes } from '../../src/lib/site.js';
import { read, stripBlocks, stripExpressions, walk } from './helpers.js';

const BANNED_WORDS = [
	'easy',
	'hard',
	'game over',
	'lost',
	'fail',
	'streak',
	'missed',
	'only',
	'hurry',
	'limited'
];

/** Visible text and spoken attribute values of one Svelte file. */
export function interfaceText(src) {
	const markup = stripBlocks(src);
	const attrs = [...markup.matchAll(/\b(?:aria-label|title|alt|placeholder)="([^"{]*)"/g)].map(
		(m) => m[1]
	);
	const text = stripExpressions(markup)
		.replace(/<[^>]*>/g, ' ')
		.replace(/&[#\w]+;/g, ' ');
	return [text, ...attrs].join('\n');
}

function siteText() {
	const pick = (items, keys) => items.flatMap((item) => keys.map((k) => item?.[k]));
	return [
		site.name,
		site.tagline,
		site.description,
		...pick(site.nav, ['label']),
		...pick(browseAxes, ['label', 'blurb']),
		...pick(social, ['label']),
		...pick(themes, ['label', 'blurb']),
		...pick(series, ['title', 'blurb'])
	]
		.filter((s) => typeof s === 'string')
		.join('\n');
}

function problems(text) {
	const found = [];
	for (const word of BANNED_WORDS) {
		const re = new RegExp(`\\b${word.replace(' ', '\\s+')}\\b`, 'i');
		const m = re.exec(text);
		if (m) found.push(`"${word}" in …${text.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' ')}…`);
	}
	if (text.includes('!')) found.push('"!"');
	return found;
}

const files = [
	...walk('src/routes', (f) => f.endsWith('.svelte')),
	...walk('src/lib/components', (f) => f.endsWith('.svelte'))
];

describe('interface text', () => {
	it.each(files)('%s', (file) => {
		expect(problems(interfaceText(read(file)))).toEqual([]);
	});

	it('site.js labels and blurbs', () => {
		expect(problems(siteText())).toEqual([]);
	});
});
