# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**shiabazaar** — single-store e-commerce for Islamic/religious books, gifts, and general products (ladies/gents categories). Physical goods only. Single admin.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Neon (serverless Postgres) |
| ORM | Prisma (`prisma/schema.prisma`, migrations in `prisma/migrations/`) |
| Auth | Neon Auth (Stack Auth) — email + password only |
| File storage | Cloudinary — signed uploads server-side, store URL/ID in Postgres |
| Payments | Razorpay — webhook at `app/api/webhooks/razorpay/` |
| Email | Coming soon — deferred |
| Deploy | Vercel |

## Build phases

| Phase | Scope | Status |
|---|---|---|
| 1 — Design | Scaffold Next.js, Tailwind, shadcn/ui. Build all pages and components with static/mock data. No live integrations. | **Complete** |
| 2 — DB + Storage | Wire Neon (Prisma) + Cloudinary. Products, images, orders persisted. | **Current** |
| 3 — Auth | Neon Auth (Stack Auth). Login, register, protected routes, admin middleware. | Pending |
| 4 — Payments | Razorpay checkout + webhook. Live order flow. | Pending |

During Phase 1 all data is hardcoded or mocked. No API keys are needed.

---

## Architecture principles

- **Server Components** for product/category/book pages (SEO + performance).
- **Client Components** only for: cart, checkout form, payment flow, wishlist toggles.
- **Neon Auth** middleware verifies session before trusting any user identity server-side. User records live in Postgres alongside all other tables — no separate auth service.
- **Single admin** — role is hardcoded via env var (`ADMIN_EMAIL`), no role management system needed.
- **Cart**: persistent in DB for logged-in users; localStorage for guests; merge on login.
- **Cloudinary**: API secret never exposed to client — uploads go through a signed Route Handler. All assets stored under the `shiabazaar/` root folder (see folder structure below).
- **Razorpay webhook**: always verify signature before updating order status.
- No separate API layer — Next.js Route Handlers (`app/api/`) cover all backend needs.

## Cloudinary folder structure

All assets live under `shiabazaar/` in Cloudinary:

```
shiabazaar/
  products/
    [product-slug]/      ← all images for a specific product
  banners/               ← homepage hero banners (admin-uploaded)
  categories/            ← category tile images
  misc/                  ← popups, promotional images, other one-offs
```

- Public IDs follow the pattern `shiabazaar/products/[slug]/[filename]`
- Signed uploads via `POST /api/upload` — returns `{ url, public_id }`
- `public_id` stored in `product_images.cloudinary_id`; `url` stored in `product_images.url`
- Deletes go through the same Route Handler using the stored `public_id`

## Design system

Closely follows the Anthropic/Claude.com editorial design system, adapted for e-commerce. Full token + component reference: `design.md`.

---

### Colors

#### Brand & accent
| Token | Hex | Use |
|---|---|---|
| Primary (coral) | #cc785c | Primary CTA buttons, callout cards, text links |
| Primary Active | #a9583e | Press/hover on coral elements |
| Primary Disabled | #e6dfd8 | Disabled coral button |
| Accent Teal | #5db8a6 | Stock "available" indicators, success dots |
| Accent Amber | #e8a55a | Category badge highlights, inline labels |

#### Surfaces
| Token | Hex | Use |
|---|---|---|
| Canvas | #faf9f5 | Page floor — warm cream, never pure white |
| Surface Soft | #f5f0e8 | Section divider bands |
| Surface Card | #efe9de | Product cards, feature cards, info cards |
| Surface Cream Strong | #e8e0d2 | Active category tab, emphasized bands |
| Surface Dark | #181715 | Hero band + footer only |
| Surface Dark Elevated | #252320 | Cards inside dark surfaces (admin dark panels) |
| Surface Dark Soft | #1f1e1b | Code block backgrounds inside dark cards |
| Hairline | #e6dfd8 | 1px borders on cream surfaces |
| Hairline Soft | #ebe6df | Barely-visible dividers within a same-tone band |

#### Text
| Token | Hex | Use |
|---|---|---|
| Ink | #141413 | All headlines, primary text |
| Body Strong | #252523 | Emphasized paragraphs, lead text |
| Body | #3d3d3a | Default running text |
| Muted | #6c6a64 | Breadcrumbs, secondary labels, meta info |
| Muted Soft | #8e8b82 | Captions, fine print, copyright |
| On Primary | #ffffff | Text on coral buttons |
| On Dark | #faf9f5 | Text on dark surfaces (echoes canvas) |
| On Dark Soft | #a09d96 | Footer body text, secondary labels in dark |

