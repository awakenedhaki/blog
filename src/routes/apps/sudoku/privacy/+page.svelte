<script>
	import { site } from '$lib/site.js';

	// Google Play links to this page as the Sudoku app's privacy policy. Keep it
	// matching what the app does: the source copy is docs/privacy-policy.md in
	// the app's repository, and the Data safety form in Play Console says the same.
	const effective = '25 November 2026';
	const contact = 'rvallejos@awakenedhaki.dev';
</script>

<svelte:head>
	<title>Sudoku privacy policy — {site.name}</title>
	<meta name="description" content="The Sudoku app for Android collects nothing: no account, no analytics, no ads, and no internet access." />
</svelte:head>

<article class="prose">
	<p class="meta"><span aria-hidden="true">#</span> apps · sudoku</p>
	<h1>Privacy policy: Sudoku</h1>
	<p><em>Effective {effective}</em></p>

	<p>
		Sudoku is a puzzle game for Android by {site.handle}. This policy explains
		what the app does with information about you. In short: nothing leaves your
		phone.
	</p>

	<h2>What the app collects</h2>
	<p>
		<strong>Nothing.</strong> The app has no account and no sign-in, no
		analytics, no advertising, and no crash reporting. It does not ask for, read
		or send any personal information. The app has no internet permission at all,
		so it cannot send anything anywhere.
	</p>

	<h2>What stays on your phone</h2>
	<p>To work, the app keeps these on your phone only:</p>
	<ul>
		<li>your games in progress, finished puzzles and history;</li>
		<li>your settings;</li>
		<li>
			a record that you bought the full game, if you did. It is encrypted with a
			key held by your phone's secure hardware.
		</li>
	</ul>
	<p>
		The app's own backup is turned off, so none of this is copied to a cloud
		backup. Uninstalling the app or clearing its storage deletes it all.
	</p>

	<h2>Exporting your games</h2>
	<p>
		Settings can export your games to a file, and import them back. This only
		happens when you choose to do it, and the file goes wherever you save it:
		your phone, or a place you pick, such as cloud storage. The app does not see
		or control where the file goes after that.
	</p>

	<h2>Purchases</h2>
	<p>
		Buying the full game goes through the Google Play app, under
		<a href="https://policies.google.com/privacy">Google's privacy policy</a>.
		The app learns only whether the full game has been bought. It never sees
		your name, email or payment details.
	</p>

	<h2>Children</h2>
	<p>The app collects no information from anyone, including children.</p>

	<h2>Changes</h2>
	<p>
		If this policy changes, the new version will be posted here with a new
		effective date.
	</p>

	<h2>Contact</h2>
	<p>Questions: <a href={`mailto:${contact}`}>{contact}</a></p>
</article>
