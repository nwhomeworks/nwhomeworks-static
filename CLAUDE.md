# Notes for Claude

This repo is the **NW Homeworks marketing website** — a static site deployed via GitHub → Cloudflare Pages / Netlify on push to `main`. Standard pattern: each page is a folder with an `index.html`.

## `nwh-tool/` directory — leave alone

The pages under `nwh-tool/` are **not** part of the marketing site. They exist solely to satisfy Intuit's QuickBooks app review process for a separate project (a private internal job-costing tool that lives at `C:\Users\tim\Financial\nwh-tool\`).

- `nwh-tool/` — landing page describing the app (host domain + Launch URL + Connect/Reconnect URL on the Intuit form all point here)
- `nwh-tool/privacy/` — Privacy Policy
- `nwh-tool/eula/` — End-User License Agreement
- `nwh-tool/disconnected/` — confirmation page shown when a user disconnects the app from QuickBooks (Disconnect URL on the Intuit form)

### Rules

1. **Do not delete or "clean up" these pages.** They look orphan-y because nothing in the main nav links to them — that's intentional.
2. **Do not remove their `<meta name="robots" content="noindex, follow">`.** They must stay out of search results. Intuit reviewers reach them via direct URL only.
3. **Do not add them to `sitemap.xml`.** Same reason.
4. **Do not link them from the header, footer, or homepage.** They're not for site visitors.
5. **Do not "standardize" them into a different template.** They already match `privacy-policy/index.html`'s template (header, nav, fonts, CSS) deliberately so the URLs render branded for the reviewers.
6. **If the operator name, contact email, or governing-law jurisdiction in the page text needs to change** — that's a real update, do it. Just don't touch the noindex, the URL path, or the page existence.
7. **If their public URLs need to change** (`/nwh-tool/privacy/` or `/nwh-tool/eula/`), the corresponding Intuit Developer Portal entry must be updated too — those URLs are registered there. Don't move/rename without coordinating with the NWH Tool project.

### Why this matters

If these pages 404 (or get indexed and downranked), Tim's QuickBooks app loses production access. The risk is asymmetric: leaving them alone costs nothing; "cleaning them up" can break a production integration.

The source-of-truth drafts (markdown) live at `C:\Users\tim\Financial\nwh-tool\legal\`. If the HTML here gets out of sync with those, the markdown is canonical.
