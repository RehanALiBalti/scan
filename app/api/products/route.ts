import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb, isAdminConfigured } from "@/lib/firebaseAdmin";
import {
  PRODUCTS_COLLECTION,
  mapProductDoc,
  toProductFirestore,
} from "@/lib/products";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb().collection(PRODUCTS_COLLECTION).get();
    const products = snap.docs
      .map((d) => mapProductDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return json({ products });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to list products" }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    if (!isAdminConfigured()) return json({ error: "Admin not configured" }, 503);
    const body = await req.json();
    const payload = toProductFirestore(body, { isCreate: true });
    const ref = await adminDb().collection(PRODUCTS_COLLECTION).add(payload);
    return json({ id: ref.id }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to create product" }, 500);
  }
}
