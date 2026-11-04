# Shia Bazaar

An e-commerce store for Islamic/religious books, gifts, and curated products. Built with Next.js 16, Tailwind CSS v4, and shadcn/ui.

---

## Build Phases

| Phase | Scope | Status |
|---|---|---|
| **1 — Design** | All pages and components built with static/mock data. No live integrations. | ✅ Complete |
| **2 — DB + Storage** | Neon (Postgres) + Prisma + Cloudinary. Real products, orders, images. | Pending |
| **3 — Auth** | Firebase Auth + Admin SDK. Login, register, protected routes. | Pending |
| **4 — Payments** | Razorpay checkout + webhook. Live order flow. | Pending |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Neon (serverless Postgres) — Phase 2 |
| ORM | Prisma — Phase 2 |
| Auth | Firebase Auth — Phase 3 |
| Storage | Cloudinary — Phase 2 |
| Payments | Razorpay — Phase 4 |
| Deploy | Vercel |

---

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm run lint       # eslint
```

Copy `.env.example` to `.env.local` before starting (Phase 1 needs no real values — all data is mocked):

```bash
cp .env.example .env.local
```

---

## Project Structure

```
app/
  (store)/          # Public storefront — shares Navbar + Footer
    page.tsx          # Homepage
    products/         # /products listing + /products/[slug] detail
    category/[slug]/  # Category pages
    cart/             # Cart
    checkout/         # 3-step checkout
    order/[id]/       # Order confirmation + status tracker
    login/            # Auth pages
    register/
    forgot-password/
    account/          # Customer dashboard (orders, wishlist, reviews, profile)
    search/           # Search results
    about/            # Static pages
    contact/
    returns/
    privacy/
    terms/

  (admin)/          # Admin panel — dark sidebar layout, no public nav
    admin/            # /admin dashboard, products, orders, inventory,
                      # coupons, users, homepage editor, image library

components/
  layout/           # Navbar, Footer
  shared/           # ProductCard, Badge
  ui/               # shadcn/ui components

data/
  mock.ts           # Mock products, categories, trust signals (Phase 1 only)

lib/
  utils.ts          # cn() utility
```

---

## Design System

Based on the Anthropic/Claude.com editorial design system, adapted for e-commerce. Full token reference in `design.md`.

**Palette:** Warm cream canvas `#faf9f5` · Coral primary `#cc785c` · Dark navy `#181715`

**Fonts:** Cormorant Garamond (display headlines) · Inter (body/UI) · JetBrains Mono (code/order IDs)

**Key rules:**
- Serif display at weight 400 with negative letter-spacing — never bold, never Inter for headlines
- Dark surfaces on hero band and footer only — rest of site stays cream
- Color-block elevation: depth via cream-vs-dark contrast, box-shadow only on card hover
- Islamic geometric pattern dividers between major page sections
- Coral used only on primary CTAs and full-bleed callout cards

---

## Pages Checklist

### Storefront
- [x] `/` — Homepage (dark hero, category tiles, featured products, coral callout, trust signals)
- [x] `/products` — All products with filter sidebar + sort
- [x] `/category/[slug]` — Category listing (books, gifts, ladies, gents)
- [x] `/products/[slug]` — Product detail with metadata table, star ratings, reviews, related
- [x] `/cart` — Cart with qty controls, coupon input, free shipping threshold, order summary
- [x] `/checkout` — 3-step: Address → Shipping → Payment (dark Razorpay card)
- [x] `/order/[id]` — Order confirmation + visual status tracker + tracking placeholder
- [x] `/search` — Search bar + results grid

### Auth
- [x] `/login` — Email + password
- [x] `/register` — Full registration form
- [x] `/forgot-password` — Email reset (email integration deferred)

### Account Dashboard
- [x] `/account` — Stats cards + recent orders
- [x] `/account/orders` — Order list + status badges + tracking + return request
- [x] `/account/wishlist` — Saved products grid
- [x] `/account/reviews` — Reviews written by user
- [x] `/account/profile` — Personal info, saved addresses, change password

### Admin (`/admin/*` — dark sidebar layout)
- [x] `/admin` — KPI cards + recent orders table + top products
- [x] `/admin/products` — Product table with thumbnails, edit/delete
- [x] `/admin/orders` — Inline status update + tracking number input
- [x] `/admin/inventory` — Stock qty inputs + low-stock alert thresholds
- [x] `/admin/coupons` — Create coupon form + coupon table with toggle/delete
- [x] `/admin/users` — User table with ban/unban
- [x] `/admin/homepage` — Hero banners (upload/reorder/toggle), featured products, popups
- [x] `/admin/images` — Cloudinary image library grid with upload zone

### Static
- [x] `/about`
- [x] `/contact`
- [x] `/returns`
- [x] `/privacy`
- [x] `/terms`
