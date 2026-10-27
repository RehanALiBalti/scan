import {
  SEED_POSTS,
  SEED_PRODUCTS,
  SEED_SCANS,
  SEED_USERS,
  type AdminPost,
  type AdminProduct,
  type AdminScan,
  type AdminUser,
} from "@/data/seed";
import { apiFetch, canUseAdminApi } from "./apiClient";
import type { ContactMessage } from "./contactUs";
import type { RoutineCheckDoc, RoutineTask } from "./routineChecks";

const LS = {
  products: "admin_products_v2",
  posts: "admin_posts_v2",
};

function readLocal<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export async function listUsers(): Promise<AdminUser[]> {
  if (!canUseAdminApi()) return SEED_USERS;
  try {
    const data = await apiFetch<{ users: AdminUser[] }>("/api/users");
    return data.users;
  } catch {
    return SEED_USERS;
  }
}

export type UserProfileData = {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    clientSince: string;
    primarySkinType: string;
    skinType: string;
    sensitivity: string;
    ageRange: string;
    gender: string;
    concerns: string[];
  };
  scans: {
    id: string;
    when: string;
    hydration: number;
    label: string;
    concern: string;
  }[];
  routine: {
    id: string;
    slot: string;
    name: string;
    price: number;
    image: string;
  }[];
};

export async function getUserProfile(id: string): Promise<UserProfileData> {
  if (!canUseAdminApi()) {
    const u = SEED_USERS.find((x) => x.id === id) || SEED_USERS[0]!;
    return {
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        clientSince: u.signupDate,
        primarySkinType: `${u.skinType} / Sensitive`,
        skinType: u.skinType,
        sensitivity: "Sensitive",
        ageRange: "",
        gender: "",
        concerns: [u.concern, "Dehydration", "Redness / Rosacea"].filter(Boolean),
      },
      scans: SEED_SCANS.slice(0, 3).map((s, i) => ({
        id: s.id,
        when: ["Oct 24, 2024 (14:32)", "Oct 10, 2024 (11:15)", "Sep 28, 2024 (09:45)"][
          i
        ]!,
        hydration: s.hydration,
        label: s.hydration < 45 ? "Low" : "Mild Dry",
        concern: s.concern,
      })),
      routine: SEED_PRODUCTS.slice(0, 3).map((p, i) => ({
        id: p.id,
        slot: ["Serums", "Moisturizers", "Cleansers"][i]!,
        name: p.name,
        price: p.price,
        image: p.image,
      })),
    };
  }
  return apiFetch<UserProfileData>(`/api/users/${id}`);
}

export async function listScans(): Promise<AdminScan[]> {
  if (!canUseAdminApi()) return SEED_SCANS;
  try {
    const data = await apiFetch<{ scans: AdminScan[] }>("/api/scans");
    return data.scans.length ? data.scans : SEED_SCANS;
  } catch {
    return SEED_SCANS;
  }
}

export async function listProducts(): Promise<AdminProduct[]> {
  if (!canUseAdminApi()) return readLocal(LS.products, SEED_PRODUCTS);
  try {
    const data = await apiFetch<{ products: AdminProduct[] }>("/api/products");
    return data.products ?? [];
  } catch {
    return readLocal(LS.products, SEED_PRODUCTS);
  }
}

export async function getProduct(id: string) {
  if (!canUseAdminApi()) {
    const items = readLocal(LS.products, SEED_PRODUCTS);
    return items.find((p) => p.id === id) ?? null;
  }
  try {
    const data = await apiFetch<{ product: AdminProduct }>(`/api/products/${id}`);
    return data.product ?? null;
  } catch {
    const items = await listProducts();
    return items.find((p) => p.id === id) ?? null;
  }
}

