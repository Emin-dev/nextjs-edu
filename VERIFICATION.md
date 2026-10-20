# Verification

Use Node.js 24 and run:

```sh
npm ci
npm audit --audit-level=low
npm run lint
npm run build
npm run typecheck
npx --no-install playwright install --with-deps chromium
npm run test:smoke
```

Sharp 0.35.5 requires Node.js 20.9.0 or newer. The dependency repair was checked locally on Node.js 24.19.0.

## Browser smoke scope
The workflow builds and serves the app on loopback only, using fresh synthetic browser data at desktop and mobile viewport sizes. Tests check rendering, runtime/hydration errors and 404 behavior. They never follow outbound links or submit to external services. Remote task artwork is fulfilled from a test fixture before any image-provider request, so synthetic IDs stay local. This does not verify the live image provider or production deployment.

GitHub Actions uses a standard Ubuntu runner, a read-only repository token and pinned official actions. No credentials are retained by checkout; no secrets, cache or deployment steps are used. Synthetic desktop/mobile screenshots and test diagnostics are uploaded as a short-lived browser-evidence artifact (one-day retention) for visual inspection. No production or personal data is used.

## Biome lint gate

`npm run lint` runs pinned Biome 2.5.15 with warnings treated as failures. It checks all source/config/test JavaScript and TypeScript. Generated output is excluded; formatting and assists are disabled. The recommended rules, React/Next domains and explicit async-client, script-placement, synchronous-script and CommonJS-import checks are enabled. There are no new suppression directives or disabled rules.

Next.js 15.5.27, React 19.1.0 and all existing locked dependencies are preserved. Biome and its platform binaries are development-only additions. Use the full dependency audit, including development dependencies. The official Next.js 15 ESLint configuration still brings the unpatched braces advisory and requires the EOL ESLint 9 line; it is not installed alongside Biome.

## Coverage differences and release checks

Biome is a supported Next.js alternative with different rule coverage. A pass does not establish equivalence to `next/core-web-vitals` plus `next/typescript`. Missing mapped Next checks include internal raw-anchor navigation, stylesheet tags, duplicate Head components, page-specific custom fonts and Script inside Head. Review these patterns explicitly when introduced. Keep TypeScript, production build and appropriate browser tests as separate gates.

Official references: [Next.js 15.5](https://nextjs.org/blog/next-15-5), [Biome comparison](https://biomejs.dev/introduction/comparison-with-other-tools/), [current rule mapping](https://biomejs.dev/linter/javascript/sources/), [ESLint support](https://eslint.org/version-support/), [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

This repair remains a draft until the exact current commit passes its GitHub Actions suite and desktop/mobile screenshots are reviewed. Historical passing browser/CI results for earlier commits do not verify later changes. No merge or deployment is part of this verification workflow. Hosting selection and the actual production Node runtime remain separate release gates.

## Dependency-tree qualification

On the checked Linux installation, `npm ls --all --json` exits 0 but reports extraneous `@img/sharp-wasm32@0.35.5` and `@emnapi/runtime@1.11.3`. Both optional lockfile entries and the same annotations predate the Biome changes. Sharp's platform-specific FreeBSD/WebContainers wrappers reference the WASM package. This is not a clean-tree claim; packages have not been removed or force-pruned. The full audit reports zero known findings.

## Repair-branch deployment guard

`vercel.json` disables Vercel Git deployments only for `security/next15-patches-20261008`, following [Vercel's Git configuration](https://vercel.com/docs/project-configuration/git-configuration). Other branches retain their default behavior. This is defense in depth for the repair branch, not proof of hosting disconnection or a guarantee against manual or other-provider deployments. No hosting project is created by these changes.
