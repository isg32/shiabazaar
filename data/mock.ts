export type ProductType = "book" | "gift" | "ladies" | "gents";

export interface Product {
  id: string;
  slug: string;
  type: ProductType;
  title: string;
  author?: string;
  price: number;
  originalPrice?: number;
  coverImage: string;
  badge?: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  // book-specific
  isbn?: string;
  publisher?: string;
  language?: string;
  genre?: string;
  pageCount?: number;
  edition?: string;
  description?: string;
}

export interface Category {
  slug: string;
  label: string;
  description: string;
  icon: string;
  count: number;
}

// Base URL for all scraped images
const W = "https://shiabazaar.com/wp-content/uploads";

export const categories: Category[] = [
  { slug: "books", label: "Islamic Books", description: "Quran, tafsir, fiqh, history & duas", icon: "📖", count: 124 },
  { slug: "gifts", label: "Gifts", description: "Alam, mashak, mugs, lamps & more", icon: "🎁", count: 48 },
  { slug: "ladies", label: "Ladies", description: "Curated picks for women", icon: "✨", count: 36 },
  { slug: "gents", label: "Gents", description: "Curated picks for men", icon: "🤍", count: 29 },
];

export const featuredProducts: Product[] = [
  {
    id: "1",
    slug: "nahjul-balagha-urdu",
    type: "book",
    title: "Nahjul Balaga Urdu",
    author: "Imam Ali (AS)",
    price: 400,
    coverImage: `${W}/2025/08/61K7xs9V9vL._UF10001000_QL80_-1.jpg`,
    badge: "BESTSELLER",
    inStock: true,
    rating: 4.9,
    reviewCount: 212,
    language: "Urdu",
    genre: "Sermons & Letters",
    pageCount: 680,
    description: "The Peak of Eloquence — sermons, letters and sayings of Imam Ali ibn Abi Talib, translated into Urdu.",
  },
  {
    id: "2",
    slug: "tafseer-e-namoona-vol-1",
    type: "book",
    title: "Tafseer e Namoona Vol 1",
    author: "Ayatollah Nasir Makarem Shirazi",
    price: 400,
    coverImage: `${W}/2025/08/61K7xs9V9vL._UF10001000_QL80_.jpg`,
    badge: "NEW",
    inStock: true,
    rating: 4.8,
    reviewCount: 98,
    language: "Urdu",
    genre: "Tafseer",
    pageCount: 720,
    description: "A comprehensive and accessible Quranic commentary by Ayatollah Makarem Shirazi — Vol 1.",
  },
  {
    id: "3",
    slug: "tafseer-e-namoona-vol-2",
    type: "book",
    title: "Tafseer e Namoona Vol 2",
    author: "Ayatollah Nasir Makarem Shirazi",
    price: 400,
    coverImage: `${W}/2025/08/images-75.jpeg`,
    inStock: true,
    rating: 4.7,
    reviewCount: 74,
    language: "Urdu",
    genre: "Tafseer",
    pageCount: 740,
    description: "Continuation of the acclaimed Tafseer e Namoona series — Vol 2.",
  },
  {
    id: "4",
    slug: "alam-panja",
    type: "gift",
    title: "Alam Panja",
    price: 950,
    originalPrice: 1200,
    coverImage: `${W}/2026/06/pngtree-shia-alam-panja-design-ya-hussain-gazi-abass-alamdar-vector-png-image_9803932-800x800.png`,
    badge: "SALE",
    inStock: true,
    rating: 4.8,
    reviewCount: 63,
    description: "Traditional Shia Alam Panja — a symbol of Hazrat Abbas (AS). Beautifully crafted for home and processions.",
  },
  {
    id: "5",
    slug: "alam-panja-metal",
    type: "gift",
    title: "Alam Panja Metal",
    price: 980,
    originalPrice: 1200,
    coverImage: `${W}/2026/06/IMG-20260622-WA0015-removebg-preview.png`,
    badge: "FEATURED",
    inStock: true,
    rating: 4.9,
    reviewCount: 41,
    description: "Premium metal Alam Panja with fine finish. Durable and striking display piece.",
  },
  {
    id: "6",
    slug: "tafseer-e-saafi-vol-1",
    type: "book",
    title: "Tafseer e Saafi Vol 1",
    author: "Mulla Muhsin Faiz Kashani",
    price: 300,
    coverImage: `${W}/2021/06/images-39.jpeg`,
    inStock: true,
    rating: 4.9,
    reviewCount: 154,
    language: "Urdu",
    genre: "Tafseer",
    pageCount: 604,
    description: "One of the most authoritative Shia Quranic commentaries — Vol 1.",
  },
  {
    id: "7",
    slug: "alam-patka",
    type: "gift",
    title: "Alam Patka",
    price: 880,
    originalPrice: 900,
    coverImage: `${W}/2026/06/images__11_-removebg-preview-1-1.png`,
    inStock: true,
    rating: 4.6,
    reviewCount: 28,
    description: "Traditional Alam Patka for Muharram processions and home decoration.",
  },
  {
    id: "8",
    slug: "aadab-e-islami-vol-1",
    type: "book",
    title: "Aadab e Islami Vol 1",
    author: "Various Scholars",
    price: 225,
    coverImage: `${W}/2025/08/images-73.jpeg`,
    inStock: true,
    rating: 4.5,
    reviewCount: 67,
    language: "Urdu",
    genre: "Islamic Etiquette",
    pageCount: 280,
    description: "A guide to Islamic manners and etiquette — practical lessons for everyday life.",
  },
  {
    id: "9",
    slug: "aadab-e-islami-vol-2",
    type: "book",
    title: "Aadab e Islami Vol 2",
    author: "Various Scholars",
    price: 160,
    coverImage: `${W}/2025/08/images-74.jpeg`,
    inStock: true,
    rating: 4.4,
    reviewCount: 52,
    language: "Urdu",
    genre: "Islamic Etiquette",
    pageCount: 240,
    description: "Continuation of Aadab e Islami — deeper lessons on Islamic conduct.",
  },
  {
    id: "10",
    slug: "mashak",
    type: "gift",
    title: "Mashak (Brass)",
    price: 2850,
    originalPrice: 3000,
    coverImage: `${W}/2026/06/brass-mashak-religious-handicraft-removebg-preview.png`,
    badge: "SALE",
    inStock: true,
    rating: 4.9,
    reviewCount: 19,
    description: "Traditional brass Mashak — a sacred Shia religious handicraft, handcrafted with fine detail.",
  },
  {
    id: "11",
    slug: "aadab-e-haramain",
    type: "book",
    title: "Aadab e Haramain",
    author: "Various Scholars",
    price: 140,
    coverImage: `${W}/2025/08/images-47.jpeg`,
    inStock: true,
    rating: 4.6,
    reviewCount: 38,
    language: "Urdu",
    genre: "Pilgrimage",
    pageCount: 180,
    description: "Essential guide to the etiquette and duas for visiting the holy shrines.",
  },
  {
    id: "12",
    slug: "tafseer-e-saafi-vol-2",
    type: "book",
    title: "Tafseer e Saafi Vol 2",
    author: "Mulla Muhsin Faiz Kashani",
    price: 350,
    coverImage: `${W}/2021/06/images-40.jpeg`,
    inStock: false,
    rating: 4.8,
    reviewCount: 89,
    language: "Urdu",
    genre: "Tafseer",
    pageCount: 640,
    description: "The authoritative Shia Quranic commentary by Faiz Kashani — Vol 2.",
  },
];

// Subset used on the homepage featured grid
export const homepageFeatured = featuredProducts.slice(0, 8);

// Hero banner — sourced from shiabazaar.com logo/brand
export const heroBanner = {
  image: `${W}/2026/02/images-3.png`,
  headline: "Knowledge, Faith & Meaning — Delivered to Your Door",
  subline: "A curated store for the Shia community — sacred texts, scholarly works, and meaningful gifts.",
};

export const trustSignals = [
  { icon: "🚚", title: "Free Shipping", description: "On orders above ₹500" },
  { icon: "🔒", title: "Secure Payments", description: "Razorpay protected checkout" },
  { icon: "↩️", title: "Easy Returns", description: "7-day hassle-free returns" },
  { icon: "📦", title: "Careful Packaging", description: "Books packed to prevent damage" },
];
