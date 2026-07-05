/**
 * Embla Carousel plugin that syncs a custom track and thumb with scroll progress.
 *
 * @param {Object} userOptions
 * @param {HTMLElement|string} userOptions.trackNode
 * @param {HTMLElement|string} userOptions.thumbNode
 * @param {number} [userOptions.minThumbWidth=40]
 * @returns {Object}
 */
function EmblaScrollbar(userOptions) {
	const options = Object.assign(
		{
			trackNode: null,
			thumbNode: null,
			minThumbWidth: 40,
		},
		userOptions
	);

	let emblaApi;
	let trackNode;
	let thumbNode;
	let isDragging = false;
	let maxScroll = 0;
	let dragOffset = 0;
	let resizeTimeout = 0;

	const onScroll = () => updateThumbPosition();
	const onResize = () => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			updateThumbSize();
			updateThumbPosition();
		}, 100);
	};
	const onPointerDown = (event) => startDrag(event);
	const onPointerMove = (event) => onDrag(event);
	const onPointerUp = (event) => stopDrag(event);
	const onTrackClick = (event) => onScrollbarClick(event);
	const onKeyboardControl = (event) => handleKeyboardControl(event);

	function init(emblaApiInstance) {
		emblaApi = emblaApiInstance;
		trackNode = getNode(options.trackNode);
		thumbNode = getNode(options.thumbNode);

		if (!trackNode || !thumbNode) {
			throw new Error('EmblaScrollbar requires trackNode and thumbNode options.');
		}

		thumbNode.setAttribute('role', 'slider');
		thumbNode.setAttribute('aria-orientation', 'horizontal');
		thumbNode.setAttribute('aria-valuemin', '0');
		thumbNode.setAttribute('aria-valuemax', '100');

		if (!thumbNode.hasAttribute('tabindex')) {
			thumbNode.setAttribute('tabindex', '0');
		}

		updateThumbSize();
		updateThumbPosition();

		emblaApi.on('scroll', onScroll);
		emblaApi.on('resize', onResize);
		emblaApi.on('reInit', onResize);

		thumbNode.addEventListener('pointerdown', onPointerDown);
		thumbNode.addEventListener('pointermove', onPointerMove);
		thumbNode.addEventListener('pointerup', onPointerUp);
		thumbNode.addEventListener('pointercancel', onPointerUp);
		thumbNode.addEventListener('keydown', onKeyboardControl);
		trackNode.addEventListener('click', onTrackClick);
	}

	function destroy() {
		clearTimeout(resizeTimeout);

		if (emblaApi) {
			emblaApi.off('scroll', onScroll);
			emblaApi.off('resize', onResize);
			emblaApi.off('reInit', onResize);
		}

		if (thumbNode) {
			thumbNode.removeEventListener('pointerdown', onPointerDown);
			thumbNode.removeEventListener('pointermove', onPointerMove);
			thumbNode.removeEventListener('pointerup', onPointerUp);
			thumbNode.removeEventListener('pointercancel', onPointerUp);
			thumbNode.removeEventListener('keydown', onKeyboardControl);
			thumbNode.style.cursor = '';
		}

		if (trackNode) {
			trackNode.removeEventListener('click', onTrackClick);
		}

		isDragging = false;
		emblaApi = null;
		trackNode = null;
		thumbNode = null;
	}

	function getNode(nodeOrSelector) {
		if (typeof nodeOrSelector === 'string') {
			return document.querySelector(nodeOrSelector);
		}

		return nodeOrSelector;
	}

	function updateThumbSize() {
		const trackWidth = trackNode.clientWidth;
		const viewportWidth = emblaApi.rootNode().clientWidth;
		const contentWidth = emblaApi.containerNode().scrollWidth;

		if (!trackWidth || !viewportWidth || !contentWidth) {
			return;
		}

		const visibleRatio = Math.min(1, viewportWidth / contentWidth);
		const thumbWidth = Math.min(
			trackWidth,
			Math.max(trackWidth * visibleRatio, options.minThumbWidth)
		);

		thumbNode.style.width = `${thumbWidth}px`;
		maxScroll = Math.max(0, trackWidth - thumbWidth);
	}

	function updateThumbPosition() {
		setThumbProgress(emblaApi.scrollProgress());
	}

	function setThumbProgress(progress) {
		const clampedProgress = Math.max(0, Math.min(1, progress));
		thumbNode.style.transform = `translateX(${clampedProgress * maxScroll}px)`;
		thumbNode.setAttribute('aria-valuenow', Math.round(clampedProgress * 100));
	}

	function getTargetIndexFromProgress(progress) {
		const snapCount = emblaApi.scrollSnapList().length;

		if (snapCount <= 1) {
			return 0;
		}

		const clampedProgress = Math.max(0, Math.min(1, progress));
		return Math.round(clampedProgress * (snapCount - 1));
	}

	function startDrag(event) {
		if (event.pointerType === 'mouse' && event.button !== 0) {
			return;
		}

		isDragging = true;
		dragOffset = event.clientX - thumbNode.getBoundingClientRect().left;
		thumbNode.style.cursor = 'grabbing';
		thumbNode.setPointerCapture(event.pointerId);
		onDrag(event);
		event.preventDefault();
	}

	function onDrag(event) {
		if (!isDragging) {
			return;
		}

		const rect = trackNode.getBoundingClientRect();
		const draggableWidth = Math.max(0, rect.width - thumbNode.offsetWidth);

		if (!rect.width || !draggableWidth) {
			return;
		}

		const thumbLeft = Math.max(
			0,
			Math.min(draggableWidth, event.clientX - rect.left - dragOffset)
		);
		const position = thumbLeft / draggableWidth;

		setThumbProgress(position);
		emblaApi.scrollTo(getTargetIndexFromProgress(position), false);
		event.preventDefault();
	}

	function stopDrag(event) {
		if (!isDragging) {
			return;
		}

		isDragging = false;
		thumbNode.style.cursor = 'grab';

		if (event && thumbNode.hasPointerCapture(event.pointerId)) {
			thumbNode.releasePointerCapture(event.pointerId);
		}
	}

	function onScrollbarClick(event) {
		if (event.target === thumbNode) {
			return;
		}

		const rect = trackNode.getBoundingClientRect();

		if (!rect.width) {
			return;
		}

		const position = Math.max(
			0,
			Math.min(1, (event.clientX - rect.left) / rect.width)
		);

		setThumbProgress(position);
		emblaApi.scrollTo(getTargetIndexFromProgress(position), false);
	}

	function handleKeyboardControl(event) {
		let progress = emblaApi.scrollProgress();
		const step = event.shiftKey ? 0.2 : 0.1;

		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowDown':
				progress += step;
				event.preventDefault();
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
				progress -= step;
				event.preventDefault();
				break;
			case 'Home':
				progress = 0;
				event.preventDefault();
				break;
			case 'End':
				progress = 1;
				event.preventDefault();
				break;
			default:
				return;
		}

		setThumbProgress(progress);
		emblaApi.scrollTo(getTargetIndexFromProgress(progress), false);
	}

	return {
		name: 'scrollbar',
		options: userOptions,
		init,
		destroy,
		update: () => {
			updateThumbSize();
			updateThumbPosition();
		},
	};
}
