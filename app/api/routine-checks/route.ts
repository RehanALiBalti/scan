import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  ROUTINE_CHECKS_COLLECTION,
  mapRoutineDoc,
  toRoutineFirestore,
} from "@/lib/routineChecks";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb().collection(ROUTINE_CHECKS_COLLECTION).get();
    const items = snap.docs
      .map((d) => mapRoutineDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => {
        // Sort by doc id as date: compare yyyyMMdd numerically via parse
        const key = (id: string) =>
          id.length === 8 ? `${id.slice(4)}${id.slice(2, 4)}${id.slice(0, 2)}` : id;
        return key(b.id).localeCompare(key(a.id));
      });
    return json({ items });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to list routine checks" }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const id = String(body.id || body.docId || "").trim();
    if (!id) return json({ error: "Document ID (ddMMyyyy) is required" }, 400);

    const ref = adminDb().collection(ROUTINE_CHECKS_COLLECTION).doc(id);
    const existing = await ref.get();
    if (existing.exists) {
      return json(
        { error: `RoutineChecks/${id} already exists. Edit it instead.` },
        409,
      );
    }

    const payload = toRoutineFirestore(
      id,
      { tasks: body.tasks || [] },
      { isCreate: true },
    );
    await ref.set(payload);
    return json({ id }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    const message =
      err instanceof Error ? err.message : "Failed to create routine check";
    return json({ error: message }, 400);
  }
}
