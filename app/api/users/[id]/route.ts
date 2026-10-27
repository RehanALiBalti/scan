import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { PRODUCTS_COLLECTION, mapProductDoc } from "@/lib/products";
import { toMillis } from "@/lib/time";

type Ctx = { params: Promise<{ id: string }> };

function formatClientSince(ms: number | null): string {
  if (ms == null) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatScanWhen(ms: number | null): string {
  if (ms == null) return "—";
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} (${time})`;
}

function hydrationLabel(value: number): string {
  if (value < 45) return "Low";
  if (value < 55) return "Mild Dry";
  if (value < 70) return "Normal";
  return "Good";
}

function collectConcerns(data: Record<string, unknown>): string[] {
  const out: string[] = [];
  const push = (v: unknown) => {
    if (!v) return;
    if (Array.isArray(v)) {
      v.forEach((x) => push(x));
      return;
    }
    const s = String(v).trim();
    if (s && s !== "—" && !out.includes(s)) out.push(s);
  };

  push(data.mainSkinGoal);
  push(data.additionalSkinConcern);
  push(data.concern);
  push(data.concerns);
  push(data.skinConcerns);
  push(data.sensitivity);

  return out;
}

function primarySkinType(data: Record<string, unknown>): string {
  const type = String(data.skinType || "").trim();
  const sensitivity = String(data.sensitivity || "").trim();
  if (type && sensitivity && !type.toLowerCase().includes(sensitivity.toLowerCase())) {
    return `${type} / ${sensitivity}`;
  }
  return type || sensitivity || "—";
}

function categorize(category: string, name: string): string {
  const c = `${category} ${name}`.toLowerCase();
  if (c.includes("serum")) return "Serums";
  if (c.includes("moistur") || c.includes("cream") || c.includes("oil")) {
    return "Moisturizers";
  }
  if (c.includes("clean")) return "Cleansers";
  if (c.includes("gel")) return "Gels";
  return category || "Product";
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const db = adminDb();

    const userSnap = await db.collection("users").doc(id).get();
    if (!userSnap.exists) return json({ error: "User not found" }, 404);

    const data = userSnap.data() as Record<string, unknown>;
    const createdMs =
      toMillis(data.createdAt) ??
      toMillis(data.updatedAt) ??
      toMillis(data.fcmTokenUpdatedAt);

    // Prefer scans filtered by userId; fall back to all + filter in memory
    let scanDocs: { id: string; data: () => Record<string, unknown> }[] = [];
    try {
      const q = await db.collection("scans").where("userId", "==", id).get();
      scanDocs = q.docs.map((d) => ({
        id: d.id,
        data: () => d.data() as Record<string, unknown>,
      }));
    } catch {
      const all = await db.collection("scans").get();
      scanDocs = all.docs
        .filter((d) => String(d.data().userId || "") === id)
        .map((d) => ({
          id: d.id,
          data: () => d.data() as Record<string, unknown>,
        }));
    }

    const scans = scanDocs
      .map((d) => {
        const s = d.data();
        const at =
          toMillis(s.createdAt) ?? toMillis(s.updatedAt) ?? toMillis(s.date);
        const hydration = Number(s.hydration ?? s.hydrationScore ?? 0);
        return {
          id: d.id,
          when: formatScanWhen(at),
          at: at || 0,
          hydration,
          label: hydrationLabel(hydration),
          concern: String(s.concern || s.mainSkinGoal || ""),
          oiliness: Number(s.oiliness ?? 0),
          wrinkles: Number(s.wrinkles ?? 0),
        };
      })
      .sort((a, b) => b.at - a.at)
      .slice(0, 8);

    const productsSnap = await db.collection(PRODUCTS_COLLECTION).get();
    const products = productsSnap.docs.map((d) =>
      mapProductDoc(d.id, d.data() as Record<string, unknown>),
    );

    const skinType = String(data.skinType || "").toLowerCase();
    const concernText = collectConcerns(data).join(" ").toLowerCase();

    const scored = products
      .filter((p) => p.publishStatus !== "Archived")
      .map((p) => {
        let score = p.fit || 0;
        const types = (p.skinTypes || []).map((t) => t.toLowerCase());
        const concerns = (p.concerns || []).map((c) => c.toLowerCase());
        if (skinType && types.some((t) => t.includes(skinType) || skinType.includes(t))) {
          score += 20;
        }
        if (concernText && concerns.some((c) => concernText.includes(c))) {
          score += 15;
        }
        return { ...p, _score: score, slot: categorize(p.category, p.name) };
      })
      .sort((a, b) => b._score - a._score);

    // Prefer one product per routine slot
    const slots = ["Serums", "Moisturizers", "Cleansers"];
    const routine: {
      id: string;
      slot: string;
      name: string;
      price: number;
      image: string;
    }[] = [];

    for (const slot of slots) {
      const hit = scored.find(
        (p) => p.slot === slot && !routine.some((r) => r.id === p.id),
      );
      if (hit) {
        routine.push({
          id: hit.id,
          slot,
          name: hit.name,
          price: hit.price,
          image: hit.image,
        });
      }
    }

    // Fill remaining with top products if slots empty
    for (const p of scored) {
      if (routine.length >= 3) break;
      if (routine.some((r) => r.id === p.id)) continue;
      routine.push({
        id: p.id,
        slot: p.slot,
        name: p.name,
        price: p.price,
        image: p.image,
      });
    }

    const concerns = collectConcerns(data);
    if (!concerns.length && data.mainSkinGoal) {
      concerns.push(String(data.mainSkinGoal));
    }

    return json({
      user: {
        id,
        name: String(data.name || data.displayName || "User"),
        email: String(data.email || ""),
        avatar: String(data.avatar || data.photoURL || "/assets/admin/avatar.png"),
        clientSince: formatClientSince(createdMs),
        primarySkinType: primarySkinType(data),
        skinType: String(data.skinType || "—"),
        sensitivity: String(data.sensitivity || ""),
        ageRange: String(data.ageRange || ""),
        gender: String(data.gender || ""),
        concerns,
      },
      scans,
      routine,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to load user profile" }, 500);
  }
}
