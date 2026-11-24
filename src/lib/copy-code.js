/**
 * Copy buttons on code blocks.
 *
 * mdsvex writes one `hidden` button into every .code-block at build time
 * (see mdsvex.config.js), so the button is in the prerendered page and
 * appears without shifting anything. This module reveals them and handles
 * every click with ONE listener on the document, so blocks that arrive with
 * a client-side navigation work without any per-page setup.
 *
 * What is copied is the code's text only: the line numbers are CSS
 * generated content and are never part of it.
 */

const DONE_MS = 1500;

/** Reveal the buttons in `root` (they ship hidden for readers without JS). */
export function revealCopyButtons(root = document) {
	for (const button of root.querySelectorAll('.code-block > .copy[hidden]')) button.hidden = false;
}

/**
 * Start handling copy clicks. `announce(message)` reports the outcome to a
 * polite live region. Returns a function that stops handling them.
 */
export function handleCopyButtons(announce) {
	async function onClick(event) {
		const button = event.target.closest?.('.code-block > .copy');
		if (!button) return;
		const code = button.parentElement.querySelector('pre code');
		if (!code) return;
		try {
			await navigator.clipboard.writeText(code.textContent);
			announce('Code copied');
			button.dataset.copied = '';
			clearTimeout(button._copyTimer);
			button._copyTimer = setTimeout(() => delete button.dataset.copied, DONE_MS);
		} catch {
			// No clipboard access (an insecure origin, or permission refused).
			announce('Could not copy. Select the code to copy it instead.');
		}
	}

	document.addEventListener('click', onClick);
	return () => document.removeEventListener('click', onClick);
}
