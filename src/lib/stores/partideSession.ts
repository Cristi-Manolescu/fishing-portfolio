/**
 * Partide (Sessions) Store - Desktop in-place session view
 * - activeLakeIndex: which lake is selected in the main lake strip (drives ticker + bottom session thumbs)
 * - selectedSession: when set, show session article in main + bottom (same pattern as Despre article)
 */
import { writable } from 'svelte/store';

/** Index into lakes[] for the currently selected lake on Partide home. Drives ticker text and bottom session thumbs. */
export const partideActiveLakeIndex = writable<number>(0);

/** When set, session article is shown in-place (middle = body, bottom = gallery). null = Partide home. */
export const selectedPartideSession = writable<{ lakeId: string; sessionId: string } | null>(null);
