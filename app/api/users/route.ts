import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import type { AdminUser } from "@/data/seed";
import { formatSignupDate, relativeTime, toMillis } from "@/lib/time";

function mapStatus(data: Record<string, unknown>): AdminUser["status"] {
  const raw = String(data.status || "").toLowerCase();
  if (raw === "inactive" || raw === "disabled" || raw === "archived") {
    return "Inactive";
  }
  if (raw === "flagged") return "Flagged";
  if (raw === "pending") return "Pending";
  if (data.committed === false) return "Inactive";
  return "Active";
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [usersSnap, scansSnap] = await Promise.all([
      adminDb().collection("users").where("userRole", "==", "users").get(),
      adminDb().collection("scans").get(),
    ]);

    const scanCountByUser = new Map<string, number>();
    for (const d of scansSnap.docs) {
      const uid = String(d.data().userId || "");
      if (!uid) continue;
      scanCountByUser.set(uid, (scanCountByUser.get(uid) || 0) + 1);
    }

    const now = Date.now();
    const users: AdminUser[] = usersSnap.docs.map((d) => {
      const data = d.data();
      const createdMs =
        toMillis(data.createdAt) ??
        toMillis(data.updatedAt) ??
        toMillis(data.fcmTokenUpdatedAt);
      const activeMs =
        toMillis(data.updatedAt) ??
        toMillis(data.fcmTokenUpdatedAt) ??
        toMillis(data.createdAt);

      const fromScans = scanCountByUser.get(d.id);
      const scans =
        fromScans ??
        (typeof data.scans === "number"
          ? data.scans
          : data.scanCompleted
            ? 1
            : 0);

      return {
        id: d.id,
        name: data.name || data.displayName || "User",
        email: data.email || "",
        skinType: data.skinType || "—",
        concern:
          data.mainSkinGoal ||
          data.additionalSkinConcern ||
          data.goal ||
          data.concern ||
          "—",
        scans,
        status: mapStatus(data),
        lastActive: activeMs != null ? relativeTime(activeMs, now) : "—",
        signupDate: formatSignupDate(createdMs),
        avatar: data.avatar || data.photoURL || "/assets/admin/avatar.png",
      };
    });

    users.sort((a, b) => a.name.localeCompare(b.name));

    return json({ users });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to list users" }, 500);
  }
}