#### Semantic
| Token | Hex | Use |
|---|---|---|
| Success | #5db872 | In-stock indicator, order confirmed |
| Warning | #d4a017 | Low stock warning |
| Error | #c64545 | Form validation errors, out of stock |

---

### Typography

#### Font families
| Role | Font | Fallback stack |
|---|---|---|
| Display / headlines | Cormorant Garamond 400 | `EB Garamond, Garamond, "Times New Roman", serif` |
| Body / UI / buttons | Inter 400–500 | `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| Code / order IDs | JetBrains Mono | `monospace` |

**Rules:** Display stays at weight 400, never bold. Negative letter-spacing on all display sizes is non-negotiable. Never use Inter for h1–h3.

#### Type scale
| Role | Size | Weight | Line Height | Tracking | Font |
|---|---|---|---|---|---|
| Display XL | 64px | 400 | 1.05 | -1.5px | Cormorant |
| Display LG | 48px | 400 | 1.1 | -1px | Cormorant |
| Display MD | 36px | 400 | 1.15 | -0.5px | Cormorant |
| Display SM | 28px | 400 | 1.2 | -0.3px | Cormorant |
| Title LG | 22px | 500 | 1.3 | 0 | Inter |
| Title MD | 18px | 500 | 1.4 | 0 | Inter |
| Title SM | 16px | 500 | 1.4 | 0 | Inter |
| Body MD | 16px | 400 | 1.55 | 0 | Inter |
| Body SM | 14px | 400 | 1.55 | 0 | Inter |
| Caption | 13px | 500 | 1.4 | 0 | Inter |
| Caption Uppercase | 12px | 500 | 1.4 | +1.5px | Inter |
| Button | 14px | 500 | 1.0 | 0 | Inter |
| Nav Link | 14px | 500 | 1.4 | 0 | Inter |

**E-commerce additions:**
- Price: Display SM (28px) Cormorant on product detail; Title MD (18px) Inter 600 on product cards
- "Add to cart", "Buy now": Button (14px / 500 Inter)

---

### Spacing scale

Base unit: 4px.

| Token | Value | Use |
|---|---|---|
| xxs | 4px | Tight icon gaps |
| xs | 8px | Badge padding (vertical), input inner gaps |
| sm | 12px | Inline element gaps |
| md | 16px | Default element spacing |
| lg | 24px | Compact card padding, connector tiles |
| xl | 32px | Feature card padding, product card padding |
| xxl | 48px | Callout card padding |
| section | 96px | Between every major page band |

---

### Border radius scale

| Token | Value | Use |
|---|---|---|
| xs | 4px | Badge accents, tiny dropdowns |
| sm | 6px | Small inline buttons, dropdown items |
| md | 8px | CTA buttons, text inputs, category tabs |
| lg | 12px | Product cards, feature cards, info cards |
| xl | 16px | Hero banner container, large promo cards |
| pill | 9999px | Badge pills, stock tags, coupon chips |
| full | 50% | Avatar circles, icon buttons |

---

### Elevation & depth

Color-block first — shadows are rare. Depth comes from cream-vs-dark surface contrast.

| Level | Treatment | Where used |
|---|---|---|
| Flat | No shadow, no border | Page bands, nav, hero |
| Soft hairline | 1px `#e6dfd8` border | Inputs, product cards on canvas, filter chips |
| Cream card | `#efe9de` background, no shadow | Product cards, feature cards |
| Dark surface | `#181715` background, no shadow | Hero band, footer |
| Subtle drop | `0 1px 3px rgba(20,20,19,0.08)` | Hover-elevated card state only |

---

### Button variants

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | #cc785c (coral) | #ffffff | none | Main CTA — "Add to Cart", "Buy Now", "Place Order" |
| Primary Active | #a9583e | #ffffff | none | Press state |
| Secondary | #faf9f5 (canvas) | #141413 | 1px hairline | Secondary actions — "Save to Wishlist", "Continue Shopping" |
| Secondary on Dark | #252320 | #faf9f5 | none | Buttons inside hero band or footer dark surface |
| Text Link | transparent | #cc785c (coral) | none | Inline links — "View details", "Sign in" |
| Icon Circular | #faf9f5 | ink icon | 1px hairline | Carousel arrows, share, wishlist toggle |

