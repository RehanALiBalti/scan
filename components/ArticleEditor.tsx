"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getPost, savePost } from "@/lib/adminStore";
import { apiUpload } from "@/lib/apiClient";
import type { AdminPost } from "@/data/seed";

type FormState = Omit<
  AdminPost,
  "id" | "status" | "updated" | "createdAt" | "updatedAt" | "coverImage"
>;

const defaults: FormState = {
  title: "",
  topic: "Sensitive Skin",
  author: "Dr. Aris Cole",
  summary: "",
  imageUrl: "",
  published: false,
  isFeatured: false,
  mustRead: false,
};

const TOPICS = [
  "Sensitive Skin",
  "Routines",
  "Science",
  "Hydration",
  "Acne Care",
  "Ingredients & Formulation",
];

const AUTHORS = [
  "Dr. Aris Cole",
  "Dr. Elena Rostova",
  "Dr. Evelyn Carter",
  "Pure Lab",
];

export function ArticleEditor() {
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const isNew = !id || id === "new";
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(defaults);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    void getPost(id!).then((p) => {
      if (!p) {
        setError("Post not found");
        return;
      }
      setForm({
        title: p.title,
        topic: p.topic,
        author: p.author,
        summary: p.summary,
        imageUrl: p.imageUrl || p.coverImage || "",
        published: p.published,
        isFeatured: p.isFeatured,
        mustRead: p.mustRead,
      });
    });
  }, [id, isNew]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const previewSrc = localPreview || form.imageUrl;

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, WEBP, GIF)");
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "blogs");
      const uploaded = await apiUpload<{ url: string }>("/api/upload", body);
      setForm((prev) => ({ ...prev, imageUrl: uploaded.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const persist = async (published: boolean) => {
    if (!form.imageUrl) {
      setError("Please upload a cover image before saving");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...form,
        published,
        status: published ? ("Published" as const) : ("Draft" as const),
      };
      await savePost(isNew ? payload : { ...payload, id });
      router.push("/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void persist(true);
  };

  return (
    <form className="article-shell" onSubmit={onSubmit}>
      <div className="article-topbar">
        <Link href="/blog" className="link-back">
          ← Content / Blog
        </Link>
        <div className="product-actions">
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy || uploading}
            onClick={() => void persist(false)}
          >
            Save draft
          </button>
          <button
            type="submit"
            className="btn btn-publish"
            disabled={busy || uploading}
          >
            {busy ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="article-layout">
        <div className="article-main">
          <section className="editor-card article-cover-card">
            <div className="article-cover">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewSrc} alt="" />
              ) : (
                <div className="article-cover-empty">
                  <strong>Cover image</strong>
                  <span>Upload a JPG, PNG, WEBP, or GIF (max 8 MB)</span>
                </div>
              )}
              {uploading ? <div className="article-cover-busy">Uploading…</div> : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => void onPickFile(e.target.files?.[0] || null)}
            />
            <div className="article-cover-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={uploading || busy}
                onClick={() => fileRef.current?.click()}
              >
                {previewSrc ? "Replace cover" : "Upload cover"}
              </button>
              <p className="field-hint">
                Stored in Firebase Storage <code>blogs/</code>, saved as{" "}
                <code>imageUrl</code> on the document.
              </p>
            </div>
          </section>

          <section className="editor-card">
            <p className="label-caps">Article</p>
            <label className="form-label">
              <span className="label-caps">Title</span>
              <input
                className="form-input form-input-lg"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Headline for the journal"
                required
              />
            </label>
            <label className="form-label">
              <span className="label-caps">Summary</span>
              <textarea
                className="form-textarea"
                rows={5}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Short synopsis shown in lists and cards"
                required
              />
            </label>
          </section>
        </div>

        <aside className="article-side">
          <section className="editor-card">
            <h3>Publishing</h3>
            <div className="meta-rows">
              <div>
                <span>Status</span>
                <strong className="draft-label">
                  {form.published ? "Published" : "Draft"}
                </strong>
              </div>
            </div>
            <label className="check-inline">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
              />
              Featured on home
            </label>
            <label className="check-inline">
              <input
                type="checkbox"
                checked={form.mustRead}
                onChange={(e) =>
                  setForm({ ...form, mustRead: e.target.checked })
                }
              />
              Must read
            </label>
            {error ? <p className="error">{error}</p> : null}
          </section>

          <section className="editor-card">
            <h3>Taxonomy</h3>
            <label className="form-label">
              <span className="label-caps">Topic</span>
              <select
                className="form-input"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              >
                {TOPICS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              <span className="label-caps">Author</span>
              <select
                className="form-input"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              >
                {AUTHORS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
          </section>

          <section className="editor-card article-live-preview">
            <p className="label-caps">Card preview</p>
            <div className="blog-card blog-card-mini">
              <div className="blog-card-media">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="" />
                ) : (
                  <div className="blog-card-placeholder">Cover</div>
                )}
              </div>
              <div className="blog-card-body">
                <p className="blog-card-meta">
                  {form.topic} · {form.author}
                </p>
                <h3>{form.title || "Untitled article"}</h3>
                <p className="blog-card-summary">
                  {form.summary || "Summary will appear here."}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
