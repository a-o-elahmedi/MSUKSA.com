# MSU website (msuksa.com)

Static bilingual (English / Arabic) website for MSU — Marafi Shukran Almutahida. The build generates plain HTML pages with no server code or framework.

A portable Node.js is included in `.tools/`. In PowerShell, run this first:

```powershell
$env:PATH="$PWD\.tools\node-v24.21.0-win-x64;$env:PATH"
```

| Command | What it does |
|---|---|
| `npm run build` | Generates the site into `dist/` (pages, sitemap, robots.txt, `_headers`) |
| `npm run dev` | Local preview at http://127.0.0.1:3000/en/ |
| `npm test` | Static checks: links, assets, titles, canonical/hreflang, JSON-LD, phone/email, content rules |
| `npm run test:browser` | With `npm run dev` running: renders every page in Chrome at desktop/tablet/mobile and tests the menu, language switch and enquiry form. Pass a folder to save screenshots. |
| `npm run assets` | Re-creates the optimised images and public brochures from the original MSU source folders and `source-images/` (originals are kept outside `public/`; files marked `DO-NOT-PUBLISH` carry third-party logos) |

## Deployment (Oracle Cloud)

The site is hosted on the Oracle Cloud Ubuntu server `84.13.154.40` (SSH key `~/.ssh/oracle-msu`, user `ubuntu`). Files live in `/var/www/msuksa.com` and are served by Caddy, which also provides automatic HTTPS.

- **Deploy:** `.\scripts\deploy.ps1` builds, runs `npm test`, uploads, and swaps the new files in all at once.
- **Verify:** `$env:BASE_URL='https://msuksa.84-13-154-40.sslip.io'; npm run test:browser`
- **Caddy:** `/etc/caddy/Caddyfile` defines a `(msu_site)` snippet with the file server, security headers and 404 page. The same server also runs another app at `84-13-154-40.sslip.io`, so never replace the whole Caddyfile. Edit it, run `sudo caddy validate --config /etc/caddy/Caddyfile`, then `sudo systemctl reload caddy`.
- **Going live on msuksa.com:** at GoDaddy, set the `A` records for `@` and `www` to `84.13.154.40` and remove the current Cloudflare-hosted records. Then add this to the Caddyfile and reload:
  ```
  msuksa.com, www.msuksa.com {
  	import msu_site
  }
  ```
  Caddy obtains the certificates once DNS resolves to the server.

`dist/_headers` applies the same headers automatically if the site is ever moved to Netlify or Cloudflare Pages.

## Updating content

All copy lives in [src/content.mjs](src/content.mjs). Every text is a `pair('English', 'Arabic')`, so both languages are edited side by side.

- **Add a product:** add an object to `products` with a `slug` (becomes `/en/products/<slug>/`), `title`, `short`, `intro`, `specs`, `scope`, `exclusion` and `ask`. Optional fields:
  - `image` (a file in `public/assets/`) and `caption`
  - `icon` (`server`, `light`, `sign`), used when there is no image
  - `brochure` (expects `public/brochures/<brochure>-en.pdf` and `-ar.pdf`)
  - `approval` (only when there is a record for that specific product)

  The page, navigation links, sitemap, structured data and enquiry-form category are generated automatically.
- **Add a service:** add an object to `services` (`slug`, `number`, `title`, `short`, `meta`, `intro`, `points`, `ask`) and add the slug to `routes` in [scripts/build.mjs](scripts/build.mjs).
- Page layouts and fixed page copy (home, about, experience, contact) are in [scripts/build.mjs](scripts/build.mjs). Styles are in [public/styles.css](public/styles.css).
- Run `npm run build` and `npm test` after every change.

Content rules the checks enforce or that must be kept by hand:
- No invented years, project counts, certifications, prices, ratings or reviews.
- TAHAKOM is mentioned only as project experience, plus the product-specific security-room approval.
- The control-room table keeps a fixed 750 mm height and 650 mm depth.
- Renders stay labelled as conceptual.
- Internal drawings or fabrication files must never go into `public/`.

## Enquiry form

The site has no backend, so the form **does not send anything by itself**. After validation, it prepares an email to `info@msuksa.com` with all the fields. The visitor then opens it in their email application or copies the text. The page states clearly that nothing has been sent yet, so it never shows a false "submitted" message.

To deliver enquiries directly instead, connect a form service (for example Formspree, Web3Forms, or a Netlify/Cloudflare form function):

1. In [public/site.js](public/site.js), replace the `mailto` preparation in the submit handler with a `fetch(endpoint, {method:'POST', body:new FormData(form)})`.
2. Show the success message only when the response is `ok`. On failure, show an error and keep the email fallback.
3. Add the service's domain to `form-action` and `connect-src` in the `Content-Security-Policy` line of `scripts/build.mjs` (currently `form-action 'none'`).
4. Add spam protection (honeypot field or the provider's captcha), then rerun `npm run test:browser`.

## Search

Each page has a unique title, description, canonical URL, en/ar/x-default hreflang and JSON-LD (Organization, Service or Product). The JSON-LD contains no prices, ratings or street address. `robots.txt` allows all crawlers, explicitly including OAI-SearchBot, and points to `sitemap.xml`. After launch, submit the sitemap in Google Search Console and Bing Webmaster Tools.
