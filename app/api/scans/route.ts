import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { SEED_SCANS, type AdminScan } from "@/data/seed";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb().collection("scans").get();
    if (snap.empty) return json({ scans: SEED_SCANS, source: "seed" });

    const scans: AdminScan[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        user: data.userName || data.userId || "Unknown",
        concern: data.concern || "General",
        hydration: data.hydration ?? 0,
        oiliness: data.oiliness ?? 0,
        wrinkles: data.wrinkles ?? 0,
        status: data.status || "Complete",
        date: data.createdAt
          ? new Date(data.createdAt).toLocaleString()
          : "—",
      };
    });
    return json({ scans });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to list scans" }, 500);
  }
}
