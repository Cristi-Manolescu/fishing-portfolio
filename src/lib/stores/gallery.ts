/**
 * Gallery desktop overlay – Photo System for Gallery section.
 * Main holder: big thumbs open videos (SingleImageHolder video mode).
 * Bottom holder: small thumbs open photos (SingleImageHolder image mode).
 */
import type { GalleryVideoItem } from '$lib/data/content';
import { writable } from 'svelte/store';

export type GallerySingleMedia =
	| { type: 'photo'; images: { src: string; alt: string }[]; index: number }
	| { type: 'video'; videos: GalleryVideoItem[]; index: number }
	| null;

export const gallerySingleMedia = writable<GallerySingleMedia>(null);