All buttons: height 40px · padding 12px × 20px · radius 8px · Inter 14px / 500. Minimum touch target 40 × 40px.

---

### Badges & tags

| Variant | Background | Text | Use |
|---|---|---|---|
| Pill (neutral) | #efe9de | #141413 | Genre tag, language tag, category label |
| Pill (coral) | #cc785c | #ffffff | "NEW", "BESTSELLER", "FEATURED" |
| Pill (amber) | #e8a55a | #141413 | "ON SALE", discount highlight |
| Pill (success) | #5db872 | #ffffff | "IN STOCK" |
| Pill (error) | #c64545 | #ffffff | "OUT OF STOCK" |

All badges: Caption Uppercase (12px / 500 / +1.5px tracking) · padding 4px × 12px · pill radius.

---

### Forms & input states

| State | Treatment |
|---|---|
| Default | Canvas background · 1px `#e6dfd8` border · Inter 16px · radius 8px · height 40px |
| Focused | Border shifts to `#cc785c` (coral) · 3px coral-at-15%-alpha outer ring |
| Error | Border `#c64545` · error message in Body SM below field |
| Disabled | Background `#f5f0e8` · text `#8e8b82` · no interaction |
| Success | Border `#5db872` · optional checkmark icon |

Apply to: search bar, coupon field, checkout address fields, login/register fields, review textarea, admin form inputs.

---

### Components — store-adapted

#### Top nav
64px · canvas background · "shiabazaar" wordmark (Cormorant Garamond) left · nav links center (Shop, Categories, About) · right cluster: Search icon, Wishlist icon, Cart icon with item count badge, "Sign In" text link. Collapses to hamburger < 768px (full-screen cream sheet).

