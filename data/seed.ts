export type AdminUser = {
  id: string;
  name: string;
  email: string;
  skinType: string;
  concern: string;
  scans: number;
  status: "Active" | "Inactive" | "Pending" | "Flagged";
  lastActive: string;
  signupDate: string;
  avatar: string;
};

export type AdminScan = {
  id: string;
  user: string;
  concern: string;
  hydration: number;
  oiliness: number;
  wrinkles: number;
  status: "Complete" | "Review" | "Flagged";
  date: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  sku?: string;
  description?: string;
  skinTypes?: string[];
  concerns?: string[];
  price: number;
  fit: number;
  stock: "In Stock" | "Low" | "Out";
  publishStatus?: "Active" | "Archived";
  image: string;
  tag?: string;
  matchLabel?: string;
  createdAt?: number;
  updatedAt?: number;
};

export type AdminPost = {
  id: string;
  title: string;
  topic: string;
  author: string;
  summary: string;
  imageUrl: string;
  published: boolean;
  isFeatured: boolean;
  mustRead: boolean;
  createdAt: number;
  updatedAt: number;
  /** Derived for UI badges */
  status: "Published" | "Draft";
  /** Formatted updatedAt for list display */
  updated: string;
  /** Alias of imageUrl for older UI bits */
  coverImage?: string;
};

export const SEED_USERS: AdminUser[] = [
  {
    id: "u1",
    name: "Adriana Lima",
    email: "adriana.l@vogue.co",
    skinType: "Combination",
    concern: "Barrier Repair",
    scans: 14,
    status: "Active",
    lastActive: "2 mins ago",
    signupDate: "Oct 24, 2024",
    avatar: "/assets/admin/avatar.png",
  },
  {
    id: "u2",
    name: "Benjamin Thorne",
    email: "ben.thorne@tech.io",
    skinType: "Dry",
    concern: "Dryness",
    scans: 4,
    status: "Active",
    lastActive: "12 mins ago",
    signupDate: "Oct 22, 2024",
    avatar: "/assets/admin/avatar.png",
  },
  {
    id: "u3",
    name: "Cecilia Vance",
    email: "c.vance@wellness.com",
    skinType: "Oily",
    concern: "Acne",
    scans: 22,
    status: "Active",
    lastActive: "1 day ago",
    signupDate: "Oct 19, 2024",
    avatar: "/assets/admin/avatar.png",
  },
  {
    id: "u4",
    name: "Devon Sterling",
    email: "devon@sterling.co",
    skinType: "Sensitive",
    concern: "Rosacea",
    scans: 1,
    status: "Inactive",
    lastActive: "3 days ago",
    signupDate: "Oct 14, 2024",
    avatar: "/assets/admin/avatar.png",
  },
  {
    id: "u5",
    name: "Elena Rostova",
    email: "elena.ros@vibe.ru",
    skinType: "Normal",
    concern: "Fine Lines",
    scans: 9,
    status: "Active",
    lastActive: "5 mins ago",
    signupDate: "Oct 09, 2024",
    avatar: "/assets/admin/avatar.png",
  },
];

export const SEED_SCANS: AdminScan[] = [
  {
    id: "s1",
    user: "Victoria Thorne",
    concern: "Dryness",
    hydration: 42,
    oiliness: 28,
    wrinkles: 35,
    status: "Complete",
    date: "Today, 08:12",
  },
  {
    id: "s2",
    user: "Eleanor Finch",
    concern: "Barrier",
    hydration: 61,
    oiliness: 48,
    wrinkles: 40,
    status: "Complete",
    date: "Today, 07:40",
  },
  {
    id: "s3",
    user: "Daphne Sterling",
    concern: "Rosacea",
    hydration: 55,
    oiliness: 33,
    wrinkles: 22,
    status: "Flagged",
    date: "Yesterday, 19:05",
  },
  {
    id: "s4",
    user: "Marcus Hale",
    concern: "Fine Lines",
    hydration: 70,
    oiliness: 44,
    wrinkles: 58,
    status: "Review",
    date: "Yesterday, 14:22",
  },
];

export const SKIN_TYPES = [
  "All Skin Types",
  "Dry",
  "Oily",
  "Combination",
  "Sensitive",
  "Acne-Prone",
];

export const CONCERNS = [
  "Aging",
  "Acne",
  "Dullness",
  "Redness",
  "Dehydration",
  "Large Pores",
  "Hyperpigmentation",
];

