/**
 * Embla Carousel Scrollbar syncs a custom track and thumb with Embla.
 */
class EmblaScrollbar {
	/**
	 * @param {HTMLElement} emblaNode
	 * @param {HTMLElement} scrollbarContainer
	 * @param {HTMLElement} scrollbarThumb
	 */
	constructor(emblaNode, scrollbarContainer, scrollbarThumb) {
		this.emblaApi = EmblaCarousel(emblaNode, { loop: false });
		this.scrollbarContainer = scrollbarContainer;
		this.scrollbarThumb = scrollbarThumb;
		this.isDragging = false;
		this.maxScroll = 0;
		this.minThumbWidth = 40;

		this.onScroll = () => this.updateThumbPosition();
		this.onResize = this.debounce(() => {
			this.updateThumbSize();
			this.updateThumbPosition();
		}, 100);
		this.onPointerDown = (event) => this.startDrag(event);
		this.onPointerMove = (event) => this.onDrag(event);
		this.onPointerUp = (event) => this.stopDrag(event);
		this.onTrackClick = (event) => this.onScrollbarClick(event);
		this.onKeyboardControl = (event) => this.handleKeyboardControl(event);

		this.init();
	}

	init() {
		this.scrollbarThumb.setAttribute('role', 'slider');
		this.scrollbarThumb.setAttribute('aria-orientation', 'horizontal');

		this.updateThumbSize();
		this.updateThumbPosition();

		this.emblaApi.on('scroll', this.onScroll);
		this.emblaApi.on('resize', this.onResize);

		this.scrollbarThumb.addEventListener('pointerdown', this.onPointerDown);
		this.scrollbarThumb.addEventListener('pointermove', this.onPointerMove);
		this.scrollbarThumb.addEventListener('pointerup', this.onPointerUp);
		this.scrollbarThumb.addEventListener('pointercancel', this.onPointerUp);
		this.scrollbarThumb.addEventListener('keydown', this.onKeyboardControl);
		this.scrollbarContainer.addEventListener('click', this.onTrackClick);
	}

	updateThumbSize() {
		const trackWidth = this.scrollbarContainer.clientWidth;
		const viewportWidth = this.emblaApi.rootNode().clientWidth;
		const contentWidth = this.emblaApi.containerNode().scrollWidth;

		if (!trackWidth || !viewportWidth || !contentWidth) {
			return;
		}

		const visibleRatio = Math.min(1, viewportWidth / contentWidth);
		const thumbWidth = Math.min(
			trackWidth,
			Math.max(trackWidth * visibleRatio, this.minThumbWidth)
		);

		this.scrollbarThumb.style.width = `${thumbWidth}px`;
		this.maxScroll = Math.max(0, trackWidth - thumbWidth);
	}

	updateThumbPosition() {
		this.setThumbProgress(this.emblaApi.scrollProgress());
	}

	setThumbProgress(progress) {
		const clampedProgress = Math.max(0, Math.min(1, progress));
		this.scrollbarThumb.style.transform = `translateX(${
			clampedProgress * this.maxScroll
		}px)`;
		this.scrollbarThumb.setAttribute(
			'aria-valuenow',
			Math.round(clampedProgress * 100)
		);
	}

	getTargetIndexFromProgress(progress) {
		const snapCount = this.emblaApi.scrollSnapList().length;
		if (snapCount <= 1) {
			return 0;
		}

		const clampedProgress = Math.max(0, Math.min(1, progress));
		return Math.round(clampedProgress * (snapCount - 1));
	}

	startDrag(event) {
		if (event.pointerType === 'mouse' && event.button !== 0) {
			return;
		}

		this.isDragging = true;
		this.scrollbarThumb.style.cursor = 'grabbing';
		this.scrollbarThumb.setPointerCapture(event.pointerId);
		this.onDrag(event);
		event.preventDefault();
	}

	onDrag(event) {
		if (!this.isDragging) {
			return;
		}

		const rect = this.scrollbarContainer.getBoundingClientRect();
		if (!rect.width) {
			return;
		}

		const position = Math.max(
			0,
			Math.min(1, (event.clientX - rect.left) / rect.width)
		);

		this.setThumbProgress(position);
		this.emblaApi.scrollTo(this.getTargetIndexFromProgress(position), false);
		event.preventDefault();
	}

	stopDrag(event) {
		if (!this.isDragging) {
			return;
		}

		this.isDragging = false;
		this.scrollbarThumb.style.cursor = 'grab';

		if (
			event &&
			this.scrollbarThumb.hasPointerCapture(event.pointerId)
		) {
			this.scrollbarThumb.releasePointerCapture(event.pointerId);
		}
	}

	onScrollbarClick(event) {
		if (event.target === this.scrollbarThumb) {
			return;
		}

		const rect = this.scrollbarContainer.getBoundingClientRect();
		if (!rect.width) {
			return;
		}

		const position = Math.max(
			0,
			Math.min(1, (event.clientX - rect.left) / rect.width)
		);

		this.setThumbProgress(position);
		this.emblaApi.scrollTo(this.getTargetIndexFromProgress(position), false);
	}

	handleKeyboardControl(event) {
		let progress = this.emblaApi.scrollProgress();
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

		this.setThumbProgress(progress);
		this.emblaApi.scrollTo(this.getTargetIndexFromProgress(progress), false);
	}

	/**
	 * Debounce function to optimize resize updates.
	 * @param {Function} func
	 * @param {number} wait
	 * @returns {Function}
	 */
	debounce(func, wait) {
		let timeout;
		return function (...args) {
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(this, args), wait);
		};
	}
}
