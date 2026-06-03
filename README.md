# syntrix-ks

The marketing site for **Syntrix** — a small practice of engineers and
consultants offering software, cloud, and advisory work. Lives at
<https://syntrix-ks.com>.

## Stack

Plain HTML, CSS, and a sprinkle of vanilla JS. No build step, no
framework — just static files served by GitHub Pages.

- `index.html` — single-page site (hero, practice, services, approach, contact)
- `styles.css` — full styling, design tokens, motion
- `script.js` — custom cursor, magnetic buttons, marquee, reveal-on-scroll, stat counters, and the Three.js hero shader (Three.js loaded from CDN in `index.html`)
- `CNAME` — custom domain (`syntrix-ks.com`)
- `.nojekyll` — disable Jekyll on GitHub Pages
- `robots.txt`, `sitemap.xml` — basic SEO hygiene

## Local preview

Any static file server works. For example:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy (GitHub Pages)

1. Push to the `main` branch of `syntrix-ks/syntrix-ks` (or the repo you've set up).
2. In **Settings → Pages**, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`.
3. Under **Custom domain**, enter `syntrix-ks.com`. The included `CNAME`
   file already pins this — GitHub will provision an SSL certificate
   once the DNS records resolve.
4. At your registrar, point DNS to GitHub Pages:
   - `A` records on the apex `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` on `www` → `<your-username>.github.io`
5. Enable **Enforce HTTPS** once the certificate is issued.
