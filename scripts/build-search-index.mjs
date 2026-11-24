#!/usr/bin/env node
/**
 * Emit static/search-index.json from the published posts.
 *
 * Replaces an eager `import.meta.glob(..., { query: '?raw' })` inside
 * lib/search.js. That glob had Vite inline every post body as a string literal
 * into a shared chunk, which then loaded on EVERY page view — 316KB at six
 * posts, and linear in post count from there (~5MB at a hundred). A reader
 * opening one article downloaded the full text of the entire blog.
 *
 * Two further problems it fixed along the way:
 *   - the index chunk was in the critical path for people who never search;
 *   - draft bodies could not be kept out of it, because the filtering ran at
 *     runtime while the inlining happened at build time.
 *
 * Generating a JSON file instead means the payload is fetched once, on demand,
 * only when someone actually opens search — and cached thereafter.
 *
 * Run automatically by the `prebuild` hook, after the drafts check.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { listPosts } from './posts.mjs';

const POSTS_DIR = 'src/posts';
const OUT = 'static/search-index.json';
const POSTS_DATA = 'src/lib/posts.data.json';

function frontmatter(raw) {
	const block = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!block) return {};
	const out = {};
	for (const line of block[1].split(/\r?\n/)) {
		const m = line.match(/^([a-z_]+):\s*(.*)$/);
		if (!m) continue;
		let value = m[2].trim().replace(/^["']|["']$/g, '');
		// tags: [a, b, c]
		if (/^\[.*\]$/.test(value)) {
			value = value.slice(1, -1).split(',').map((t) => t.trim()).filter(Boolean);
		}
		out[m[1]] = value;
	}
	return out;
}

/** Reduce raw Markdown to plain searchable text. Code inside fences is KEPT —
 *  searching for `groupby` or `summarise` is what readers of a coding blog
 *  actually want. */
function toPlainText(raw) {
	return raw
		.replace(/^---[\s\S]*?---/, ' ') // frontmatter (indexed separately as fields)
		.replace(/<script[\s\S]*?<\/script>/g, ' ') // component imports
		.replace(/<[^>]+>/g, ' ') // component tags (Callout, CodeTabs, ...)
		.replace(/```[a-z]*/g, ' ') // fence markers, not the code itself
		.replace(/[#>*_`|[\]()]/g, ' ') // markdown punctuation
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}

const posts = await listPosts(POSTS_DIR);
const index = [];

for (const { slug, file } of posts) {
	const raw = await readFile(file, 'utf8');
	const fm = frontmatter(raw);

	// Belt and braces: check-drafts.mjs already refuses to build with drafts
	// present, but the index generator should never be the thing that leaks one.
	if (String(fm.published) === 'false') continue;

	index.push({
		slug,
		title: fm.title ?? slug,
		date: String(fm.date ?? ''),
		theme: fm.theme ?? '',
		description: fm.description ?? '',
		_title: (fm.title ?? '').toLowerCase(),
		_tags: (Array.isArray(fm.tags) ? fm.tags : []).map((t) => t.toLowerCase()),
		_theme: (fm.theme ?? '').toLowerCase(),
		_description: (fm.description ?? '').toLowerCase(),
		_body: toPlainText(raw)
	});
}

index.sort((a, b) => b.date.localeCompare(a.date));

await mkdir('static', { recursive: true });
await writeFile(OUT, JSON.stringify(index));

/*
 * Second output: the listing metadata.
 *
 * lib/posts.js used to build this with an eager `import.meta.glob` over the
 * .md files. Even with `import: 'metadata'` naming the export, Rollup cannot
 * tree-shake an mdsvex component out of a glob object it references
 * dynamically — so every compiled article, and through it every inlined figure
 * SVG, ended up in a chunk loaded on EVERY page. Measured: 416KB of JavaScript
 * on the home page, of which ~226KB was figure markup for articles the reader
 * had not opened.
 *
 * Emitting plain JSON means .md files never enter the listing graph at all.
 * The article component is then reachable only through the lazy glob in
 * blog/[slug]/+page.js, which is what makes the per-post code splitting real
 * rather than nominal.
 */
const listing = index.map(({ _title, _tags, _theme, _description, _body, ...rest }) => rest);

// Re-read the full frontmatter for listing fields the search index drops.
const full = [];
for (const { slug, file } of posts) {
	const raw = await readFile(file, 'utf8');
	const fm = frontmatter(raw);
	if (String(fm.published) === 'false') continue;
	full.push({
		slug,
		title: fm.title ?? slug,
		date: String(fm.date ?? ''),
		theme: fm.theme ?? '',
		tags: Array.isArray(fm.tags) ? fm.tags : [],
		description: fm.description ?? '',
		...(fm.series ? { series: fm.series, part: Number(fm.part ?? 1) } : {}),
		...(fm.toc === 'false' ? { toc: false } : {})
	});
}
full.sort((a, b) => b.date.localeCompare(a.date));
await writeFile(POSTS_DATA, JSON.stringify(full, null, '\t') + '\n');

const bytes = JSON.stringify(index).length;
console.log(`  search index: ${index.length} post(s), ${(bytes / 1024).toFixed(0)}KB -> ${OUT} (fetched on demand, not bundled)`);
console.log(`  post index  : ${full.length} post(s) -> ${POSTS_DATA} (keeps .md out of the listing bundle)`);
