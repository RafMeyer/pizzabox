# 🍕 PizzaBox

PizzaBox is a tiny experimental desktop browser built with **Electron / Chromium**.

## Features

- Multiple tabs
- New/close/select tab
- Back / forward / reload / home
- Address/search bar
- Page titles
- Cmd+L, Cmd+T, Cmd+W, Cmd+R on macOS
- Custom User-Agent: `PizzaBox/0.1`
- GitHub Pages / Codeberg Pages landing page in the repository root

## User-Agent

```text
Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) PizzaBox/0.1
```

PizzaBox uses Electron/Chromium, so its actual rendering engine is **Blink**. The `AppleWebKit/537.36` token is retained for compatibility.

## Run

```bash
npm install
npm start
```

## Build a macOS DMG

```bash
npm run dist:mac
```

The generated files go to `dist/`. Public macOS distribution without Gatekeeper warnings requires Apple Developer signing and notarization.

## GitHub Pages

The root already contains `index.html`. In GitHub: **Settings → Pages → Deploy from branch → main → / (root)**.

## Codeberg Pages

The same root `index.html` can be used as the static site content for Codeberg Pages.

## License

XYZ License 1.0.
