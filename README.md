# Online Coaching 4u

Static website for comparing coaching institutes, schools and student hostels.

## Structure

- `website-src/data.json` — all listings and brand settings (edit this)
- `website-src/build.js` — generates the site
- `website/` — generated output (don't edit by hand)

## Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/log in (free).
2. Install Vercel CLI: `npm i -g vercel` — or connect a GitHub repo instead.
3. From this folder, run: `vercel --prod`
4. Done. Vercel runs `node website-src/build.js` automatically and serves the `website/` folder with clean URLs (e.g. `/coaching-sikar`).

## After first deploy

1. Copy your live URL (e.g. `https://online-coaching-4u.vercel.app` or your custom domain).
2. Paste it into `website-src/data.json` → `brand.siteUrl` (used for canonical URLs and sitemap.xml).
3. Update `brand.phone` / `brand.whatsapp` in `data.json` AND the `WHATSAPP` constant in `website-src/app.js` with your real number.
4. Redeploy: `vercel --prod`
5. Submit `https://your-domain/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).

## Adding / editing listings

Edit `website-src/data.json`, then run `npm run build` to regenerate locally, or just push/deploy — Vercel rebuilds automatically.

## Note on images

Listing photos currently load from academycheck's CDN (`cf.academycheck.com`). Replace with your own hosted images before serious launch — their CDN could block hotlinking or remove files at any time.
