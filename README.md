# shreelak.github.io

Personal site. Built with Astro. Hosted free on GitHub Pages.

## Local dev

```
npm install
npm run dev
```

## Build

```
npm run build
```

Output lands in `dist/`.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages. First time only: in the repo settings, set Pages →
Source to "GitHub Actions."

## Custom domain later

Drop a `CNAME` file in `public/` with the bare domain, add DNS records at
your registrar, and reload. No code change.

## Editing content

- Homepage copy: `src/pages/index.astro` and the components it uses.
- Cases: `src/pages/work.astro`.
- Roots page: `src/pages/roots.astro`.
- Writing links: the `published` and `talks` arrays at the top of
  `src/pages/writing.astro`.
- Colors and type scale: `src/styles/tokens.css`.

## Confidentiality guardrail

`scripts/check-anon.mjs` greps the built site for a denylist of customer names
and revenue patterns. Run `npm run build` and then `node scripts/check-anon.mjs`
before pushing.
