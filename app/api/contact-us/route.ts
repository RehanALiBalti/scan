import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  CONTACT_US_COLLECTION,
  mapContactDoc,
} from "@/lib/contactUs";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb().collection(CONTACT_US_COLLECTION).get();
    const items = snap.docs
      .map((d) => mapContactDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt - a.createdAt);
    return json({ items });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to list contact messages" }, 500);
  }
}