#### Hero band
Dark surface (#181715) · 6/6 grid: left — Display LG headline + body + coral primary button; right — admin-uploaded banner image in `xl` radius container. Stacks single-column on mobile, image below content.

#### Product card (book-cover dominant)
Surface Card (#efe9de) background · radius lg (12px) · image takes ~65% of card height · below image: Title SM, author in Muted, price in Inter 600, stock badge. Subtle drop shadow on hover. Entire card tappable.

#### Category tile grid
Adapted from connector-tile grid. Used on homepage "Browse by Category" section. 4-up desktop · 3-up tablet · 2-up mobile. Each tile: canvas background · hairline border · radius lg · 20px padding · category icon + Title SM label + short description. Tappable card.

#### Coral callout card (with image)
Full-width coral band (#cc785c) · radius lg · padding xxl (48px) · split layout: left — Display SM headline + sub-line + cream secondary button (canvas bg on coral); right — promotional product image or book cover. Used for featured promotions, seasonal sale banners. Admin-configurable.

#### Feature/info cards
Surface Card (#efe9de) background · radius lg · padding xl (32px) · small icon top · Title MD headline · Body MD description. Used on homepage for trust signals ("Free Shipping", "Secure Payments", "Easy Returns").

#### Dark product mockup card
Surface Dark (#181715) · radius lg · padding xl · On Dark text. Used inside the hero band and in admin analytics cards. Buttons inside use `Secondary on Dark` variant.

---

### Responsive behavior

#### Breakpoints
| Name | Width | Key changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav · hero stacks (content then image) · product grid 1-up · category tiles 2-up · pricing 1-up · footer 1-col |
| Tablet | 768–1024px | Nav stays horizontal · product grid 2-up · category tiles 3-up |
| Desktop | 1024–1440px | Full nav · product grid 3–4-up · category tiles 4-up |
| Wide | > 1440px | Max content width caps at 1200px, more outer breathing room |

#### Touch targets
- All buttons: minimum 40 × 40px
- Text inputs: height 40px
- Category tiles: entire card tappable (effective area >> 44px)
- Icon buttons (wishlist, cart, circular): 36 × 36px visually, padded to 44px tap area

#### Collapsing strategy
- Nav: hamburger at < 768px, opens as full-screen cream sheet
- Hero: 6/6 → single column, image below content
- Product grids: reduce columns, never scale cards down
- Coral callout card: split → stacks (image above, text below) on mobile
- Category tile grid: 4 → 3 → 2 columns

---

### Logo & cultural accents

- **Logo**: "shiabazaar" wordmark in Cormorant Garamond 400 — text only for now
- **Cultural accent**: Light Islamic geometric patterns used sparingly as section dividers (SVG hairline motif) and subtle card border accents. Not prominent. Cream-on-cream or coral-on-cream at low opacity only.

---

## Commands

> Update once scaffolded.

```bash
npm run dev                  # dev server
npm run build                # production build
npm run lint                 # eslint
npx prisma migrate dev       # apply migrations (dev)
npx prisma migrate deploy    # apply migrations (prod / CI)
npx prisma studio            # visual DB browser
npx prisma generate          # regenerate client after schema changes
```

## Product catalog

Four product types, one unified products table with a `type` discriminator:

| Type | Extra metadata |
|---|---|
| `book` | author, ISBN, publisher, language, genre, pageCount, edition, description, tableOfContents |
| `gift` | — (title, description, images, variants) |
| `ladies` | — (admin defines freely) |
| `gents` | — (admin defines freely) |

**Variants** — non-book products support variants (color, design, etc.). Each variant has its own stock count and optionally its own price.

## Pages

### Public storefront
- `/` — Hero banner + category grid + featured products + popup (admin-controlled)
- `/products` — All products with search + filters (price, category, language, availability)
- `/category/[slug]` — Category listing page
- `/products/[slug]` — Product detail (full metadata for books, variants for others, reviews, add to cart/wishlist)
- `/cart` — Cart page
- `/checkout` — Checkout (guest or logged-in), address, shipping, coupon, payment
- `/order/[id]` — Order confirmation / status + courier tracking link
- `/search` — Search results

### Auth
- `/login` — Email + password sign in
- `/register` — Account creation
- `/forgot-password` — Password reset via Neon Auth

### Customer account (requires login)
- `/account` — Dashboard
- `/account/orders` — Order history + return request flow
- `/account/profile` — Profile + saved addresses
- `/account/wishlist` — Saved products
- `/account/reviews` — Reviews left by user

### Static pages
- `/about`, `/contact`, `/privacy`, `/terms`, `/returns` — Static content

### Admin (`/admin/*`, protected by middleware)
- `/admin` — Analytics dashboard (sales, revenue, top products)
- `/admin/products` — Product list + add/edit/delete + variant management
- `/admin/orders` — Order list, update status, add tracking link
- `/admin/inventory` — Stock levels per product/variant
- `/admin/coupons` — Create/manage discount codes (% or flat)
- `/admin/users` — User list, ban/unban
- `/admin/homepage` — Manage hero banners, featured products, popups
- `/admin/images` — Image library (Cloudinary)

## Key features

- **Reviews**: verified buyers only (linked via completed order)
- **Wishlist**: login required, persisted in DB
- **Shipping**: weight + location based — needs shipping zones table
- **Coupons**: admin-created, % or flat discount, apply at checkout
- **Returns**: customer raises request in account → admin reviews in `/admin/orders`
- **Notifications**: email (order confirmation + shipping update) — coming soon, deferred; WhatsApp/SMS also deferred
- **SEO**: `generateMetadata` per page, sitemap, robots.txt

## Security

- Rate limiting on `/api/auth/*` and `/api/checkout` (Upstash or `next-rate-limit`)
- Razorpay webhook signature verified before any DB write
- `/admin/*` blocked in middleware for non-admin users
- CSP + security headers in `next.config.ts`
- Cloudinary signed uploads — secret stays server-side

## Key DB tables (evolve as schema is built)

- `products` — catalog with type discriminator
- `product_variants` — per-variant stock + price for non-book products
- `product_images` — Cloudinary URLs per product
- `orders` — status, Razorpay payment ID, tracking URL
- `order_items` — line items (product + variant + qty + price snapshot)
- `cart_items` — persistent cart for logged-in users
- `wishlists` — saved products per user
- `reviews` — rating + text, gated by completed order
- `coupons` — code, type (% / flat), value, expiry, usage limit
- `return_requests` — linked to order, status, reason
- `users` — Neon Auth user ID, ban status, extended profile
- `addresses` — saved addresses per user
- `shipping_zones` — weight + location rules
- `banners` / `popups` — admin-controlled homepage content
