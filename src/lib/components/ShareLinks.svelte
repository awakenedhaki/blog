<script>
	/**
	 * ShareLinks — a row of share icons for an article.
	 *
	 * The links are plain prefilled anchors to each platform's share intent —
	 * no SDKs, no trackers, and they're baked into the static HTML at build
	 * time using `site.url`, so sharing works even before JS loads. The icons
	 * are hand-drawn strokes in the site's own line style (rather than pasted
	 * brand assets), which keeps the icon row visually consistent with the
	 * rest of the design.
	 *
	 * Props: `title` (the article title), `path` (e.g. "/blog/my-post").
	 */
	import { site } from '$lib/site.js';

	let { title, path } = $props();

	const url = $derived(`${site.url}${path}`);
	const e = encodeURIComponent;

	// Copy-link feedback: "Link copied" for a moment, in a live region that is
	// always in the page so screen readers announce the change politely.
	let copied = $state(false);
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			// Clipboard API can be unavailable (http, old browsers) — degrade to a prompt.
			window.prompt('Copy this link:', url);
		}
	}
</script>

<div class="share">
	<span class="meta"><span aria-hidden="true">#</span> share</span>

	<a href={`https://x.com/intent/post?text=${e(title)}&url=${e(url)}`} target="_blank" rel="noopener" aria-label="Share on X" title="Share on X">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.6 3H21l-7.3 8.4L22 21h-6.6l-4.7-6.1L5.3 21H2l7.8-9L2.4 3H9l4.3 5.6L17.6 3z"/></svg>
	</a>

	<a href={`https://bsky.app/intent/compose?text=${e(`${title} ${url}`)}`} target="_blank" rel="noopener" aria-label="Share on Bluesky" title="Share on Bluesky">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 11C10.5 7.5 7 4.5 4.5 5.5c-2 .8-1.6 4.3.5 5.8-2.4 1-2.2 3.8.3 4.5 2.4.7 5-1 6.7-4.3 1.7 3.3 4.3 5 6.7 4.3 2.5-.7 2.7-3.5.3-4.5 2.1-1.5 2.5-5 .5-5.8C17 4.5 13.5 7.5 12 11z"/></svg>
	</a>

	<a href={`https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`} target="_blank" rel="noopener" aria-label="Share on LinkedIn" title="Share on LinkedIn">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
			<rect x="3.5" y="3.5" width="17" height="17" rx="3" />
			<circle cx="8.2" cy="8.4" r="0.4" fill="currentColor" stroke-width="1.6" />
			<path d="M8.2 11.2v5.6M12.2 16.8v-5.6m0 2.2c0-1.3 1-2.2 2.1-2.2s1.9.9 1.9 2.1v3.5" />
		</svg>
	</a>

	<a href={`https://www.reddit.com/submit?url=${e(url)}&title=${e(title)}`} target="_blank" rel="noopener" aria-label="Share on Reddit" title="Share on Reddit">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
			<circle cx="12" cy="14" r="6.3" />
			<circle cx="9.6" cy="13.6" r="0.4" fill="currentColor" stroke-width="1.6" />
			<circle cx="14.4" cy="13.6" r="0.4" fill="currentColor" stroke-width="1.6" />
			<path d="M9.6 16.6c1.5 1.1 3.3 1.1 4.8 0M12.3 7.8l.9-3.6 3.4 1" />
			<circle cx="17.6" cy="5.5" r="1.1" />
		</svg>
	</a>

	<a href={`mailto:?subject=${e(title)}&body=${e(url)}`} aria-label="Share by email" title="Share by email">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
		</svg>
	</a>

	<button type="button" onclick={copyLink} aria-label="Copy link" title="Copy link">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
			<path d="M10.5 13.5a4 4 0 0 1 0-5.6l2.6-2.6a4 4 0 0 1 5.6 5.6l-1.7 1.7" />
			<path d="M13.5 10.5a4 4 0 0 1 0 5.6l-2.6 2.6a4 4 0 0 1-5.6-5.6l1.7-1.7" />
		</svg>
	</button>

	<span class="meta copied" role="status">{copied ? 'Link copied' : ''}</span>
</div>

<style>
	.share {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex-wrap: wrap;
	}
	.share > .meta {
		margin-right: 0.3rem;
	}

	a,
	button {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		padding: 0;
		color: var(--muted);
		background: transparent;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		transition: background-color 120ms ease, color 120ms ease;
	}
	a:hover,
	button:hover {
		background: var(--tappable);
		color: var(--ink);
	}

	svg {
		width: 20px;
		height: 20px;
	}
</style>
