<script>
	/**
	 * SocialLinks — the icon row from the landing page of awakenedhaki.dev.
	 *
	 * Icons are inlined SVG paths rather than an icon package. Three icons do
	 * not justify a dependency: lucide-react or Font Awesome would add a
	 * runtime and ship hundreds of unused glyphs to save about forty lines
	 * here. The cost of inlining is that adding a fourth icon means finding a
	 * path, which is a fair trade at this scale.
	 *
	 * Each link carries an aria-label because the icon alone has no accessible
	 * name, and `rel="noopener noreferrer"` on the external ones so the opened
	 * tab cannot reach back into this page via window.opener.
	 *
	 * @param {number} size - icon edge length in px
	 */
	import { social } from '$lib/site.js';

	let { size = 20 } = $props();

	// Single 24x24 grid for every glyph so they optically match at any size.
	const ICONS = {
		github:
			'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z',
		linkedin:
			'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z',
		email:
			'M22 4H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm-.4 2L12 12.25 2.4 6h19.2ZM2 18V7.87l9.47 6.16a1 1 0 0 0 1.06 0L22 7.87V18H2Z'
	};
</script>

<ul class="socials">
	{#each social as link}
		<li>
			<a
				href={link.href}
				aria-label={link.label}
				title={link.label}
				target={link.id === 'email' ? undefined : '_blank'}
				rel={link.id === 'email' ? undefined : 'noopener noreferrer'}
			>
				<svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
					<path d={ICONS[link.id]} />
				</svg>
			</a>
		</li>
	{/each}
</ul>

<style>
	.socials {
		list-style: none;
		display: flex;
		gap: var(--space-1);
		/* Pull the row left by the circle's inset so the first icon lines up
		   with the text above it. */
		margin: 0 0 0 -10px;
		padding: 0;
	}

	a {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		color: var(--muted);
		transition: background-color 120ms ease, color 120ms ease;
	}
	a:hover {
		background: var(--tappable);
		color: var(--ink);
	}

	svg {
		fill: currentColor;
		display: block;
	}
</style>
