import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { SEED_POSTS, SEED_PRODUCTS } from "@/data/seed";
import { BLOGS_COLLECTION, toBlogFirestore } from "@/lib/blogs";
import { PRODUCTS_COLLECTION, toProductFirestore } from "@/lib/products";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const db = adminDb();
    const batch = db.batch();

    SEED_PRODUCTS.forEach((p) => {
      const { id, ...rest } = p;
      batch.set(db.collection(PRODUCTS_COLLECTION).doc(id), {
        ...toProductFirestore(rest, { isCreate: true }),
        seeded: true,
      });
    });

    SEED_POSTS.forEach((p) => {
      const { id, ...rest } = p;
      batch.set(db.collection(BLOGS_COLLECTION).doc(id), {
        ...toBlogFirestore(rest, { isCreate: true }),
        createdAt: rest.createdAt || Date.now(),
        updatedAt: rest.updatedAt || Date.now(),
        seeded: true,
      });
    });

    await batch.commit();
    return json({
      ok: true,
      products: SEED_PRODUCTS.length,
      blogs: SEED_POSTS.length,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Seed failed" }, 500);
  }
}
