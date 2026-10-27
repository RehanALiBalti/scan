import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  PRODUCTS_COLLECTION,
  mapProductDoc,
  toProductFirestore,
} from "@/lib/products";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const snap = await adminDb().collection(PRODUCTS_COLLECTION).doc(id).get();
    if (!snap.exists) return json({ error: "Not found" }, 404);
    return json({
      product: mapProductDoc(snap.id, snap.data() as Record<string, unknown>),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to load product" }, 500);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const body = await req.json();
    const payload = toProductFirestore(body, { isCreate: false });
    await adminDb()
      .collection(PRODUCTS_COLLECTION)
      .doc(id)
      .set(payload, { merge: true });
    return json({ id });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to update product" }, 500);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    await adminDb().collection(PRODUCTS_COLLECTION).doc(id).delete();
    return json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to delete product" }, 500);
  }
}
