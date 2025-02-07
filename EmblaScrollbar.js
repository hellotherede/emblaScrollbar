/**
 * Embla Carousel Scrollbar - Syncs a custom scrollbar with EmblaCarousel, including touch support.
 * @class EmblaScrollbar
 */
class EmblaScrollbar {
	/**
	 * Initializes the custom scrollbar for EmblaCarousel
	 * @param {HTMLElement} emblaNode - The carousel container
	 * @param {HTMLElement} scrollbarContainer - The scrollbar track element
	 * @param {HTMLElement} scrollbarThumb - The scrollbar thumb element
	 */
	constructor(emblaNode, scrollbarContainer, scrollbarThumb) {
		this.emblaApi = EmblaCarousel(emblaNode, { loop: false });
		this.scrollbarContainer = scrollbarContainer;
		this.scrollbarThumb = scrollbarThumb;
		this.isDragging = false;
		this.maxScroll = 0;

		this.init();
	}

	/**
	 * Initializes event listeners and updates the thumb size & position
	 */
	init() {
		this.updateThumbSize();
		this.updateThumbPosition();

		this.emblaApi.on('scroll', () => this.updateThumbPosition());
		this.emblaApi.on(
			'resize',
			this.debounce(() => {
				this.updateThumbSize();
				this.updateThumbPosition();
			}, 100)
		);

		// Mouse Events
		this.scrollbarThumb.addEventListener('mousedown', (e) => this.startDrag(e));
		document.addEventListener('mousemove', (e) => this.onDrag(e));
		document.addEventListener('mouseup', () => this.stopDrag());

		// Touch Events (for mobile & tablets)
		this.scrollbarThumb.addEventListener(
			'touchstart',
			(e) => this.startDrag(e),
			{ passive: false }
		);
		document.addEventListener('touchmove', (e) => this.onDrag(e), {
			passive: false,
		});
		document.addEventListener('touchend', () => this.stopDrag());

		this.scrollbarContainer.addEventListener('click', (e) =>
			this.onScrollbarClick(e)
		);
		this.scrollbarThumb.addEventListener('keydown', (e) =>
			this.onKeyboardControl(e)
		);
	}

	/**
	 * Updates the scrollbar thumb size based on visible slides
	 */
	updateThumbSize() {
		const slideWidth = this.emblaApi.slideNodes()[0].clientWidth; // Width of one slide
		const totalSlides = this.emblaApi.scrollSnapList().length; // Total slides
		const visibleWidth = this.emblaApi.containerNode().clientWidth; // Visible width of Embla
		const totalWidth = totalSlides * slideWidth; // Total width of all slides combined
		const scrollbarWidth = this.scrollbarContainer.clientWidth; // Scrollbar track width

		// How much of the total content is visible at once
		const visibleRatio = visibleWidth / totalWidth;

		// If there is no scrolling possible (all slides fit), thumb should fill the track
		let thumbWidth = Math.max(
			(visibleRatio * scrollbarWidth) / totalSlides,
			40
		);

		// Ensure the thumb never becomes larger than the scrollbar itself
		thumbWidth = Math.min(thumbWidth, scrollbarWidth);

		this.scrollbarThumb.style.width = `${thumbWidth}px`;

		// Calculate the max movement space for the thumb
		this.maxScroll = scrollbarWidth - thumbWidth;
	}

	/**
	 * Updates the scrollbar thumb position based on the carousel scroll progress
	 */
	updateThumbPosition() {
		const progress = this.emblaApi.scrollProgress();
		this.scrollbarThumb.style.transform = `translateX(${
			progress * this.maxScroll
		}px)`;
		this.scrollbarThumb.setAttribute(
			'aria-valuenow',
			Math.round(progress * 100)
		);
	}

	/**
	 * Handles drag movement of the scrollbar thumb
	 * @param {MouseEvent|TouchEvent} event - The mouse or touch move event
	 */
	onDrag(event) {
		if (!this.isDragging) return;

		const clientX = event.touches ? event.touches[0].clientX : event.clientX;
		const rect = this.scrollbarContainer.getBoundingClientRect();
		let position = (clientX - rect.left) / rect.width;
		position = Math.max(0, Math.min(1, position));

		this.scrollbarThumb.style.transform = `translateX(${
			position * this.maxScroll
		}px)`;
		const targetIndex = Math.round(
			position * (this.emblaApi.scrollSnapList().length - 1)
		);
		this.emblaApi.scrollTo(targetIndex, false);

		event.preventDefault(); // Prevents unwanted scrolling on mobile
	}

	/**
	 * Handles scrollbar clicks to jump to a position
	 * @param {MouseEvent} event - The mouse click event
	 */
	onScrollbarClick(event) {
		const rect = this.scrollbarContainer.getBoundingClientRect();
		let position = (event.clientX - rect.left) / rect.width;
		position = Math.max(0, Math.min(1, position));

		this.scrollbarThumb.style.transform = `translateX(${
			position * this.maxScroll
		}px)`;
		const targetIndex = Math.round(
			position * (this.emblaApi.scrollSnapList().length - 1)
		);
		this.emblaApi.scrollTo(targetIndex, false);
	}

	/**
	 * Handles keyboard controls for scrolling
	 * @param {KeyboardEvent} event - The keydown event
	 */
	onKeyboardControl(event) {
		const progress = this.emblaApi.scrollProgress();
		let newProgress = progress;

		if (event.key === 'ArrowRight') newProgress = Math.min(1, progress + 0.1);
		if (event.key === 'ArrowLeft') newProgress = Math.max(0, progress - 0.1);
		if (event.key === 'Home') newProgress = 0;
		if (event.key === 'End') newProgress = 1;

		this.scrollbarThumb.style.transform = `translateX(${
			newProgress * this.maxScroll
		}px)`;
		const targetIndex = Math.round(
			newProgress * (this.emblaApi.scrollSnapList().length - 1)
		);
		this.emblaApi.scrollTo(targetIndex, false);
	}

	/**
	 * Starts dragging the scrollbar thumb (Mouse & Touch)
	 * @param {MouseEvent|TouchEvent} event - The mouse or touch start event
	 */
	startDrag(event) {
		this.isDragging = true;
		this.scrollbarThumb.style.cursor = 'grabbing';

		if (event.touches) {
			event.preventDefault(); // Prevents scroll bouncing on mobile
		}
	}

	/**
	 * Stops dragging the scrollbar thumb
	 */
	stopDrag() {
		this.isDragging = false;
		this.scrollbarThumb.style.cursor = 'grab';
	}

	/**
	 * Debounce function to optimize event listeners
	 * @param {Function} func - The function to debounce
	 * @param {number} wait - The debounce delay in milliseconds
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
