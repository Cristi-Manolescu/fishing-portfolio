/**
 * SSR stub for Lenis. Used only during server build so Rollup can resolve "lenis".
 * Real Lenis is used in the browser; this is never instantiated on the server.
 */
export default class Lenis {
	constructor() {}
	destroy() {}
}
