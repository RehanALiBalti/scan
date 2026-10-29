import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminStorage } from "@/lib/firebaseAdmin";

const IMAGE_MAX = 8 * 1024 * 1024; // 8 MB
const VIDEO_MAX = 80 * 1024 * 1024; // 80 MB

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
]);

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "file";
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const form = await req.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "uploads").replace(
      /[^a-zA-Z0-9_-]/g,
      "",
    );

    if (!file || typeof file === "string") {
      return json({ error: "No file provided" }, 400);
    }

    const mime = file.type || "application/octet-stream";
    const isImage = IMAGE_TYPES.has(mime);
    const isVideo = VIDEO_TYPES.has(mime);

    if (!isImage && !isVideo) {
      return json(
        {
          error:
            "Allowed: JPG, PNG, WEBP, GIF images or MP4 / WEBM / MOV videos",
        },
        400,
      );
    }

    const max = isVideo ? VIDEO_MAX : IMAGE_MAX;
    if (file.size > max) {
      return json(
        {
          error: isVideo
            ? "Video must be under 80 MB"
            : "Image must be under 8 MB",
        },
        400,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const token = randomUUID();
    const objectPath = `${folder || "uploads"}/${Date.now()}_${safeFileName(file.name)}`;
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
      kind: isVideo ? "video" : "image",
    });
  } catch (err) {
    if (err instanceof Response) return err;
    const message =
      err instanceof Error ? err.message : "Failed to upload file";
    return json({ error: message }, 500);
  }
}
