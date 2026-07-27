# Deployment

BambuDB is a static Vite/Vue build, deployed to **GitHub Pages** at **draconas.org** via GitHub Actions. The backend (Supabase) is unchanged — deployment only affects where the frontend is served from.

## One-time setup

Do these once, in order. Steps 1–2 are manual (no `gh` CLI / GitHub token was available to automate them from this environment); step 3 has already been done for you.

### 1. Repository settings (github.com → this repo → Settings)

- **General → Danger Zone → Change visibility → Make public.** GitHub Pages requires a public repo unless you're on a paid GitHub plan (Pro/Team/Enterprise). Git history was checked before recommending this — no secrets are in it (see *Security notes* below for what a scan found).
- **Pages → Build and deployment → Source:** `GitHub Actions` (not "Deploy from a branch").
- **Pages → Custom domain:** enter `draconas.org`, save. It'll show unverified until the DNS in step 2 propagates — then check **Enforce HTTPS** once it's available (GitHub provisions a Let's Encrypt cert automatically after DNS verifies; this checkbox doesn't appear until then).
- **Secrets and variables → Actions → New repository secret** (add both):
  - `VITE_SUPABASE_URL` = `https://ohzosdwdzshlciphtyuw.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_KzwA6ymg7A52u3mfmDpyFw_-PG63uQZ`

  (Same values as your local `.env`. This key is meant to be public — see *Security notes* — but keeping it in a secret rather than hardcoded in the workflow file makes it a one-place edit if the project ever changes.)
- **Branches → Add branch ruleset/rule for `main`:**
  - Require a pull request before merging (apply to everyone, including admins/yourself).
  - Require status checks to pass before merging → select **Unit & Integration Tests** and **End-to-End Tests**. These come from `.github/workflows/ci.yml` and only appear in the picker after that workflow has run at least once — merge this setup PR first (it'll trigger CI), then come back and add the rule.
  - Recommended: also require branches to be up to date before merging.

### 2. DNS at your registrar (for draconas.org)

| Type | Host | Value |
|---|---|---|
| A | @ (apex/root) | `185.199.108.153` |
| A | @ | `185.199.109.153` |
| A | @ | `185.199.110.153` |
| A | @ | `185.199.111.153` |
| CNAME | `www` | `marcustrichel.github.io` |

The four A records are GitHub Pages' fixed IPs (identical for every custom domain on Pages). The `www` CNAME is optional — only add it if you want `https://www.draconas.org` to also resolve. DNS propagation ranges from minutes to ~48 hours; GitHub shows a green check next to the custom domain field in Settings → Pages once it sees the right records.

### 3. Supabase Auth config — already done

Updated via the Supabase Management API this session:
- **Site URL:** `https://draconas.org`
- **Redirect allow-list:** `https://draconas.org/**`, `https://www.draconas.org/**`, `http://localhost:5173/**` (kept so local dev password-reset testing keeps working)

This is required for the "Forgot password?" and admin password-reset-email flows (Section 4.1/4.7 in `DESIGN.md`) to redirect back to the real domain instead of failing or bouncing to `localhost:3000` (the Supabase default). If you ever change domains again, update this in the Supabase dashboard under **Authentication → URL Configuration**, or ask me to do it via the Management API again.

## How deploys work

- **`.github/workflows/ci.yml`** — runs on every pull request targeting `main`, and on every push to `main`: unit/integration tests (Vitest) and end-to-end tests (Playwright, against a network-mocked Supabase so it's deterministic and touches no real data). This is the required status check for branch protection.
- **`.github/workflows/deploy.yml`** — runs only on push to `main` (i.e., after a PR merges, or via manual `workflow_dispatch`): re-runs the unit suite as a last safety net, builds with the real secrets baked in via Vite's `import.meta.env`, and publishes the `dist/` output to GitHub Pages using the official `actions/upload-pages-artifact` + `actions/deploy-pages`.
- A merge to `main` should be live at `https://draconas.org` within a few minutes.

## Security notes

- **The anon key being public is expected, not a leak.** `VITE_SUPABASE_ANON_KEY` gets compiled into the public JS bundle — that's how every Supabase client-side app works. It grants no access on its own; all real authorization is enforced by Postgres Row Level Security (`DESIGN.md` §3–4), which is designed to be safe even when the anon key and the exact API shape are fully public.
- **No `service_role`/secret key is ever in the frontend.** It's only used server-side in the `update-user-email` Edge Function (`DESIGN.md` §6); the browser never sees it.
- **Git history was scanned before recommending "make public"** — no database password, `service_role` key, or personal access token appears anywhere in it. The only historical secret-shaped value in an old commit is the *anon* key for a since-abandoned Supabase project (also meant to be public).
- **GitHub Pages cannot set custom HTTP response headers.** There's no way to serve a real `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, etc. — it's a static host with fixed headers set by GitHub. `index.html` ships a best-effort CSP via `<meta http-equiv="Content-Security-Policy">` as partial defense-in-depth, but browsers ignore `frame-ancestors` and `report-uri` when set this way — there's no way to prevent this site from being iframed by another site without a real header (e.g., by fronting Pages with Cloudflare, or moving to a host that sets headers natively).
- **HTTPS is automatic and required** — GitHub issues and renews a Let's Encrypt certificate once the custom domain verifies. Make sure "Enforce HTTPS" ends up checked so plain `http://` requests redirect instead of being served insecurely.
- **Branch protection + required CI** mean nothing reaches `main` — and therefore production — without a passing test suite and a reviewed pull request, once you finish the Settings step above.
