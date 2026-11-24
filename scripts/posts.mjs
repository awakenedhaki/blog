/**
 * The post layout, in one place for every script.
 *
 * Each post is a folder named by its slug (the slug is the URL), holding the
 * post itself as index.md and everything it shows beside it:
 *
 *   content/posts/<slug>/index.md
 *   content/posts/<slug>/<figure>.svg
 *
 * src/posts mirrors that layout (npm run sync copies it), so the same helpers
 * read either.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const POST_FILE = 'index.md';

/** Every post in `dir`: { slug, dir, file }, sorted by slug. */
export async function listPosts(dir) {
	if (!existsSync(dir)) return [];
	const entries = await readdir(dir, { withFileTypes: true });
	return entries
		.filter((e) => e.isDirectory() && existsSync(join(dir, e.name, POST_FILE)))
		.map((e) => ({ slug: e.name, dir: join(dir, e.name), file: join(dir, e.name, POST_FILE) }))
		.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Pull one scalar frontmatter field out of raw markdown, without a YAML parser. */
export function frontmatterField(raw, field) {
	const block = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!block) return undefined;
	return block[1].match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1].trim();
}

/** Is the post at `file` a draft (published: false)? */
export async function isDraft(file) {
	return frontmatterField(await readFile(file, 'utf8'), 'published') === 'false';
}
