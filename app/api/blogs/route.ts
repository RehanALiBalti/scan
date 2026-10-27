import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  BLOGS_COLLECTION,
  mapBlogDoc,
  toBlogFirestore,
} from "@/lib/blogs";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb().collection(BLOGS_COLLECTION).get();
    const posts = snap.docs
      .map((d) => mapBlogDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return json({ posts });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to list blogs" }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const payload = toBlogFirestore(body, { isCreate: true });
    const ref = await adminDb().collection(BLOGS_COLLECTION).add(payload);
    return json({ id: ref.id }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to create blog" }, 500);
  }
}
