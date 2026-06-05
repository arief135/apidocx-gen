# API Reference Builder (OpenUI5 + TypeScript)

A browser-only app for authoring and exporting API-reference documents. It boots
pre-loaded with the **OneFlux** reference (the seven REST Adapter endpoints), lets
you edit/add/remove endpoints and parameters through forms, renders a styled
preview that mirrors the source Word document, and exports a matching **`.docx`**.

Everything runs client-side — no server, no backend, no secrets. Suitable for
GitHub Pages.

## Features

- Styled, paper-like preview matching the source document (navy headings, green
  `POST` pills, parameter tables, code blocks, status pills).
- Side navigation (Overview + every endpoint).
- Edit mode: add / edit / delete endpoints, edit the parameter table, edit
  document-level metadata and conventions.
- **Export DOCX** — regenerates the Word document from the current content.
- **Export / Import JSON** — save or share a reference definition.
- **Print** — print stylesheet hides the chrome and prints the document only.
- Auto-saves to `localStorage`, so edits survive a refresh. **Reset** restores
  the original OneFlux content.

## Tech

- [OpenUI5](https://openui5.org/) (loaded from the CDN at runtime).
- TypeScript, transpiled to UI5 AMD modules by
  [`ui5-tooling-transpile`](https://www.npmjs.com/package/ui5-tooling-transpile).
- [`docx`](https://www.npmjs.com/package/docx) loaded as a UMD global for export.
- Build & serve via [UI5 Tooling](https://sap.github.io/ui5-tooling/) (`@ui5/cli`).

## Prerequisites

- Node.js 18+ and npm.
- Internet access (the app loads OpenUI5 and `docx` from public CDNs; the build
  resolves the OpenUI5 framework via UI5 Tooling).

## Develop

```bash
npm install
npm start            # serves at http://localhost:8080 and opens the app
```

Type-check without emitting:

```bash
npm run ts-typecheck
```

## Build

```bash
npm run build        # outputs static files to ./dist
```

The build transpiles all `.ts` to JavaScript. `dist/` is fully static — UI5 and
`docx` are still loaded from CDNs by `webapp/index.html`, so the output stays
small.

## Publish to GitHub Pages

### Option A — automated (recommended)

This repo includes `.github/workflows/deploy.yml`. Push to `main`, then in your
repo settings set **Settings → Pages → Build and deployment → Source = GitHub
Actions**. The workflow builds `dist/` and publishes it. Your app will be at:

```
https://<your-username>.github.io/<your-repo>/
```

Because app resources are referenced relatively and UI5/`docx` come from absolute
CDN URLs, hosting under a repo subpath works without extra configuration.

### Option B — manual

```bash
npm run build
# commit the contents of dist/ to a `gh-pages` branch, or copy them into /docs
# and set Settings → Pages → Source = main /docs
```

## Pinning UI5 versions

Two places reference the UI5 version — keep them aligned:

- runtime: the CDN URL in `webapp/index.html`
- tooling/types: `framework.version` in `ui5.yaml` and `@openui5/types` in
  `package.json`

## Project layout

```
webapp/
  index.html              CDN bootstrap (UI5 + docx) and app entry
  index.ts                creates the ComponentContainer
  Component.ts            seeds the JSON models
  manifest.json           app descriptor
  view/
    App.view.xml          ToolPage: side nav + toolbar + HTML preview
    EditEndpoint.fragment.xml
    EditDocInfo.fragment.xml
  controller/
    App.controller.ts     navigation, rendering, editing, exports
  model/
    types.ts              ApiReference / ApiEndpoint / ApiParam
    seedData.ts           the OneFlux content
    store.ts              localStorage load/save/reset
  util/
    PreviewBuilder.ts     builds the styled preview HTML
    DocxExporter.ts       builds the .docx (uses the global `docx`)
  css/style.css           document theme + print styles
  types/docx.d.ts         ambient type for the docx global
```

## Notes

- The DOCX exporter reproduces the source document's layout (US Letter, title
  page, table of contents, per-endpoint sections, parameter tables and code
  blocks). Open the file in Word and refresh the table of contents (it updates on
  open / via F9).
- `localStorage` is per-browser; use **Export JSON** to move content between
  machines.
