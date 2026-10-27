"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listProducts, removeProduct } from "@/lib/adminStore";
import type { AdminProduct } from "@/data/seed";

export function Products() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await listProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <>
      <div className="toolbar">
        <p className="toolbar-copy">
          Manage recommended skincare products for matching ({products.length}).
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => router.push("/products/new")}
        >
          + Add New Product
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="toolbar-copy">Loading products…</p> : null}
      {!loading && !products.length ? (
        <p className="toolbar-copy">No products in Firestore yet. Add one to get started.</p>
      ) : null}

      <div className="product-grid">
        {products.map((p) => (
          <article key={p.id} className="product-card">
            <div className="product-media">
              <img src={p.image || "/assets/product.png"} alt={p.name} />
              <span className="product-fit">{p.fit}% fit</span>
            </div>
            <div className="body">
              <h3>{p.name}</h3>
              <p className="meta">
                {p.brand || p.category}
                {p.sku ? ` · ${p.sku}` : ""}
              </p>
              <div className="product-meta-row">
                <strong>${Number(p.price || 0).toFixed(2)}</strong>
                <span
                  className={`badge ${
                    p.publishStatus === "Archived" || p.stock === "Out"
                      ? "badge-rose"
                      : p.stock === "Low"
                        ? "badge-amber"
                        : "badge-green"
                  }`}
                >
                  {p.publishStatus || p.stock}
                </span>
              </div>
              <div className="product-actions">
                <Link href={`/products/${p.id}`} className="btn btn-soft">
                  Edit
                </Link>
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={async () => {
                    await removeProduct(p.id);
                    await refresh();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
