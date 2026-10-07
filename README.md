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

## Analytics

Off by default. To turn on:

1. Create a free account at https://www.goatcounter.com and pick a code
   (the subdomain, e.g. `shreelak` for `shreelak.goatcounter.com`).
2. Put that code in `goatcounter` in `src/site.config.ts`.
3. Commit and push. The deploy workflow does the rest.

With the value empty, no analytics script is emitted and the site makes
zero third-party requests.

Dashboard: `https://<code>.goatcounter.com`

### Tagging links

GoatCounter reads `utm_source`, `ref`, `src` or `source` from the query
string, so a link you hand to a specific company can be attributed:

    https://shreelak.github.io/?ref=company-name

Those show up under Campaigns in the dashboard. Use `ref`, not `via`,
which GoatCounter ignores.
