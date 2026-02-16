# Vicknick Video Pool Desktop

Production-ready Electron desktop application for **Vicknick Video Pool** with a premium DJ-focused shell, secure web embedding, and integrated download manager.

## Features

- Secure desktop container for `https://www.vicknickvideopool.com`
- Persistent login session via isolated persistent Electron partition
- Strict domain allowlist and external-link sandboxing
- Download manager with:
  - save location prompt
  - progress tracking
  - transfer speed display
  - pause / resume / cancel controls
- Dark modern UI with splash screen
- Keyboard shortcuts:
  - `Ctrl/Cmd + R`: reload web app
  - `Ctrl/Cmd + Shift + D`: toggle download manager
- Future-ready service scaffolds for:
  - auto updates
  - push notifications
  - subscription verification
  - analytics
  - admin upload tool

## Project Structure

```text
.
├── build/
│   └── icons/
├── src/
│   ├── main/
│   │   ├── services/
│   │   ├── constants.js
│   │   ├── download-manager.js
│   │   ├── index.js
│   │   └── security.js
│   ├── preload/
│   │   ├── index.js
│   │   └── webview.js
│   └── renderer/
│       ├── app.js
│       ├── index.html
│       ├── splash.html
│       └── styles.css
├── eslint.config.js
└── package.json
```

## Security Defaults

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- CSP for renderer pages
- allowlisted navigation only to `vicknickvideopool.com`
- unknown domains are opened externally in default browser

## Getting Started

### 1) Download the project

```bash
git clone <your-repo-url>
cd vicknick
```

### 2) Install dependencies

```bash
npm install
```

### 3) Run locally

```bash
npm start
```

## Build Installers

### Build Windows Installer (.exe)

```bash
npm run build:win
```

Output will be placed in `dist/`.

### Build macOS Installer (.dmg)

```bash
npm run build:mac
```

Output will be placed in `dist/`.

> Note: building macOS artifacts generally requires macOS, and code-signing/notarization is required for public distribution.

## Production Notes

- Add real icon assets at:
  - `build/icons/icon.ico`
  - `build/icons/icon.icns`
- Configure code signing and notarization for release channels.
- Hook future service scaffold modules to backend APIs when ready.
