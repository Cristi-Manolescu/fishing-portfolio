/** Basic deterrents against casual image saving and right-click copying. */
export function initCopyrightProtection(): () => void {
	const onContextMenu = (event: Event) => {
		event.preventDefault();
	};

	const onDragStart = (event: DragEvent) => {
		if (event.target instanceof HTMLImageElement) {
			event.preventDefault();
		}
	};

	document.addEventListener('contextmenu', onContextMenu);
	document.addEventListener('dragstart', onDragStart);

	return () => {
		document.removeEventListener('contextmenu', onContextMenu);
		document.removeEventListener('dragstart', onDragStart);
	};
}
