<div align="center">

<img src="og.png" alt="Software Hub logo" width="320" />

# Software Hub

**Simple, free apps for Windows, Linux and Android.**

Small, focused tools published directly by their author. Pick one and download it in a click.

<br />

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20Android-3ddc84?style=for-the-badge)
![License](https://img.shields.io/badge/license-Proprietary-000000?style=for-the-badge)
![Apps](https://img.shields.io/badge/apps-CCU%20%7C%20Remuneration%20Tracker-3776ab?style=for-the-badge)

<br />

[About](#-about) · [Features](#-features) · [Development](#-development) · [License](#-license)

</div>

---

## 🏁 About

Software Hub is a website that links to and helps install a collection of small desktop and mobile apps:

- **Chess Coach Utility (CCU)** — Cross-platform desktop tooling for chess coaches, tournament directors, and player development.
- **Remuneration Tracker** — Log your sessions, send tidy invoices and see what you have earned, all in one place.

All downloads go directly to the developer's published releases. No installers wrap the apps, no ads, no tracking — just a clean page with platform-appropriate downloads and install instructions.

## ✨ Features

- **Platform detection** — Shows a big download button for your detected operating system (Windows, macOS hint, Ubuntu/Debian, Fedora, Arch, Android).
- **Live version lists** — Reads releases directly from GitHub with a cached fallback, so the site keeps working even offline.
- **Lightbox gallery** — Click screenshots to enlarge; videos autoplay in the lightbox.
- **Changelog extraction** — Parses GitHub release notes into "New / Improved / Fixed" groups.
- **Requirements extraction** — Pulls "## Requirements" bullet lists from release notes.
- **Install guide** — Shows the exact command or steps for your distro on Linux.

## 🛠 Development

- `index.html` is a single self-contained file (HTML + CSS + JS).
- `worker/worker.js` is an optional Cloudflare Worker that caches releases, collects sign-ups, problem reports, and reviews.
- `worker/wrangler.toml` configures the Worker (repos, KV namespace, cron trigger).
- `.gitignore` protects local dev files.
- `screenshots/` holds images referenced by app data.
- `og.png` is the preview image shown when someone shares your link.

```bash
# Serve locally for testing
npx serve .        # or any static server

# Deploy the worker
cd worker
wrangler deploy
```

## 📄 License

Chess Coach Utility and Remuneration Tracker are provided by their author. Unless an app's own licence screen says otherwise:

- You may download, install and use a copy for your own purposes.
- You may not sell, share, rebrand or reverse engineer the apps without written permission.
- Some apps or features may need a licence or activation code.
- The apps are provided "as is", without any warranty.
