# Embla Scrollbar Demo

This repo contains a small vanilla JavaScript helper that adds a custom scrollbar to an Embla Carousel instance.

Embla does not ship with a built-in scrollbar UI, so this project keeps the scrollbar logic separate and syncs a custom thumb with Embla's scroll progress.

## What It Does

- Creates an Embla carousel from a root element
- Measures the visible viewport against the scrollable content
- Sizes a thumb to match the visible portion of the carousel
- Keeps the thumb in sync while the carousel scrolls
- Lets you drag, click, or keyboard-control the thumb

## Files

- `index.html` - Demo markup, styles, and Embla bootstrapping
- `EmblaScrollbar.js` - The scrollbar helper class

## How To Use

1. Include Embla Carousel from a CDN or local build.
2. Load `EmblaScrollbar.js`.
3. Pass the carousel root, scrollbar track, and thumb elements into `new EmblaScrollbar(...)`.

Example:

```html
<script src="https://unpkg.com/embla-carousel/embla-carousel.umd.js"></script>
<script src="EmblaScrollbar.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const emblaNode = document.querySelector('.embla');
    const scrollbarContainer = document.querySelector('.scrollbar-container');
    const scrollbarThumb = document.querySelector('.scrollbar-thumb');

    if (emblaNode && scrollbarContainer && scrollbarThumb) {
      new EmblaScrollbar(emblaNode, scrollbarContainer, scrollbarThumb);
    }
  });
</script>
```

## Notes

- The demo uses the `.embla` element as the Embla viewport.
- The thumb is treated like a horizontal slider for accessibility.
- The helper assumes the scrollbar track is visible and has a measurable width when initialized.

## Run It

Open `index.html` in a browser, or serve the folder with any static file server.

