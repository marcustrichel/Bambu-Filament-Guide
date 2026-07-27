# bambu-manager (BambuDB)

A web app for managing, sharing, and customizing 3D printing profiles, filament settings, and printers for Bambu Lab machines. Built with Vue 3 + Vite, backed by Supabase.

- **Using the app?** See the [User Guide](USER_GUIDE.md). Live at [draconas.org](https://draconas.org).
- **Working on the app?** See [DESIGN.md](DESIGN.md) for architecture, schema, and testing strategy.
- **Deploying it?** See [DEPLOYMENT.md](DEPLOYMENT.md) for the GitHub Pages + custom domain setup and security notes.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Testing

```sh
npm test          # unit + integration tests (Vitest) — per-test report + test-results/unit-report.json
npm run test:e2e  # end-to-end tests (Playwright) — per-test report + test-results/e2e-report.json + playwright-report/index.html
```

See [DESIGN.md § Testing Strategy](DESIGN.md#7-testing-strategy) for what each layer covers.
