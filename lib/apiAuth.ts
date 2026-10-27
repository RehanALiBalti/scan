import { NextRequest } from "next/server";
import { adminAuth, adminDb, isAdminConfigured } from "./firebaseAdmin";

export type AdminUser = {
  uid: string;
  email?: string;
  displayName?: string;
  userRole: "admin";
};

export async function requireAdmin(req: NextRequest): Promise<AdminUser> {
  if (!isAdminConfigured()) {
    throw new Response(
      JSON.stringify({ error: "Firebase Admin is not configured on the server" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    throw new Response(JSON.stringify({ error: "Missing auth token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    const profile = await loadAdminProfile(decoded.uid, decoded.email);
    return profile;
  } catch (err) {
    if (err instanceof Response) throw err;
    throw new Response(JSON.stringify({ error: "Invalid auth token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/** Look up users/{uid} and require userRole === "admin". */
export async function loadAdminProfile(
  uid: string,
  emailFromToken?: string | null,
): Promise<AdminUser> {
  const snap = await adminDb().collection("users").doc(uid).get();

  if (!snap.exists) {
    throw new Response(
      JSON.stringify({ error: "User profile not found. Access denied." }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const data = snap.data() || {};
  const role = String(data.userRole || data.role || "").toLowerCase();

  if (role !== "admin") {
    throw new Response(
      JSON.stringify({ error: "Only admin users can access this dashboard." }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  return {
    uid,
    email: data.email || emailFromToken || undefined,
    displayName: data.displayName || data.name || undefined,
    userRole: "admin",
  };
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}
