/**
 * The reader's theme choice: 'system', 'light' or 'dark'.
 *
 * The inline script in app.html has already applied it before first paint;
 * this module takes over from there. It reads the same `theme` key (which
 * today's site wrote as 'light' or 'dark', so those still mean what they
 * did), and while the choice is System it follows the operating system's
 * light/dark switch without a reload.
 *
 * Like search-state, the state is a single object rather than an exported
 * `let`, so every importer sees the same live value.
 */
const KEY = 'theme';
export const CHOICES = ['system', 'light', 'dark'];

export const theme = $state({ choice: 'system', dark: false });

const browser = typeof window !== 'undefined';
const systemDark = browser ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function stored() {
	try {
		const value = localStorage.getItem(KEY);
		return CHOICES.includes(value) ? value : 'system';
	} catch {
		return 'system'; // storage blocked (private mode): System, as in app.html
	}
}

/** Set the `dark` class and point the browser bar at the page colour. */
function apply() {
	theme.dark = theme.choice === 'dark' || (theme.choice === 'system' && systemDark.matches);
	const root = document.documentElement;
	root.classList.toggle('dark', theme.dark);
	// Read the colour back from the stylesheet so it comes from the token,
	// not a second copy of it.
	const page = getComputedStyle(root).getPropertyValue('--page').trim();
	if (page) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', page);
}

export function setTheme(choice) {
	if (!CHOICES.includes(choice)) return;
	theme.choice = choice;
	try {
		localStorage.setItem(KEY, choice);
	} catch {
		/* the choice still holds for this visit */
	}
	apply();
}

if (browser) {
	theme.choice = stored();
	theme.dark = document.documentElement.classList.contains('dark');
	systemDark.addEventListener('change', () => {
		if (theme.choice === 'system') apply();
	});
}
