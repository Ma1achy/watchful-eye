# Watchful Eye

A sea of bot matches, every one played on an exact engine in
WebAssembly, watched by a wandering camera that goes looking for the best moments.

**Live:** https://ma1achy.github.io/watchful-eye/

## Embedding

```html
<iframe src="https://ma1achy.github.io/watchful-eye/?still" style="width:100%;aspect-ratio:16/9;border:0"
        title="Watchful Eye" loading="lazy"></iframe>
```

It fills whatever size it's given. Options in the address:

- `?seed=123`: a particular sea (otherwise a new one each visit)
- `?still`: no dragging or scrolling, so an embed never takes the page's scroll
- `?js`: the original JavaScript bots instead of Four's engine

Built from the sea sources in Four (`crates/four-sea/web`); this page is generated, not edited by hand.
