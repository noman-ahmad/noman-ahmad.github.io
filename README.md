# noman-ahmad.github.io

Personal portfolio site — a single static page, no framework and no build step.
Deployed with GitHub Pages straight from the default branch.

**Live:** https://noman-ahmad.github.io

## Structure

```
index.html      markup, meta/OG tags, JSON-LD, and the inline SVG icon sprite
scripts/        build helpers: résumé rasteriser, social-card renderer + template
styles.css      all styling; design tokens at the top, sections numbered 1-11
scripts.js      theme, menu, scroll effects, reveals, typing, filtering
404.html        styled not-found page (GitHub Pages serves this automatically)
robots.txt      crawler policy, points at the sitemap
sitemap.xml     single-URL sitemap
site.webmanifest  PWA metadata and install icons
favicon.ico     multi-size ICO (16/32/48) for browsers that ask for it
assets/         optimised images (WebP), résumé PDF, SVG favicon
.nojekyll       tells Pages to serve files as-is instead of running Jekyll
```

## Local development

No tooling required — open `index.html` in a browser. To exercise it over HTTP
(so paths behave exactly as they do on Pages):

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Editing guide

**Theme and colours** live as CSS custom properties in the `:root` and
`[data-theme="dark"]` blocks at the top of `styles.css`. Changing `--accent`
recolours buttons, links, icons, badges and glows across the whole page.

**Icons** are inline SVG `<symbol>`s in the sprite at the top of `<body>`,
referenced with `<use href="#i-name" />`. To add one, define a new `<symbol>`
with a `0 0 24 24` viewBox; stroke icons inherit `.icon` styling automatically,
filled brand marks set `fill="currentColor" stroke="none"` on their path.

**Adding a project** — copy an existing `<article class="card">` inside
`.bento`. The grid is three columns on desktop; `.card-featured` spans two
columns and two rows, `.card-cta` spans two columns.

**Adding a role** — copy an `<li class="tl-item">` into `.timeline`. Entries are
listed newest first. `is-current` on the item gives it the accent marker,
tinted card and "Current" badge; remove it from the old role first. Optional
parts: `.tl-sub` for a promotion/sub-title line, `.tl-points` for achievement
bullets (wrap figures in `<strong>`), and `.tl-store` for an App Store badge.

**Keep the site and `assets/resume.pdf` in sync.** The timeline bullets, the
stats band and the toolkit all mirror the résumé. When the résumé changes,
update those and re-render the viewer images.

**Rotating roles** in the hero come from the `roles` array in `scripts.js`.

**Stats band** — the four figures under the hero are `.stat` blocks; `data-count`
is the number counted up to, `data-suffix` is appended (e.g. `+`, `K+`) and
`data-decimals` keeps decimal places (e.g. `4.8`). The text content is the
fallback shown without JS or under reduced motion, so keep it in sync with
`data-count` + `data-suffix`.

**Hero backdrop** is three drifting `.aurora` gradients plus a `.hero-grid` dot
layer and a `.hero-spot` cursor spotlight. The spotlight and the code card tilt are
driven by `--mx`/`--my` and `--tx`/`--ty` custom properties written from
`scripts.js`, and are disabled for touch devices and reduced motion.

## Images

**Hero code card** — the hero shows an `Engineer.swift` editor window
(`.hero-card` > `.code-card`) instead of a photo. The snippet is hand-highlighted
with `tok-*` spans whose colours are the `--code-*` tokens in both theme blocks
of `styles.css`; keep any new colour at 4.5:1 or better against `--surface`
and `--surface-2`. The font size is derived from the card width for a 46-character
longest line, so if you lengthen a line, raise the `28.6` divisor in
`.code-card-body` to match (characters × 0.6 + a little slack). The same snippet
is duplicated in `scripts/og-card.html`; change both together and re-render the
link preview (see "Icons and the link preview" below).

Wide wordmark logos (Club) use `class="logo-wide"` on the `<img>` so they keep
their aspect ratio instead of being cropped into the square tile the other
company marks use.

The Club source artwork is a 3.2 MB animated GIF and is **gitignored** — only
the optimised WebPs ship. To regenerate them from a new GIF:

```sh
# static (5 KB) — what the site uses
ffmpeg -y -i club-logo.gif -vf "select=eq(n\,0),crop=430:215:105:45,scale=172:86" \
  -frames:v 1 /tmp/c.png && cwebp -q 88 /tmp/c.png -o assets/club-logo.webp

# animated (48 KB) — swap the src to use it
ffmpeg -y -i club-logo.gif -vf "fps=10,crop=430:215:105:45,scale=112:-1,\
  split[a][b];[a]palettegen=max_colors=48[p];[b][p]paletteuse=dither=none" /tmp/c.gif \
  && gif2webp -q 35 -m 6 -min_size /tmp/c.gif -o assets/club-logo-anim.webp
```

