/**
 * Post registry.
 *
 * Metadata comes from src/lib/posts.data.json, generated at build time by
 * scripts/build-search-index.mjs (run via the `predev` and `prebuild` hooks).
 *
 * Why generated JSON and not `import.meta.glob` over the .md files, which is
 * the idiomatic approach:
 *
 * The glob had to be eager for the listing pages to have titles and dates at
 * render time. An eager glob imports the whole module, and Rollup cannot
 * tree-shake an mdsvex component out of a glob object that is indexed
 * dynamically — naming the export with `import: 'metadata'` does not help.
 * Every compiled article therefore landed in one chunk loaded on EVERY page,
 * and with it every figure SVG inlined by lib/figures.js. Measured before the
 * change: 416KB of JavaScript on the home page, ~226KB of it figure markup for
 * articles nobody had opened, growing with each post published.
 *
 * Reading a JSON file keeps .md out of this graph entirely, so the article
 * component is reachable only through the lazy glob in blog/[slug]/+page.js —
 * making the per-post code splitting real rather than nominal.
 *
 * Cost of this approach, stated plainly: posts.data.json is a build artefact,
 * so adding a .md file is no longer sufficient on its own. `npm run dev` and
 * `npm run build` both regenerate it first, and `npm run sync` triggers it too,
 * so the only way to see a stale list is to bypass all three.
 */
import postsData from './posts.data.json';

const entries = postsData;

/**
 * All published posts, newest first.
 * Each entry: { slug, title, date, theme, tags, description }.
 */
export const posts = entries
	// The generator already excludes drafts; this is a cheap second guard so a
	// hand-edited posts.data.json cannot publish something by accident.
	.filter((post) => post.published !== false)
	.sort((a, b) => new Date(b.date) - new Date(a.date));

/** Unique tags across all published posts, alphabetical, for the filter UI. */
export function allTags() {
	const tags = new Set(posts.flatMap((post) => post.tags ?? []));
	return [...tags].sort();
}

/* ---- date handling --------------------------------------------------------
   Why this is more careful than it looks:

   YAML (not mdsvex) decides the type of a frontmatter value. An UNQUOTED
   `date: 2026-05-25` is a YAML timestamp, so it arrives here as a JavaScript
   `Date` already parsed at UTC midnight. A QUOTED `date: "2026-05-25"` arrives
   as a plain string. Both spellings are natural to write, so both must work.

   Two bugs follow from ignoring this:
   1. `date + 'T00:00:00'` on a Date object stringifies the Date first and
      yields an unparseable value — the source of the site-wide "Invalid Date".
   2. Reading a UTC-midnight Date with LOCAL getters shifts the calendar day
      backwards for anyone west of UTC (2026-05-25T00:00Z is still the 24th in
      Vancouver), which would silently misfile a 01-January post into the
      previous year on the archive page.

   The fix is to normalise everything to a 'YYYY-MM-DD' day string first, then
   re-parse it as LOCAL midnight. From there every getter is safe. */

/** Reduce a frontmatter date (Date or string) to a 'YYYY-MM-DD' day string. */
function toDayString(value) {
	// Date objects came from YAML at UTC midnight: read them back in UTC.
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	// Strings may carry a time component ('2026-05-25T09:00'); keep the day.
	return String(value).slice(0, 10);
}

/** Parse a frontmatter date into a Date at LOCAL midnight (never off by one). */
export function toLocalDate(value) {
	return new Date(toDayString(value) + 'T00:00:00');
}

/** Calendar year a post belongs to, e.g. 2026. */
export function postYear(post) {
	return toLocalDate(post.date).getFullYear();
}

/** Format a frontmatter date for display, e.g. '25 May 2026'. */
export function formatDate(value) {
	return toLocalDate(value).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
}

/** Machine-readable value for <time datetime="…">, e.g. '2026-05-25'. */
export function machineDate(value) {
	return toDayString(value);
}

/* ---- grouping helpers for the browse axes -------------------------------- */

/**
 * Published posts grouped by calendar year, newest year first.
 * Returns: [{ year: 2026, posts: [...] }, { year: 2025, posts: [...] }]
 *
 * `posts` is already sorted newest-first, so insertion order preserves that
 * ordering inside each year — no second sort is needed.
 */
export function postsByYear() {
	const grouped = new Map();

	// Bucket each post under its year, creating the bucket on first sight.
	for (const post of posts) {
		const year = postYear(post);
		if (!grouped.has(year)) grouped.set(year, []);
		grouped.get(year).push(post);
	}

	// Map -> array, newest year first (Map order follows the posts array,
	// which is already descending, but sorting makes that guarantee explicit).
	return [...grouped.entries()]
		.map(([year, yearPosts]) => ({ year, posts: yearPosts }))
		.sort((a, b) => b.year - a.year);
}

/**
 * Every tag with its post count, for the tag index.
 * Sorted by count (descending) then alphabetically, so the most-used tags
 * lead — a flat alphabetical list gives no sense of what the blog is about.
 * Returns: [{ tag: 'r', count: 4 }, …]
 */
export function tagCounts() {
	const counts = new Map();

	// A post contributes one to each of its tags.
	for (const post of posts) {
		for (const tag of post.tags ?? []) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/* ---- series helpers -------------------------------------------------------
   A post opts into a series via frontmatter (`series: <id>`, `part: <n>`).
   Parts are ordered by `part`, falling back to date if numbers are missing. */
import { seriesById } from './site.js';

/** All published posts in a series, in reading order. */
export function seriesPosts(seriesId) {
	return posts
		.filter((post) => post.series === seriesId)
		.sort((a, b) => (a.part ?? 0) - (b.part ?? 0) || new Date(a.date) - new Date(b.date));
}

/**
 * Everything an article needs to render its series navigation:
 * { def, parts, index, prev, next } — or null if the post isn't in a series
 * (or names a series id that isn't registered in site.js, which is the typo
 * signal described there).
 */
export function seriesInfo(post) {
	if (!post?.series) return null;
	const def = seriesById(post.series);
	if (!def) return null;
	const parts = seriesPosts(post.series);
	const index = parts.findIndex((p) => p.slug === post.slug);
	if (index < 0) return null;
	return {
		def,
		parts,
		index,
		prev: parts[index - 1] ?? null,
		next: parts[index + 1] ?? null
	};
}
