<script>
	import SocialLinks from './SocialLinks.svelte';
	import { site } from '$lib/site.js';
	const year = new Date().getFullYear();
</script>

<footer>
	<div class="wrap footer-socials"><SocialLinks /></div>
	<div class="wrap">
		<p class="meta"><span aria-hidden="true">#</span> © {year} {site.handle} · built with SvelteKit + mdsvex</p>
	</div>
</footer>

<style>
	.footer-socials {
		padding-bottom: 0.9rem;
	}

	footer {
		border-top: 1px solid var(--divider);
		margin-top: 4rem;
		padding-block: 1.5rem;
	}
</style>
