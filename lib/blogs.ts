import type { AdminPost } from "@/data/seed";

/** Firestore collection name (case-sensitive). */
export const BLOGS_COLLECTION = "Blogs";

export function formatBlogDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const ms =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : typeof value === "object" &&
            value !== null &&
            "toDate" in value &&
            typeof (value as { toDate: () => Date }).toDate === "function"
          ? (value as { toDate: () => Date }).toDate().getTime()
          : NaN;
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Map a Firestore Blogs doc → UI AdminPost. */
export function mapBlogDoc(
  id: string,
  data: Record<string, unknown>,
): AdminPost {
  const published = Boolean(data.published);
  const imageUrl = String(data.imageUrl || data.coverImage || "");
  const updatedAt = Number(data.updatedAt) || Number(data.createdAt) || 0;
  const createdAt = Number(data.createdAt) || updatedAt;

  return {
    id,
    title: String(data.title || ""),
    topic: String(data.topic || ""),
    author: String(data.author || ""),
    summary: String(data.summary || data.content || data.metaDescription || ""),
    imageUrl,
    published,
    isFeatured: Boolean(data.isFeatured),
    mustRead: Boolean(data.mustRead),
    createdAt,
    updatedAt,
    status: published ? "Published" : "Draft",
    updated: formatBlogDate(updatedAt),
    coverImage: imageUrl,
  };
}

/** Payload written to Firestore Blogs (no id). */
export function toBlogFirestore(
  post: Omit<AdminPost, "id"> & { id?: string },
  opts?: { isCreate?: boolean },
): Record<string, unknown> {
  const now = Date.now();
  const published =
    typeof post.published === "boolean"
      ? post.published
      : post.status === "Published";
  const imageUrl = post.imageUrl || post.coverImage || "";

  const payload: Record<string, unknown> = {
    title: post.title || "",
    topic: post.topic || "",
    author: post.author || "",
    summary: post.summary || "",
    imageUrl,
    published,
    isFeatured: Boolean(post.isFeatured),
    mustRead: Boolean(post.mustRead),
    updatedAt: now,
  };

  if (opts?.isCreate) {
    payload.createdAt = now;
  }

  return payload;
}
