# Embla Scrollbar Plugin Demo

This repo contains a small vanilla JavaScript plugin that adds a custom scrollbar to an Embla Carousel instance.

## Why A Plugin

Refactoring this into a plugin makes more sense than creating Embla inside the scrollbar helper. Embla already accepts plugins as the third constructor argument, so the carousel can keep owning its own options, lifecycle, and other plugins while the scrollbar only owns scrollbar behavior.

That keeps the API composable:

- The app creates Embla once.
- The scrollbar receives the initialized Embla API through `init`.
- Cleanup happens through the plugin `destroy` hook.
- Other Embla plugins can be used beside it.

## Files

- `index.html` - Standalone demo with basic styles and controls
- `EmblaScrollbar.js` - The scrollbar plugin factory

## Usage

```html
<script src="https://unpkg.com/embla-carousel@8/embla-carousel.umd.js"></script>
<script src="EmblaScrollbar.js"></script>
<script>
  const emblaNode = document.querySelector('.embla');
  const scrollbar = EmblaScrollbar({
    trackNode: document.querySelector('.scrollbar'),
    thumbNode: document.querySelector('.scrollbar__thumb'),
  });

  const emblaApi = EmblaCarousel(emblaNode, { loop: false }, [scrollbar]);
</script>
```

`trackNode` and `thumbNode` can be DOM elements or selectors.

## Run It

Open `index.html` in a browser, or serve the folder with any static file server.