export async function saveProduct(
  product: Omit<AdminProduct, "id"> & { id?: string },
) {
  if (!canUseAdminApi()) {
    const items = readLocal(LS.products, SEED_PRODUCTS);
    if (product.id) {
      writeLocal(
        LS.products,
        items.map((p) =>
          p.id === product.id ? { ...p, ...product, id: product.id } : p,
        ),
      );
      return product.id;
    }
    const id = `p_${Date.now()}`;
    writeLocal(LS.products, [...items, { ...product, id }]);
    return id;
  }

  if (product.id) {
    await apiFetch(`/api/products/${product.id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
    return product.id;
  }
  const created = await apiFetch<{ id: string }>("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
  return created.id;
}

export async function removeProduct(id: string) {
  if (!canUseAdminApi()) {
    writeLocal(
      LS.products,
      readLocal(LS.products, SEED_PRODUCTS).filter((p) => p.id !== id),
    );
    return;
  }
  await apiFetch(`/api/products/${id}`, { method: "DELETE" });
}

export async function listPosts(): Promise<AdminPost[]> {
  if (!canUseAdminApi()) return readLocal(LS.posts, SEED_POSTS);
  try {
    const data = await apiFetch<{ posts: AdminPost[] }>("/api/blogs");
    return data.posts ?? [];
  } catch {
    return readLocal(LS.posts, SEED_POSTS);
  }
}

export async function getPost(id: string) {
  if (!canUseAdminApi()) {
    const items = readLocal(LS.posts, SEED_POSTS);
    return items.find((p) => p.id === id) ?? null;
  }
  try {
    const data = await apiFetch<{ post: AdminPost }>(`/api/blogs/${id}`);
    return data.post ?? null;
  } catch {
    const items = await listPosts();
    return items.find((p) => p.id === id) ?? null;
  }
}

export async function savePost(
  post: Partial<AdminPost> & { title: string; id?: string },
) {
  if (!canUseAdminApi()) {
    const items = readLocal(LS.posts, SEED_POSTS);
    const now = Date.now();
    const published =
      typeof post.published === "boolean"
        ? post.published
        : post.status === "Published";
    const next: AdminPost = {
      id: post.id || `b_${now}`,
      title: post.title,
      topic: post.topic || "",
      author: post.author || "",
      summary: post.summary || "",
      imageUrl: post.imageUrl || post.coverImage || "",
      published,
      isFeatured: Boolean(post.isFeatured),
      mustRead: Boolean(post.mustRead),
      createdAt: post.createdAt || now,
      updatedAt: now,
      status: published ? "Published" : "Draft",
      updated: new Date(now).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      coverImage: post.imageUrl || post.coverImage || "",
    };
    if (post.id) {
      writeLocal(
        LS.posts,
        items.map((p) => (p.id === post.id ? { ...p, ...next, id: post.id } : p)),
      );
      return post.id;
    }
    writeLocal(LS.posts, [...items, next]);
    return next.id;
  }

  if (post.id) {
    await apiFetch(`/api/blogs/${post.id}`, {
      method: "PUT",
      body: JSON.stringify(post),
    });
    return post.id;
  }
  const created = await apiFetch<{ id: string }>("/api/blogs", {
    method: "POST",
    body: JSON.stringify(post),
  });
  return created.id;
}

export async function removePost(id: string) {
  if (!canUseAdminApi()) {
    writeLocal(
      LS.posts,
      readLocal(LS.posts, SEED_POSTS).filter((p) => p.id !== id),
    );
    return;
  }
  await apiFetch(`/api/blogs/${id}`, { method: "DELETE" });
}

export type OverviewStats = {
  totalUsers: number;
  newSignups: number;
  contactUsers: number;
  contactMessages?: number;
  weeklyActive: number;
  publishedBlogs?: number;
  products?: number;
  scanBars: { day: string; h: number; count: number; hot?: boolean }[];
  activity: {
    id: string;
    name: string;
    detail: string;
    time: string;
    warn: boolean;
  }[];
  trends: {
    totalUsers: { trend: string; down: boolean };
    newSignups: { trend: string; down: boolean };
    contactUsers: { trend: string; down: boolean };
    weeklyActive: { trend: string; down: boolean };
  };
};

const EMPTY_STATS: OverviewStats = {
  totalUsers: 0,
  newSignups: 0,
  contactUsers: 0,
  contactMessages: 0,
  weeklyActive: 0,
  scanBars: [],
  activity: [],
  trends: {
    totalUsers: { trend: "0%", down: false },
    newSignups: { trend: "0%", down: false },
    contactUsers: { trend: "0%", down: false },
    weeklyActive: { trend: "0%", down: false },
  },
};

export async function fetchStats(): Promise<OverviewStats> {
  if (!canUseAdminApi()) return EMPTY_STATS;
  try {
    return await apiFetch<OverviewStats>("/api/stats");
  } catch {
    return EMPTY_STATS;
  }
}

export async function listRoutineChecks(): Promise<RoutineCheckDoc[]> {
  const data = await apiFetch<{ items: RoutineCheckDoc[] }>("/api/routine-checks");
  return data.items ?? [];
}

export async function getRoutineCheck(id: string): Promise<RoutineCheckDoc | null> {
  try {
    const data = await apiFetch<{ item: RoutineCheckDoc }>(
      `/api/routine-checks/${id}`,
    );
    return data.item ?? null;
  } catch {
    return null;
  }
}

export async function createRoutineCheck(input: {
  id: string;
  tasks: RoutineTask[];
}) {
  const data = await apiFetch<{ id: string }>("/api/routine-checks", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.id;
}

export async function updateRoutineCheck(id: string, tasks: RoutineTask[]) {
  await apiFetch(`/api/routine-checks/${id}`, {
    method: "PUT",
    body: JSON.stringify({ tasks }),
  });
}

export async function removeRoutineCheck(id: string) {
  await apiFetch(`/api/routine-checks/${id}`, { method: "DELETE" });
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const data = await apiFetch<{ items: ContactMessage[] }>("/api/contact-us");
  return data.items ?? [];
}

export async function getContactMessage(
  id: string,
): Promise<ContactMessage | null> {
  try {
    const data = await apiFetch<{ item: ContactMessage }>(
      `/api/contact-us/${id}`,
    );
    return data.item ?? null;
  } catch {
    return null;
  }
}

export async function removeContactMessage(id: string) {
  await apiFetch(`/api/contact-us/${id}`, { method: "DELETE" });
}
