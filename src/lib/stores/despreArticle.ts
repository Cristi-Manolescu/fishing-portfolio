/**
 * Despre Article Store - Desktop in-place article view
 * When an equipment thumb is clicked on Despre screen, we show article content
 * in the same holders (main = text, bottom = gallery thumbs) without sliding the holders.
 */
import { writable } from 'svelte/store';

/** Selected Despre subsection id (e.g. 'box', 'delfin'). null = Despre home. */
export const selectedDespreArticleId = writable<string | null>(null);

/** Photo System (ArticleGallery) open state when viewing a Despre article. Kept for mobile/other; desktop article bottom uses single-image holder instead. */
export const despreGalleryOpen = writable<boolean>(false);

/** Single-image holder (Photo System): when set, overlay shows images[currentIndex] in Chenar. Enables prev/next navigation. */
export const despreSingleImage = writable<{
	images: { src: string; alt: string }[];
	index: number;
} | null>(null);
