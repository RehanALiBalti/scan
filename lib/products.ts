import type { AdminProduct } from "@/data/seed";

/** Firestore collection name (case-sensitive). */
export const PRODUCTS_COLLECTION = "products";

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function asStock(value: unknown): AdminProduct["stock"] {
  const raw = String(value || "").toLowerCase();
  if (raw === "low" || raw === "low stock") return "Low";
  if (raw === "out" || raw === "out of stock" || raw === "archived") return "Out";
  return "In Stock";
}

function asPublishStatus(
  value: unknown,
  stock: AdminProduct["stock"],
): AdminProduct["publishStatus"] {
  const raw = String(value || "").toLowerCase();
  if (raw === "archived" || raw === "inactive" || raw === "draft") return "Archived";
  if (raw === "active" || raw === "published") return "Active";
  return stock === "Out" ? "Archived" : "Active";
}

/** Map a Firestore products doc → UI AdminProduct. */
export function mapProductDoc(
  id: string,
  data: Record<string, unknown>,
): AdminProduct {
  const image = String(data.image || data.imageUrl || data.coverImage || "");
  const stock = asStock(data.stock ?? data.stockStatus);
  const publishStatus = asPublishStatus(
    data.publishStatus ?? data.status ?? data.published,
    stock,
  );

  return {
    id,
    name: String(data.name || data.title || "Product"),
    brand: String(data.brand || ""),
    category: String(data.category || data.tag || ""),
    sku: data.sku != null ? String(data.sku) : undefined,
    description: data.description != null ? String(data.description) : "",
    skinTypes: asStringArray(data.skinTypes),
    concerns: asStringArray(data.concerns),
    price: Number(data.price) || 0,
    fit: Number(data.fit ?? data.matchScore ?? data.score) || 0,
    stock,
    publishStatus,
    image,
    tag: data.tag != null ? String(data.tag) : undefined,
    matchLabel:
      data.matchLabel != null
        ? String(data.matchLabel)
        : data.match_label != null
          ? String(data.match_label)
          : undefined,
    createdAt: Number(data.createdAt) || undefined,
    updatedAt: Number(data.updatedAt) || undefined,
  };
}

/** Payload written to Firestore products (no id / UI-only fields). */
export function toProductFirestore(
  product: Partial<AdminProduct> & { name: string },
  opts?: { isCreate?: boolean },
): Record<string, unknown> {
  const now = Date.now();
  const image = product.image || "";
  const publishStatus = product.publishStatus || "Active";
  const stock =
    product.stock ||
    (publishStatus === "Archived" ? "Out" : "In Stock");

  const payload: Record<string, unknown> = {
    name: product.name || "",
    brand: product.brand || "",
    category: product.category || "",
    sku: product.sku || "",
    description: product.description || "",
    skinTypes: product.skinTypes || [],
    concerns: product.concerns || [],
    price: Number(product.price) || 0,
    fit: Number(product.fit) || 0,
    stock,
    publishStatus,
    image,
    imageUrl: image,
    updatedAt: now,
  };

  if (product.tag) payload.tag = product.tag;
  if (product.matchLabel) payload.matchLabel = product.matchLabel;

  if (opts?.isCreate) {
    payload.createdAt = now;
  }

  return payload;
}
