import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  CONTACT_US_COLLECTION,
  mapContactDoc,
} from "@/lib/contactUs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const snap = await adminDb()
      .collection(CONTACT_US_COLLECTION)
      .doc(id)
      .get();
    if (!snap.exists) return json({ error: "Not found" }, 404);
    return json({
      item: mapContactDoc(snap.id, snap.data() as Record<string, unknown>),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to load message" }, 500);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    await adminDb().collection(CONTACT_US_COLLECTION).doc(id).delete();
    return json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to delete message" }, 500);
  }
}
