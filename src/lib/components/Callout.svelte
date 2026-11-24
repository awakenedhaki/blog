<script>
	/**
	 * Callout — a collapsible aside for tangents, disclaimers and notes.
	 *
	 * Usage in a post (blank lines around Markdown content are required):
	 *
	 *   <Callout type="tangent" title="Why not a t-test here?" open={false}>
	 *
	 *   A short digression the reader can skip...
	 *
	 *   </Callout>
	 *
	 * Props
	 *   title : string  — the always-visible summary line.
	 *   type  : 'note' | 'tangent' | 'disclaimer'  — named in the label, and
	 *           marked by the left rule: none, dashed, or solid ink. Kinds are
	 *           told apart by word and rule, never by colour alone.
	 *   open  : boolean — whether the box starts expanded (default: false,
	 *           i.e. collapsed). This is exactly the author control requested:
	 *           set open={true} for content readers should see by default.
	 *
	 * Built on the native <details>/<summary> elements deliberately: they are
	 * keyboard-accessible, screen-reader-friendly and work with JavaScript
	 * disabled — no toggle code to maintain. The trade-off is that <details>
	 * cannot animate its open/close height smoothly in all browsers; if you
	 * later want animated expansion, that is the one reason to swap this for a
	 * JS-driven disclosure.
	 */
	import Chevron from './Chevron.svelte';

	let { title = 'Aside', type = 'note', open = false, children } = $props();
</script>

<details class="callout {type}" {open}>
	<summary>
		<span class="kind">{type}</span>
		<span class="title">{title}</span>
		<Chevron />
	</summary>
	<div class="content">
		{@render children?.()}
	</div>
</details>

<style>
	.callout {
		position: relative;
		margin: 1.75rem 0;
		border: 1px solid var(--divider);
		border-radius: var(--radius-card);
		background: var(--tile);
	}

	/* The kind's left rule: a note has none, a tangent a dashed one, a
	   disclaimer a solid ink one. Drawn as a straight line set in from the
	   rounded corners, over the hairline, rather than as the card's own
	   border, which would bend round them. */
	.tangent::before,
	.disclaimer::before {
		content: '';
		position: absolute;
		left: -1px;
		top: var(--radius-card);
		bottom: var(--radius-card);
		border-left: 3px solid var(--ink);
		pointer-events: none;
	}
	.tangent::before {
		border-left-style: dashed;
	}

	summary {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		column-gap: var(--space-3);
		cursor: pointer;
		min-height: 40px;
		padding: var(--space-3) var(--space-4);
		font-weight: 600;
		list-style: none; /* the Chevron is the marker */
	}
	.title {
		flex: 1;
		min-width: 0;
	}
	summary :global(.chevron) {
		align-self: center;
	}
	details[open] summary :global(.chevron) {
		transform: rotate(180deg);
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover {
		background: var(--tappable);
		border-radius: var(--radius-card);
	}

	/* The kind leads, as a label: it is how kinds are told apart. */
	.kind {
		font-size: var(--type-label);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--tracking-label);
		color: var(--muted);
	}

	.content {
		padding: 0 var(--space-4) var(--space-4);
		font-size: var(--type-body-l);
	}
	.content > :global(:first-child) {
		margin-top: 0;
	}
	.content > :global(:last-child) {
		margin-bottom: 0;
	}
</style>
