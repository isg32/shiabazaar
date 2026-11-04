# HANDOVER — shiabazaar

Written 2026-10-02 so a fresh conversation can pick up with full context. This file is scratch/communication, not part of the app — delete it once the next session has absorbed it (or it'll get deleted in a future commit, as happened last time one of these was written).

---

## 0. Right now — in order of urgency

1. **Unfinished: a button hover-visibility bug.** User reported: *"the button you added - when hovered the text stays white -- so no visibility -- make sure this issue is no longer existing -- push when done."* They did not say which button. I was mid-grep (searching for `text-white` paired with a hover class that lightens the background to the point the white text disappears) when the conversation ended. One grep hit so far, almost certainly NOT the culprit (checked it's just a 10%→20% white-overlay hover on a dark background, still readable):
   - `app/admin/images/page.tsx:174` — `bg-white/10 text-white hover:bg-white/20` (copy-URL icon button)

   **Next step:** broaden the search — try `grep -rn "text-white" app components --include="*.tsx"` and manually check every hover class next to it, especially anything recently touched this session (CategoryPicker, the Vendor/School desk pages, the delete-all modal, the import page's resolution panel, the admin orders page). Given "the button you added" (singular, recent), it's most likely one of the newer additions from this session rather than old code. If grepping doesn't surface it quickly, ask the user for a screenshot or the page URL — don't guess blindly and ship a fix for the wrong button.
   - **Once found and fixed: commit and push** (user explicitly asked for this). Branch is `feat/clerk-desk-foundation`, clean working tree as of now, 0 ahead/behind origin.

2. **Unconfirmed: did the production outage fix actually work?** See §1 below — I diagnosed and redeployed, verified the new deployment is `READY` and aliased to `shiabazaar.vercel.app`, but the conversation was interrupted before the user confirmed `/desk` actually loads now. **Don't assume it's fixed — verify** (visit `/desk` as a logged-in clerk/admin, or ask the user to confirm) before considering this closed.

---

## 1. The production outage that just happened (likely resolved, needs confirmation)

**What broke:** `/desk` (and anything else querying orders by channel) started throwing a generic "Server Components render" error in production.

**Root cause:** I ran a schema migration (`20260928120000_vendor_and_buyer_type` — see §3) directly against the production Neon database that **removed `'school'` as a valid value of the `SalesChannel` Postgres enum** (replaced by a new, independent `buyerType` field). But **production was not running the matching code** — this project does NOT auto-promote every push on `feat/clerk-desk-foundation` to production; deploys apparently require an explicit promote/redeploy. Production was frozen 3 commits behind, still running code that queries `channel: "school"` directly — a value the live enum no longer has. Every such query threw a raw Postgres "invalid input value for enum" error, which is a hard crash in a Server Component.

**Lesson for next time:** when a migration changes/removes an enum value or otherwise breaks backward compatibility with already-deployed code, **deploy the compatible code to production in the same breath as the migration** — don't assume a push auto-promotes. Check `vercel list_deployments` / the project's actual production alias target *before* assuming what's live.

**Fix applied:**
- Found the live production deployment via `get_deployment` on `shiabazaar.vercel.app` → it was aliased to commit `bf66a346` (3 behind HEAD).
- Triggered a redeploy targeting production of the latest commit (`5153606`) via the Vercel MCP `create_deployment` tool (`request_promote` was tried first and 422'd — not sure why, redeploy-via-`create_deployment` worked instead).
- Confirmed via `get_deployment` on the new deployment ID: `state: "READY"`, `target: "production"`, alias list now includes `shiabazaar.vercel.app`.
- **Not yet confirmed:** that this actually fixed the user's symptom. Go check.

---

## 2. This project's Vercel deployment quirk (important, will bite you again)

- Project: `shiabazaar`, project ID `prj_0y2LZs4fr9gYpjd3aqq1NWSgGNiX`, team slug `radhes-projects-27adf98f`, team ID `team_N3rbx49mkXc9F18MDPmtghqi`.
- Git remote: `isg32/shiabazaar` on GitHub. Working branch this whole session: `feat/clerk-desk-foundation` (not merged to `main`).
- **Pushing to the branch does NOT appear to auto-promote to production.** Confirmed by the outage above — several commits sat live-but-not-promoted. After any schema-affecting push, explicitly check what's actually aliased to `shiabazaar.vercel.app` (`get_deployment` with `idOrUrl: "shiabazaar.vercel.app"`) rather than assuming the latest push is live.
- To promote: `create_deployment` with `{name: "shiabazaar", project: "<project id>", deploymentId: "<existing READY deployment id>", target: "production"}` reliably works. `request_promote` did not (422, cause unknown, didn't investigate further since the alternative worked).
- **Vercel MCP auth is scoped oddly.** Omitting `teamId` entirely works for most calls (`list_projects`, `invalidate_by_tags`, `create_deployment`, `get_deployment`). Passing the team ID or slug explicitly sometimes causes a 403 ("Not authorized: trying to access resource under scope...") — seen on `invalidate_by_tags` first (fixed by dropping `teamId`) and again on `get_runtime_errors`/`get_runtime_logs` (tried both the numeric team ID and the slug, both 403 — these two specific log-reading endpoints may just need a higher permission tier than this token has; didn't resolve, gave up and diagnosed from code + a direct DB repro script instead, which worked fine).
- Local `vercel` CLI is authenticated as `isg32` (confirmed via `vercel whoami`) — usable as a fallback for polling/inspecting if the MCP tools misbehave. CLI is outdated (59.10.0 → 62.2.0 as of last check); not urgent to upgrade.
- **Cache invalidation**: `mcp__plugin_vercel_vercel__invalidate_by_tags` with `{tags: [...], target: "production"}` and no `teamId` works to bust the Next.js Data Cache (`unstable_cache` tags like `"products"`, `"homepage"`) without a redeploy. Used this earlier in the session to fix stale homepage images after a direct-DB product wipe/reimport.

---

## 3. Database / schema state (Neon)

- Project points at Neon branch `ep-delicate-band-addk6cij` (`.env.local` `DATABASE_URL`/`DIRECT_URL`). There is a second, unrelated Neon branch — don't confuse them.
- `DATABASE_URL` is pooled (pgbouncer); `DIRECT_URL` is the same host unpooled, used only for Prisma CLI migration commands. **`DIRECT_URL` is NOT set in Vercel's env vars at all** (checked via `filter_project_envs`) — this is harmless, because `prisma generate` (the only Prisma CLI step in the Vercel build script `"build": "prisma generate && next build"`) doesn't actually need `DIRECT_URL` to resolve, only `prisma validate`/`migrate` do, and those never run as part of the Vercel build.
- **Long-running/interactive Prisma transactions against the pooled `DATABASE_URL` can fail** (`P2028`/connection drop) — this bit me earlier in the session during a bulk operation. When running ad-hoc scripts that do a multi-statement `$transaction`, prefer `DIRECT_URL` (unpooled) for the connection: `export DATABASE_URL="$(grep '^DIRECT_URL' .env.local | cut -d= -f2- | tr -d '"')"`.
- **Schema is current as of commit `5153606`.** Full current model list: `User, Address, Product, ProductImage, ProductVariant, Order, OrderItem, CartItem, Wishlist, Review, Coupon, ReturnRequest, ShippingZone, Category, ProductCategory, Banner, HomepageFeatured, HomepagePopularBook, Popup, School, SchoolPayment, Vendor, VendorPayment, StockMovement`. Read `prisma/schema.prisma` directly for exact fields — don't trust a stale summary here.
- **Sales channel / buyer type model** (the most recent and most important architectural piece — read `CLAUDE.md`'s "Sales channels & buyer types" section, it's accurate and current): `Order.channel` is ONLY `online | offline` (Website vs Physical Store). `Order.buyerType` is the independent `individual | vendor | school` dimension. `Vendor`/`VendorPayment` are exact mirrors of `School`/`SchoolPayment`. `lib/desk-orders.ts` (`createDeskOrder`/`updateDeskOrder`/`cancelDeskOrder`) is generic across all three buyer types.
- Migration history lives in `prisma/migrations/`, all applied directly to prod via `prisma migrate deploy` run locally (not via any CI/CD — there isn't one). When adding a migration: write the SQL by hand when it's anything non-trivial (enum shrinking, data backfill ordering) rather than trusting raw `prisma migrate diff` output verbatim — see `20260928120000_vendor_and_buyer_type/migration.sql` for the pattern (backfill before enum-cast, wrapped in its own `BEGIN/COMMIT`).

---

## 4. What's been built this session (condensed timeline)

This was one very long session. Rough chronology, newest-relevant-first:

1. **Clerk desk foundation** (`/desk` route group) — offline sales, school book-credit ledger, shared inventory with the online storefront, stock movement audit ledger, role gating (`isClerk`/`isAdmin`, `requireClerk()` in `lib/staff-guard.ts`). This was the original ask and is fully built and working.
2. **Bulk stock entry** — CSV import/export gained a `stock` column + `default_stock` batch default, admin product/book forms gained a stock field, admin inventory page got inline editing.
3. **Admin "Delete all products" button** — keeps products referenced by past orders, deletes the rest + dependent rows atomically.
4. **Categories became many-to-many tags** (was single `categoryId`) — new `ProductCategory` join table, subcategory tree support, a shared `CategoryPicker` component (search + comma-separated quick-add) reused across all 4 product/book forms, CSV bulk category import with `parent_name` support for subcategories.
5. **Found and fixed real bugs along the way** (worth knowing about if something looks subtly wrong):
   - The categories refactor initially had a data-loss bug (editing a product without re-selecting categories wiped them) — fixed.
   - Bulk product CSV import silently dropped ALL category tags for a while due to a column-name mismatch (`category_name` vs `category_names`) — found live, 1183/1309 already-imported products had zero categories. Fixed with backward-compat column support so the same CSV can be re-uploaded to backfill.
   - Built an **interactive unmatched-category resolution** flow in the bulk product importer — when a CSV references a category that doesn't exist yet, the admin is prompted per-name: auto-create / adjust (pick group + parent) / skip, instead of silently dropping it.
6. **Bulk-assigned 1168 real book cover images** via a one-off Python script (`/home/isg32/dev/shiabazaar_script/assign_covers.py`) that matched scraped cover filenames to product titles and uploaded to Cloudinary + created `product_images` rows. ~17 covers were left unmatched on purpose (ambiguous multi-volume series) rather than guessed.
7. **Vendor entity + channel/buyerType split** (commit `5153606`, the most recent, largest architectural change) — see §3. Triggered by the user bringing a "TM Sales & Business Intelligence Dashboard" PDF spec (`/home/isg32/Downloads/TM Sales & Business Intelligence Dashboard.pdf`) that wants a full BI/reporting layer. This commit is the **foundation** for that spec — Vendor as a first-class credit entity, proper channel/buyer-type separation — but **the actual reporting/BI layer itself (KPI cards, trend graphs, drill-downs, credit ageing, alerts, per-line discount tracking, walk-in customer identity, broader RBAC, report exports) has NOT been built yet.** That's the next big piece of work whenever the user wants to resume it.

The full plan/progress file with much more detail on every phase is at `/home/isg32/.claude/plans/understand-the-whole-project-declarative-swan.md` — it's long but has the real reasoning behind every architectural decision, including the PDF-spec understanding checkpoint and the exact mapping of PDF requirements to what exists vs. what's missing.

---

## 5. Working conventions established this session (follow these)

- **Every non-trivial DB write gets verified against the real database in a rolled-back transaction** before being trusted — `db.$transaction(async (tx) => { ...assertions...; throw ROLLBACK; })` pattern, used dozens of times this session. Don't just trust `tsc`/build passing for anything touching money, stock, or ledgers.
- **`tsc --noEmit` + `eslint` + `next build` all clean before every commit.** No exceptions made this session except one pre-existing, unrelated `<a>`-tag lint warning that predates all this work (CSV export download link) — don't try to fix that, it's known and intentionally left.
- **Every `db.order.*` query outside `/desk`+`/api/desk/**` must filter `channel: "online"`** — otherwise offline/school/vendor activity leaks into storefront/admin metrics. This is a standing rule, documented in `CLAUDE.md`.
- Commit messages are long and explain *why*, not just *what* — matches the existing git history style. Keep doing that.
- When doing a raw/direct DB write that bypasses the app (scripts, SQL console), remember to `revalidateTag("products", "max")` / `"homepage"` equivalent afterward — or the storefront serves stale cached data. Use the Vercel MCP `invalidate_by_tags` tool if there's no easy app-level way to trigger it.

---

## 6. Open/deferred items (not urgent, just so nothing's forgotten)

- The actual BI/reporting layer from the PDF spec — not started beyond the Vendor/buyerType foundation.
- Per-line-item discount/MRP tracking (needed for the PDF's discount analysis reports) — `OrderItem` currently only snapshots `price` × `qty`.
- Credit ageing buckets, alerts/exceptions engine, broader RBAC (5 roles per the PDF vs current binary admin/clerk), report exports (Excel/CSV/PDF) — all explicitly deferred, documented in the plan file's "Understanding checkpoint" section.
- Walk-in (individual, offline) customers have no persistent identity — just a free-text name/phone snapshot — so customer retention/segmentation reporting isn't possible for that segment without adding one.
