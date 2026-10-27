"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listPosts, removePost } from "@/lib/adminStore";
import type { AdminPost } from "@/data/seed";

export function Blog() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const router = useRouter();

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setPosts(await listPosts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "published") return posts.filter((p) => p.published);
    if (filter === "draft") return posts.filter((p) => !p.published);
    return posts;
  }, [posts, filter]);

  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <>
      <div className="blog-hero">
        <div>
          <p className="routine-kicker">Content hub · Blogs</p>
          <h2>Journal articles</h2>
          <p className="toolbar-copy">
            {publishedCount} published · {posts.length - publishedCount} drafts ·{" "}
            {posts.length} total
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => router.push("/blog/new")}
        >
          + New Article
        </button>
      </div>

      <div className="blog-filters">
        {(
          [
            ["all", "All"],
            ["published", "Published"],
            ["draft", "Drafts"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip${filter === key ? " active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="toolbar-copy">Loading blogs…</p> : null}
      {!loading && !filtered.length ? (
        <p className="toolbar-copy">No posts match this filter.</p>
      ) : null}

      <div className="blog-grid">
        {filtered.map((p) => (
          <article key={p.id} className="blog-card">
            <div className="blog-card-media">
              {p.imageUrl || p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl || p.coverImage} alt="" />
              ) : (
                <div className="blog-card-placeholder">No cover</div>
              )}
              <div className="blog-card-badges">
                <span
                  className={`badge ${p.published ? "badge-green" : "badge-amber"}`}
                >
                  {p.published ? "Published" : "Draft"}
                </span>
                {p.isFeatured ? (
                  <span className="badge badge-blue">Featured</span>
                ) : null}
                {p.mustRead ? (
                  <span className="badge badge-rose">Must read</span>
                ) : null}
              </div>
            </div>
            <div className="blog-card-body">
              <p className="blog-card-meta">
                {p.topic} · {p.author}
              </p>
              <h3>{p.title}</h3>
              {p.summary ? <p className="blog-card-summary">{p.summary}</p> : null}
              <div className="blog-card-foot">
                <span>{p.updated || "—"}</span>
                <div className="product-actions">
                  <Link href={`/blog/${p.id}`} className="btn btn-soft">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={async () => {
                      if (!confirm(`Delete “${p.title}”?`)) return;
                      await removePost(p.id);
                      await refresh();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
