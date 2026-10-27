import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  ROUTINE_CHECKS_COLLECTION,
  mapRoutineDoc,
  toRoutineFirestore,
} from "@/lib/routineChecks";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const snap = await adminDb()
      .collection(ROUTINE_CHECKS_COLLECTION)
      .doc(id)
      .get();
    if (!snap.exists) return json({ error: "Not found" }, 404);
    return json({
      item: mapRoutineDoc(snap.id, snap.data() as Record<string, unknown>),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to load routine check" }, 500);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const body = await req.json();
    const ref = adminDb().collection(ROUTINE_CHECKS_COLLECTION).doc(id);
    const existing = await ref.get();
    if (!existing.exists) return json({ error: "Not found" }, 404);

    const prev = existing.data() as Record<string, unknown>;
    const payload = toRoutineFirestore(
      id,
      {
        tasks: body.tasks || [],
        createdAt: Number(prev.createdAt) || undefined,
      },
      { isCreate: false },
    );

    // Preserve app-written completedUsers; never wipe from admin edit
    await ref.set(
      {
        ...payload,
        createdAt: prev.createdAt || payload.updatedAt,
        completedUsers: Array.isArray(prev.completedUsers)
          ? prev.completedUsers
          : [],
      },
      { merge: false },
    );

    return json({ id });
  } catch (err) {
    if (err instanceof Response) return err;
    const message =
      err instanceof Error ? err.message : "Failed to update routine check";
    return json({ error: message }, 400);
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    await adminDb().collection(ROUTINE_CHECKS_COLLECTION).doc(id).delete();
    return json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to delete routine check" }, 500);
  }
}
