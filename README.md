# FitPlan

Personal gym + meals app for two accounts (Michele, Lucy). Plain HTML/CSS/JS, no build step.
Standalone project: it shares nothing with any other project or server.

## Files

- `index.html`, `styles.css`, `app.js` — the app (screens and actions)
- `logic.js` — dates, week plan, shopping list, weight conversion (pure functions)
- `store.js` — data layer: this device only (local mode) or Firebase (accounts + sync)
- `seed.js` — default workout plan and recipes for a new account
- `firebase-config.js` — empty = local mode; filled = Firebase
- `firestore.rules` — database rules (only the two accounts can read/write)
- `sw.js`, `manifest.webmanifest`, `icon-*.png` — install on the iPhone home screen, offline
- `tests.html` — logic tests; open it in the browser, the title shows PASS or FAIL

## Run on this PC

Double-click `start-local.bat` (needs Python), or serve the folder with any static server.

## Go live (free)

1. Firebase console → new project → Authentication (Email/Password, add the two users) and
   Firestore (production mode).
2. Paste the web app config into `firebase-config.js`.
3. Put the two User UIDs (Authentication → Users) in `firestore.rules` and publish the rules in the console.
4. Host the folder on any static host (GitHub Pages, Firebase Hosting, Cloudflare Pages) and add
   that domain under Authentication → Settings → Authorized domains.
5. On the iPhone: open the site in Safari → Share → Add to Home Screen.
