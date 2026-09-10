# AGENTS.md

Vanilla JavaScript Pomodoro timer PWA. No framework, no build step, no lint config, no real test suite. Express serves static files straight from the repo root.

## Run & verify
- `npm start` (or `npm run dev`) serves the app at `http://localhost:8000` (override with `PORT`).
- `npm test` is a stub that prints "no test specified" — never rely on it. Manual browser testing is the only verification path.

## Service worker cache
`sw.js` serves navigations network-first (cached `./index.html` offline fallback) and static assets stale-while-revalidate, so edits show up without manual cache bumps. If you add a **new static file**, add it to the `ASSETS` array (`index.html`, `style.css`, `app.js`, `pixel-visual.js`, `manifest.json`) so it is precached for offline use.

## Architecture
- No API; `server.js` is a static file server only.
- Timer logic lives in `app.js` (driven from `index.html`); `style.css` is plain CSS, no preprocessor.
- The pixel-art fisherman scene (sprites, canvas rendering, animation loop) lives in `pixel-visual.js`, a plain global script loaded before `app.js`; it exposes `window.PixelVisual.init()` and `.setPhase()`, and `app.js` drives the phase from timer state.
- Settings persist to `localStorage` key `pomodoro-settings` (work/break minutes, volume, autoStart, visual, theme).
- Countdown uses an absolute `endTimestamp` recomputed on a 100ms interval (not a decrement), so it stays accurate under tab throttling.
- Alarm uses the Web Audio API; the `AudioContext` is only resumed from a user gesture (Start button calls `primeAudio()`), so some headless flows may fail silently.