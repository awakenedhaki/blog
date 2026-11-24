#!/usr/bin/env node
/**
 * Show the state of every post and flag problems before they reach a build.
 *
 *   npm run status
 *
 * Checks the things that fail late and confusingly:
 *   - missing or empty `description` (used for listings and meta tags)
 *   - a `theme` that is not in the site's controlled vocabulary
 *   - a series reference with no matching series definition
 *   - duplicate slugs across the content directory
 *   - unquoted dates (a YAML timestamp rather than a string)
 *   - a <Figure> whose file is not in the post's folder
 *
 * Read-only: it reports, it never edits.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listPosts } from './posts.mjs';

const CONTENT_DIR = process.env.BLOG_CONTENT_DIR ?? 'content';
const POSTS_DIR = existsSync(join(CONTENT_DIR, 'posts')) ? join(CONTENT_DIR, 'posts') : 'src/posts';

// Read the controlled vocabularies straight from site.js so this script can
// never drift out of sync with what the site actually accepts.
const siteSource = await readFile('src/lib/site.js', 'utf8');
const themeIds = [...siteSource.matchAll(/id:\s*"([a-z-]+)",\s*\n\s*label:/g)].map((m) => m[1]);
const seriesIds = [...siteSource.matchAll(/id:\s*"([a-z0-9-]+)",\s*\n\s*title:/g)].map((m) => m[1]);

function frontmatter(raw) {
	const block = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!block) return {};
	const out = {};
	for (const line of block[1].split(/\r?\n/)) {
		const m = line.match(/^([a-z_]+):\s*(.*)$/);
		if (m) out[m[1]] = m[2].trim();
	}
	return out;
}

const posts = await listPosts(POSTS_DIR);
const seen = new Map();
const rows = [];

for (const { slug, dir, file } of posts) {
	const raw = await readFile(file, 'utf8');
	const fm = frontmatter(raw);
	const problems = [];

	if (!fm.description) problems.push('no description');
	if (fm.theme && themeIds.length && !themeIds.includes(fm.theme)) {
		problems.push(`unknown theme "${fm.theme}"`);
	}
	if (fm.series && seriesIds.length && !seriesIds.includes(fm.series)) {
		problems.push(`unknown series "${fm.series}"`);
	}
	if (fm.date && !/^["']/.test(fm.date)) problems.push('unquoted date (YAML parses it as a Date)');
	for (const [, attr, name] of raw.matchAll(/\b(src|darkSrc)="([^"]+)"/g)) {
		if (/\.(svg|png|jpe?g|webp)$/.test(name) && !existsSync(join(dir, name))) {
			problems.push(`${attr} "${name}" is not in ${dir}`);
		}
	}
	if (seen.has(slug)) problems.push('duplicate slug');
	seen.set(slug, true);

	// Rough reading signal: words outside fenced code.
	const words = raw.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;

	rows.push({
		slug,
		status: fm.published === 'false' ? 'draft' : 'published',
		date: (fm.date ?? '').replace(/["']/g, ''),
		words,
		problems
	});
}

rows.sort((a, b) => (a.status === b.status ? b.date.localeCompare(a.date) : a.status === 'draft' ? -1 : 1));

console.log(`\n  ${POSTS_DIR} — ${rows.length} post(s)\n`);
for (const row of rows) {
	const mark = row.status === 'draft' ? '○' : '●';
	console.log(`  ${mark} ${row.status.padEnd(9)} ${row.date.padEnd(11)} ${String(row.words).padStart(5)}w  ${row.slug}`);
	for (const p of row.problems) console.log(`      ! ${p}`);
}

const drafts = rows.filter((r) => r.status === 'draft').length;
const issues = rows.reduce((n, r) => n + r.problems.length, 0);
console.log(`\n  ${rows.length - drafts} published, ${drafts} draft(s), ${issues} issue(s)\n`);
