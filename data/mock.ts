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

export const categories: Category[] = [
  { slug: "books", label: "Islamic Books", description: "Quran, tafsir, fiqh, history & duas", icon: "📖", count: 124 },
  { slug: "gifts", label: "Gifts", description: "Keychains, mugs, lamps & photo frames", icon: "🎁", count: 48 },
  { slug: "ladies", label: "Ladies", description: "Curated picks for women", icon: "✨", count: 36 },
  { slug: "gents", label: "Gents", description: "Curated picks for men", icon: "🤍", count: 29 },
];

export const featuredProducts: Product[] = [
  {
    id: "1",
    slug: "nahjul-balagha-english",
    type: "book",
    title: "Nahjul Balagha",
    author: "Imam Ali (AS)",
    price: 699,
    coverImage: "https://placehold.co/320x440/efe9de/141413?text=Nahjul+Balagha",
    badge: "BESTSELLER",
    inStock: true,
    rating: 4.9,
    reviewCount: 212,
    language: "English",
    genre: "Sermons & Letters",
    pageCount: 680,
    description: "The Peak of Eloquence — sermons, letters and sayings of Imam Ali ibn Abi Talib.",
  },
  {
    id: "2",
    slug: "mafatih-al-jinan",
    type: "book",
    title: "Mafatih Al-Jinan",
    author: "Sheikh Abbas Qummi",
    price: 549,
    coverImage: "https://placehold.co/320x440/efe9de/141413?text=Mafatih+Al-Jinan",
    badge: "NEW",
    inStock: true,
    rating: 4.8,
    reviewCount: 178,
    language: "Arabic / English",
    genre: "Duas & Ziyarat",
    pageCount: 920,
    description: "The essential companion for supplications, ziyarat and recommended acts.",
  },
  {
    id: "3",
    slug: "karbala-martyr-hussain",
    type: "book",
    title: "Karbala & the Imam Husayn",
    author: "Yousuf N. Lalljee",
    price: 399,
    coverImage: "https://placehold.co/320x440/efe9de/141413?text=Karbala",
    inStock: true,
    rating: 4.7,
    reviewCount: 95,
    language: "English",
    genre: "History",
    pageCount: 312,
    description: "A detailed account of the tragedy at Karbala and its enduring significance.",
  },
  {
    id: "4",
    slug: "ya-hussain-mug",
    type: "gift",
    title: "Ya Hussain Ceramic Mug",
    price: 299,
    originalPrice: 399,
    coverImage: "https://placehold.co/320x440/efe9de/141413?text=Ya+Hussain+Mug",
    badge: "SALE",
    inStock: true,
    rating: 4.6,
    reviewCount: 43,
    description: "Premium ceramic mug with Ya Hussain calligraphy. 350ml.",
  },
  {
    id: "5",
    slug: "islamic-night-lamp",
    type: "gift",
    title: "Ayatul Kursi Night Lamp",
    price: 849,
    coverImage: "https://placehold.co/320x440/efe9de/141413?text=Night+Lamp",
    badge: "FEATURED",
    inStock: true,
    rating: 4.8,
    reviewCount: 61,
    description: "Warm LED night lamp engraved with Ayatul Kursi. USB powered.",
  },
  {
    id: "6",
    slug: "quran-tajweed",
    type: "book",
    title: "Quran with Tajweed Rules",
    author: "Various Scholars",
    price: 799,
    coverImage: "https://placehold.co/320x440/efe9de/141413?text=Quran+Tajweed",
    inStock: true,
    rating: 4.9,
    reviewCount: 304,
    language: "Arabic",
    genre: "Quran",
    pageCount: 604,
    description: "Color-coded Tajweed Quran for easy recitation learning.",
  },
  {
    id: "7",
    slug: "hussain-keychain",
    type: "gift",
    title: "Ya Hussain Keychain",
    price: 149,
    coverImage: "https://placehold.co/320x440/efe9de/141413?text=Keychain",
    inStock: true,
    rating: 4.5,
    reviewCount: 88,
    description: "Stainless steel keychain with engraved Ya Hussain inscription.",
  },
  {
    id: "8",
    slug: "shia-fiqh-jurisprudence",
    type: "book",
    title: "Principles of Shia Fiqh",
    author: "Ayatollah Sistani",
    price: 650,
    coverImage: "https://placehold.co/320x440/efe9de/141413?text=Shia+Fiqh",
    inStock: false,
    rating: 4.7,
    reviewCount: 127,
    language: "English",
    genre: "Jurisprudence",
    pageCount: 520,
    description: "Practical rulings on everyday matters according to Ayatollah Sistani.",
  },
];

export const trustSignals = [
  { icon: "🚚", title: "Free Shipping", description: "On orders above ₹500" },
  { icon: "🔒", title: "Secure Payments", description: "Razorpay protected checkout" },
  { icon: "↩️", title: "Easy Returns", description: "7-day hassle-free returns" },
  { icon: "📦", title: "Careful Packaging", description: "Books packed to prevent damage" },
];
