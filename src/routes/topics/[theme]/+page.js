import { error } from '@sveltejs/kit';
import { themes } from '$lib/site.js';

/* Validates the topic id and hands the theme record to the page. */
export function load({ params }) {
	const theme = themes.find((t) => t.id === params.theme);
	if (!theme) error(404, `No topic called "${params.theme}"`);
	return { theme };
}

/* One static page per topic — the prerenderer builds /topics/tutorial,
   /topics/opinion, etc., even if nothing links to one yet. */
export function entries() {
	return themes.map((t) => ({ theme: t.id }));
}
