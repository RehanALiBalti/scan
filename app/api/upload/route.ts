import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminStorage } from "@/lib/firebaseAdmin";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "image.jpg";
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const form = await req.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "blogs").replace(
      /[^a-zA-Z0-9_-]/g,
      "",
    );

    if (!file || typeof file === "string") {
      return json({ error: "No image file provided" }, 400);
    }

    const mime = file.type || "application/octet-stream";
    if (!ALLOWED.has(mime)) {
      return json(
        { error: "Only JPG, PNG, WEBP, or GIF images are allowed" },
        400,
      );
    }

    if (file.size > MAX_BYTES) {
      return json({ error: "Image must be under 8 MB" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const token = randomUUID();
    const objectPath = `${folder || "blogs"}/${Date.now()}_${safeFileName(file.name)}`;
    const bucket = adminStorage();
    const object = bucket.file(objectPath);

    await object.save(buffer, {
      resumable: false,
      metadata: {
        contentType: mime,
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;

    return json({
      url,
      path: objectPath,
      contentType: mime,
      size: file.size,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    const message =
      err instanceof Error ? err.message : "Failed to upload image";
    return json({ error: message }, 500);
  }
}
