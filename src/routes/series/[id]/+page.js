import { error } from '@sveltejs/kit';
import { series, seriesById } from '$lib/site.js';

/* Validates the series id and hands its record to the page. */
export function load({ params }) {
	const def = seriesById(params.id);
	if (!def) error(404, `No series called "${params.id}"`);
	return { def };
}

/* One prerendered page per registered series. */
export function entries() {
	return series.map((s) => ({ id: s.id }));
}
