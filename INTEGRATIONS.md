# Integrations — API, MCP & GitHub → Site

This document explains the three ways the site can be driven programmatically:

1. **HTTP API** — the CMS/content and AI-tools API the site already serves.
2. **MCP server** — connect the site to **Claude** so it can read/edit content.
3. **GitHub → Site** — anything pushed to GitHub is deployed to the live site,
   and content committed to Git is synced into the live database.

---

## 1. HTTP API

Base URL = your site origin (e.g. `https://my-website.pages.dev`).

### Auth

```
POST /api/auth      { "username": "...", "password": "..." }  →  { "ok": true, "token": "..." }
GET  /api/auth      Authorization: Bearer <token>            →  { "ok": true, "username": "..." }
```

Send `Authorization: Bearer <token>` on every admin call below. The token is
short-lived; just log in again when it expires.

### Content (the whole CMS state)

```
GET  /api/content                       →  { ok, data: <ContentState>, updatedAt }   (public read)
PUT  /api/content   { "data": <ContentState> }  →  { ok, updatedAt }                 (admin only)
```

`data` is one JSON object with sections like `PERSONAL_INFO`, `PRODUCTS`,
`PRODUCTS_PAGE_DATA`, `AI_TOOLS_CONFIG`, etc. A PUT replaces the whole blob, so
read → modify → write. Max 5 MB. Blog comments are stored separately and are
stripped from the blob automatically.

### Paid AI tools

```
GET  /api/tools                         →  { ok, items: [ grants… ] }               (admin)
GET  /api/tools?view=messages           →  { ok, items: [ usage log… ] }            (admin)
GET  /api/tools?view=settings           →  { ok, items: [ per-tool AI conn (masked) ] } (admin)
POST /api/tools   { action, … }         →  grant | revoke | resetDevices | setKey | clearKey (admin)
POST /api/tools   { action: "unlock" | "chat" | "session", … }                      (public)
```

API keys live only server-side and are **never** returned in full (only masked).

---

## 2. MCP server (connect the site to Claude)

The MCP server lives in [`mcp/`](./mcp). It wraps the API above as MCP tools so
Claude can manage the site conversationally.

```bash
cd mcp && npm install
```

Then add it to Claude Desktop / Claude Code — see **[mcp/README.md](./mcp/README.md)**
for the exact config snippet and the full tool list. Configure it with
`SITE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` (your Cloudflare admin secrets).

Content Claude edits via MCP is written to the **live database**. To keep Git as
the source of truth, run `npm run content:export` afterwards (see below).

---

## 3. GitHub → Site

Hosting is **Cloudflare Pages** (Pages Functions + D1). Two GitHub Actions
workflows keep the live site in step with the repo:

| Workflow | Trigger | Effect |
|----------|---------|--------|
| `.github/workflows/deploy.yml` | any push to `main` | build + `wrangler pages deploy dist` |
| `.github/workflows/sync-content.yml` | push to `main` changing `content/site-content.json` | push that content into the live DB |

### Required GitHub repo secrets

Settings → Secrets and variables → Actions → **New repository secret**:

| Secret | Used by | Value |
|--------|---------|-------|
| `CLOUDFLARE_API_TOKEN` | deploy | Cloudflare token with *Pages: Edit* + *D1: Edit* |
| `CLOUDFLARE_ACCOUNT_ID` | deploy | your Cloudflare account id |
| `SITE_URL` | content sync | live site URL, e.g. `https://my-website.pages.dev` |
| `ADMIN_USERNAME` | content sync | same as the Pages secret |
| `ADMIN_PASSWORD` | content sync | same as the Pages secret |

> The Pages **project name** in `deploy.yml` (`--project-name=my-website`) and in
> `wrangler.toml` (`name = "my-website"`) must match your real Cloudflare Pages
> project. Rename both if yours differs.

> D1 tables/columns are created automatically at runtime by the API
> (`ensureTables`), so no migration step runs in CI. To apply schema manually:
> `npx wrangler d1 execute <DB> --remote --file=./schema.sql`.

### Content as code (round-trip)

`content/site-content.json` is the versioned copy of the site content.

```bash
npm run content:gen      # (re)generate the file from the app's built-in defaults
npm run content:export   # live site  → content/site-content.json  (pull live edits into Git)
npm run content:import   # content/site-content.json → live site   (what CI runs)
```

All three read `SITE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` from the
environment. Typical loop:

1. Edit content — either commit a change to `content/site-content.json`, **or**
   edit via the admin panel / Claude MCP and then `npm run content:export`.
2. Push to `main`. `deploy.yml` redeploys the code; if the content file changed,
   `sync-content.yml` pushes it live.

> ⚠️ Because pushing `content/site-content.json` overwrites the live content,
> pick **one** primary way to edit content (Git *or* the live panel) and use
> `content:export` / `content:import` to reconcile the other.
