# Progressive Web App (PWA)

This app ships **install-friendly** PWA plumbing: web app manifest, icons, viewport/theme metadata, optional safe-area shell polish, and a **minimal** service worker that caches **static icon assets only**.

## Configuration

| Piece | Location |
| --- | --- |
| Web App Manifest | [`src/app/manifest.ts`](../src/app/manifest.ts) (Next.js App Router → `/manifest.webmanifest`) |
| Theme colors (shared) | [`src/lib/pwa-config.ts`](../src/lib/pwa-config.ts) |
| Viewport + head metadata | [`src/app/layout.tsx`](../src/app/layout.tsx) (`viewport`, `metadata.appleWebApp`, `metadata.icons`) |
| Icons (committed assets) | [`public/icons/`](../public/icons/) |
| Service worker | [`public/sw.js`](../public/sw.js) |
| SW registration (client) | [`src/components/pwa/register-service-worker.tsx`](../src/components/pwa/register-service-worker.tsx) |

### Brand colors (manifest + browser chrome)

These hex values match the default **dark** DPS palette (`--background` / `--primary` in `globals.css`):

- **Background / splash base:** `#1a1a1a`
- **Theme / status bar accent:** `#ff6b00`

## Install flows (expectations)

- **Android (Chrome):** “Install app” or “Add to Home screen” uses the manifest; the app opens in **standalone** (minimal browser UI).
- **iOS (Safari):** Share → **Add to Home Screen**; launches with `apple-web-app-capable` behavior. Use a **real** `apple-touch-icon` (we ship `public/icons/apple-touch-icon.png`).

## Offline support (honest scope)

- **Authenticated features, Supabase, and `/api/*` routes require network.** There is no offline workout sync or offline auth story.
- **Service worker:** precaches and serves from cache **only** the PNGs under `/icons/*` listed in `public/sw.js`. It does **not** cache HTML, JS bundles, or API responses.
- If the service worker fails to register, the app still works in the browser; installability may still apply via manifest depending on the platform.

## Service worker toggles

- **Production:** registration runs automatically (`/sw.js`).
- **Development:** registration is **off** by default (avoids stale caches while iterating). To test locally, set in `.env.local`:

  ```bash
  NEXT_PUBLIC_ENABLE_PWA_SW=true
  ```

See also [`.env.example`](../.env.example).

## Replacing branded icons

Keep filenames stable **or** update every reference:

1. [`src/app/manifest.ts`](../src/app/manifest.ts) — `icons[].src`
2. [`src/app/layout.tsx`](../src/app/layout.tsx) — `metadata.icons`
3. [`public/sw.js`](../public/sw.js) — `PRECACHE_URLS` (if those assets should stay precached)

Recommended sizes:

- `icon-192.png` — 192×192  
- `icon-512.png` — 512×512  
- `icon-maskable-512.png` — 512×512 with **padding** inside the safe zone (maskable)  
- `apple-touch-icon.png` — 180×180 (common iOS target)

## Verification

- `npm run type-check`
- `npm test`
- Manual: Lighthouse PWA (best-effort), iOS Add to Home Screen (standalone + top safe area), Android Install.
