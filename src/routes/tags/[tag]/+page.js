import { error } from '@sveltejs/kit';
import { allTags } from '$lib/posts.js';

/* Validates the tag and passes it through; unknown tags 404. */
export function load({ params }) {
	if (!allTags().includes(params.tag)) error(404, `No posts tagged "#${params.tag}"`);
	return { tag: params.tag };
}

/* One static page per tag in use. Tags appear here automatically the first
   time a published post uses them — no registration step. */
export function entries() {
	return allTags().map((tag) => ({ tag }));
}