export const SEED_PRODUCTS: AdminProduct[] = [
  {
    id: "p1",
    name: "Luminova Hydra-Gold Squalane Elixir",
    brand: "Luminova",
    category: "Moisturizers & Oils",
    sku: "LMV-8042",
    description:
      "A lightweight, molecular-mimicking lipid serum designed to reinforce the epidermal barrier. Derived from 100% plant-based Olive Squalane and infused with colloidal gold nanoparticles for superior absorption and antioxidant protection.",
    skinTypes: ["Dry", "Sensitive"],
    concerns: ["Dullness", "Dehydration"],
    price: 48,
    fit: 94,
    stock: "In Stock",
    publishStatus: "Active",
    image: "/assets/admin/product-preview.png",
  },
  {
    id: "p2",
    name: "Aqua Barrier Serum",
    brand: "Pure Lab",
    category: "Serum",
    sku: "PL-2201",
    description: "Hydrating serum for barrier support.",
    skinTypes: ["All Skin Types"],
    concerns: ["Dehydration"],
    price: 36,
    fit: 79,
    stock: "In Stock",
    publishStatus: "Active",
    image: "/assets/product.png",
  },
  {
    id: "p3",
    name: "Soft Focus Gel",
    brand: "Scan+ Lab",
    category: "Gel",
    sku: "SPL-110",
    description: "Calming gel for reactive skin.",
    skinTypes: ["Sensitive", "Acne-Prone"],
    concerns: ["Redness", "Acne"],
    price: 29,
    fit: 91,
    stock: "Low",
    publishStatus: "Active",
    image: "/assets/product.png",
  },
  {
    id: "p4",
    name: "Niacinamide Control",
    brand: "Derm Co",
    category: "Treatment",
    sku: "DC-445",
    description: "Oil-control treatment with niacinamide.",
    skinTypes: ["Oily", "Combination"],
    concerns: ["Large Pores", "Acne"],
    price: 32,
    fit: 74,
    stock: "Out",
    publishStatus: "Archived",
    image: "/assets/product.png",
  },
];

export const SEED_POSTS: AdminPost[] = [
  {
    id: "b1",
    title: "Calming a Reactive Skin Barrier",
    topic: "Sensitive Skin",
    author: "Dr. Aris Cole",
    summary: "Barrier-first picks when your face stings after every product.",
    imageUrl:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
    published: true,
    isFeatured: false,
    mustRead: false,
    createdAt: 1792506070748,
    updatedAt: 1792506070748,
    status: "Published",
    updated: "Oct 24, 2026",
    coverImage:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80",
  },
  {
    id: "b2",
    title: "5 Morning Steps for Sensitive Skin",
    topic: "Routines",
    author: "Dr. Aris Cole",
    summary: "A gentle morning ritual for reactive skin.",
    imageUrl: "/assets/admin/article-cover.png",
    published: true,
    isFeatured: false,
    mustRead: true,
    createdAt: 1792300000000,
    updatedAt: 1792300000000,
    status: "Published",
    updated: "Oct 22, 2026",
    coverImage: "/assets/admin/article-cover.png",
  },
  {
    id: "b3",
    title: "Double Cleansing 101",
    topic: "Science",
    author: "Pure Lab",
    summary: "Do's and don'ts of double cleansing.",
    imageUrl: "/assets/admin/article-cover.png",
    published: false,
    isFeatured: false,
    mustRead: false,
    createdAt: 1792100000000,
    updatedAt: 1792100000000,
    status: "Draft",
    updated: "Oct 20, 2026",
    coverImage: "/assets/admin/article-cover.png",
  },
];

export const ACTIVITY = [
  {
    name: "Victoria Thorne",
    detail: "Completed Scan (Dryness)",
    time: "4 mins ago",
    warn: false,
  },
  {
    name: "Alistair Vance",
    detail: "Registered account",
    time: "18 mins ago",
    warn: false,
  },
  {
    name: "Eleanor Finch",
    detail: "Product matched: Barrier Cream",
    time: "1 hr ago",
    warn: false,
  },
  {
    name: "Daphne Sterling",
    detail: "Flagged concern: Rosacea",
    time: "2 hrs ago",
    warn: true,
  },
];

export const SCAN_BARS = [
  { day: "Mon", h: 77 },
  { day: "Tue", h: 105 },
  { day: "Wed", h: 132 },
  { day: "Thu", h: 99 },
  { day: "Fri", h: 160 },
  { day: "Sat", h: 187, hot: true },
  { day: "Sun", h: 171 },
];
