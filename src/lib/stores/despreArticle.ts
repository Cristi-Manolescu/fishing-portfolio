/**
 * Despre Article Store - Desktop in-place article view
 * When an equipment thumb is clicked on Despre screen, we show article content
 * in the same holders (main = text, bottom = gallery thumbs) without sliding the holders.
 */
import { writable } from 'svelte/store';

/** Selected Despre subsection id (e.g. 'box', 'delfin'). null = Despre home. */
export const selectedDespreArticleId = writable<string | null>(null);

/** Photo System (ArticleGallery) open state when viewing a Despre article. */
export const despreGalleryOpen = writable<boolean>(false);
