<script>
	import { site, themes } from '$lib/site.js';
</script>

<svelte:head>
	<title>About — {site.name}</title>
</svelte:head>

<article class="prose">
	<p class="meta"><span aria-hidden="true">#</span> about the author</p>
	<h1>Hello, I'm {site.handle}.</h1>

	<p>
		The handle is a One Piece reference — <em>haki</em> is the ability to sense
		what isn't visible on the surface, which felt about right for someone whose
		job is finding signal in noisy data. I'm a data scientist who believes
		researchers deserve better tooling — and clearer explanations of the
		tooling they already have. This blog is where I work through ideas in
		public: how to wrangle messy data, how to read a methods section
		critically, and how to make a figure that tells the truth.
	</p>

	<p>
		I work primarily in <strong>R</strong> and <strong>Python</strong>, and most
		tutorials here show both side by side — pick the tab for the language you
		use, or read both and see how the idioms compare.
	</p>

	<h2>What you'll find here</h2>
	<ul>
		{#each themes as t}
			<li><a href={`/topics/${t.id}/`}>{t.label}</a></li>
		{/each}
	</ul>

	<h2>Get in touch</h2>
	<p>
		Found an error, or want to suggest a topic? Find me as
		<a href="https://github.com/awakenedhaki" rel="me">@awakenedhaki on GitHub</a>.
	</p>
</article>
