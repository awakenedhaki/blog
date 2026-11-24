/**
 * Shared "is the search field open?" state.
 *
 * Why this is not just a local variable inside SearchBar: opening search has to
 * show the dimming overlay, which is a sibling of the header, not a child. Two
 * components therefore need the same boolean, and passing it down through
 * Header as a prop would make Header responsible for state it does not own.
 *
 * A `.svelte.js` module can hold runes, so this is a genuinely reactive object
 * that any component can import and read. It is deliberately a single-field
 * object rather than an exported `let`: exported bindings are copied by value
 * on import, so mutating a property is what keeps every reader in sync.
 */
export const searchState = $state({ open: false });
