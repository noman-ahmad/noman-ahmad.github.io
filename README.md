# noman-ahmad.github.io

Personal portfolio site — a single static page, no framework and no build step.
Deployed with GitHub Pages straight from the default branch.

**Live:** https://noman-ahmad.github.io

## Structure

```
index.html      markup, meta/OG tags, JSON-LD, and the inline SVG icon sprite
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
layer and a `.hero-spot` cursor spotlight. The spotlight and the photo tilt are
driven by `--mx`/`--my` and `--tx`/`--ty` custom properties written from
`scripts.js`, and are disabled for touch devices and reduced motion.

## Images

Photos are served as WebP with a JPEG fallback for the hero. To replace the
portrait, find the face centre (x) and eye line (y) in the source, then crop
square so the face is horizontally centred with the eyes ~40% down:

```sh
SRC=assets/new-photo.jpg
# S = crop size; left = faceX - S/2; top = eyesY - 0.40*S
CROP="crop=1760:1760:625:1261"

ffmpeg -y -i $SRC -vf "$CROP,scale=720:720:flags=lanczos" -frames:v 1 /tmp/p.png
ffmpeg -y -i $SRC -vf "$CROP,scale=160:160:flags=lanczos" -frames:v 1 /tmp/p160.png
cwebp -q 70 -m 6 /tmp/p.png    -o assets/profile.webp
cwebp -q 78 -m 6 /tmp/p160.png -o assets/profile-sm.webp
sips -s format jpeg -s formatOptions 62 /tmp/p.png --out assets/profile.jpg
```

To find those coordinates, render the source with a grid overlay
(`-vf "scale=800:600,drawgrid=w=80:h=60:t=1:c=red"`), read the face position off
it, then verify by re-cropping with centre guides before committing.

Quality is deliberately ~70 rather than ~85: the photo has a highly detailed
background that compresses badly, and the two are visually identical at the
360px the image is actually displayed at.

`assets/og-image.jpg` is the social preview card and must stay 1200×630 — crop a
landscape band around the same face centre:

```sh
ffmpeg -y -i $SRC -vf "crop=2600:1365:205:1392,scale=1200:630:flags=lanczos" \
  -frames:v 1 /tmp/og.png
sips -s format jpeg -s formatOptions 60 /tmp/og.png --out assets/og-image.jpg
```

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

`assets/og-image.jpg` (1200×630) is the link preview. It is **rendered from an
HTML template** rather than composed by hand, so it uses the real fonts and the
site's own palette. Rendering at 2× and downsampling keeps the text crisp. If you
change your title or employer, re-render it — the card has that text baked in.

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

## Notes

- Theme is applied by a small inline script in `<head>` before first paint, so
  there is no flash of the wrong colours. The visitor's choice is stored in
  `localStorage`; without one, the OS preference wins.
- Every animation is disabled under `prefers-reduced-motion: reduce`, and
  scroll reveals are gated on a `js` class so content stays visible if
  scripting fails.
- Absolute URLs in the OG/canonical/JSON-LD tags are hardcoded to
  `https://noman-ahmad.github.io/` — update them if the domain changes.
