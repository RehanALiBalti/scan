import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";

/** Verify Firebase ID token + Firestore users/{uid}.userRole === "admin". */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    return json({
      ok: true,
      uid: admin.uid,
      email: admin.email || null,
      displayName: admin.displayName || null,
      userRole: admin.userRole,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Verification failed" }, 500);
  }
}