## Interactive bits

**Tech filter** — every tag on the page is a `<button class="chip" data-tech="…">`.
Clicking one dims each `.tl-item` and project `.card` that has no matching chip,
highlights the ones that do, and shows a count in the floating filter bar. An
item's technologies are read from the chips it contains, so there is no separate
list to keep in sync — add a chip and filtering picks it up. Escape or Clear
resets. `data-tech` is lower-case; use a comma for tags covering two things
(`React / React Native` → `react,react native`).

**Copy button** — any element with `data-copy="…"` copies that text and shows a
confirmation for two seconds, falling back to a prompt where the clipboard API
is unavailable.

**Back to top** and the **timeline rail fill** both ride the existing
rAF-throttled scroll frame in `scripts.js` rather than adding scroll listeners.

## Icons and the link preview

`assets/favicon.svg` is the source mark — an "N" drawn as a **path, not `<text>`**,
because favicons never load webfonts and a text node would fall back to whatever
the OS has. Everything else is rasterised from it:

```sh
node scripts/render-icons.js   # see the block below if regenerating by hand
```

Sizes produced: `favicon-16/32/48.png`, `apple-touch-icon.png` (180, **must be
PNG** — iOS silently ignores WebP), `icon-192.png`, `icon-512.png`, plus a
multi-size `favicon.ico` at the root containing the 16/32/48 PNGs.

`assets/og-image.jpg` (1200×630) is the link preview, **rendered from
`scripts/og-card.html`** rather than composed by hand, so it uses the real fonts
and the site's own palette:

```sh
node scripts/render-og-card.js scripts/og-card.html /tmp/og2x.png
ffmpeg -y -i /tmp/og2x.png -vf "scale=1200:630:flags=lanczos" /tmp/og1x.png
sips -s format jpeg -s formatOptions 74 /tmp/og1x.png --out assets/og-image.jpg
```

Rendering at 2× and downsampling keeps the text crisp. **The title, figures and
tags are baked into the pixels** — edit `og-card.html` and re-render whenever
they change on the site, then clear the caches (see below).

## Résumé viewer

`assets/resume.pdf` is the real document — the download and "Open" actions both
point at it. The in-page viewer shows **pre-rendered page images**
(`assets/resume-p{n}.webp`), which load only when the dialog is first opened.

That approach was chosen over an `<iframe>` (mobile browsers refuse to render
PDFs inline) and over shipping PDF.js (~1.4 MB for a two-page document).

**Regenerate the images whenever resume.pdf changes** — the viewer will
otherwise show the old one while the download serves the new one:

```sh
node scripts/render-resume.js
```

That script loads PDF.js in headless Chromium, renders each page to a canvas at
scale 2.6 (~1590px wide) and writes a PNG per page. Encode them with
**near-lossless** WebP — for crisp text on white, lossless beats lossy by a wide
margin (145 KB vs 271 KB for page 1):

```sh
cwebp -near_lossless 60 -m 6 assets/resume-p1.png -o assets/resume-p1.webp
```

If the page count changes, update the `<img>` list and the "2 pages" label in
the `#resume-viewer` markup.

### Cache busting for CSS and JS

`index.html` and `404.html` load `styles.css` and `scripts.js` with a `?v=YYYYMMDD`
query. GitHub Pages serves both files without content hashes, and browsers
(Safari in particular) keep a cached copy past a deploy, which pairs new markup
with old styles. **Bump the `v` value in both HTML files whenever `styles.css`
or `scripts.js` changes.**

### Refreshing a cached link preview

Platforms cache the preview per URL and will keep serving the old one:

- **LinkedIn** — [Post Inspector](https://www.linkedin.com/post-inspector/), then
  remove and re-add any Featured entry, which stores its own snapshot.
- **Facebook / WhatsApp** — [Sharing Debugger](https://developers.facebook.com/tools/debug/) → Scrape Again.
- **X, Slack, Discord** — re-fetch on their own within ~30 minutes.

## Notes

- Theme is applied by a small inline script in `<head>` before first paint, so
  there is no flash of the wrong colours. The visitor's choice is stored in
  `localStorage`; without one, the OS preference wins.
- Every animation is disabled under `prefers-reduced-motion: reduce`, and
  scroll reveals are gated on a `js` class so content stays visible if
  scripting fails.
- Absolute URLs in the OG/canonical/JSON-LD tags are hardcoded to
  `https://noman-ahmad.github.io/` — update them if the domain changes.
