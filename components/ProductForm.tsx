"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProduct, saveProduct } from "@/lib/adminStore";
import { CONCERNS, SKIN_TYPES, type AdminProduct } from "@/data/seed";

type FormState = Omit<AdminProduct, "id" | "createdAt" | "updatedAt">;

const defaults: FormState = {
  name: "",
  brand: "",
  category: "Moisturizers & Oils",
  sku: "",
  description: "",
  skinTypes: [],
  concerns: [],
  price: 0,
  fit: 80,
  stock: "In Stock",
  publishStatus: "Active",
  image: "/assets/admin/product-preview.png",
  tag: "",
  matchLabel: "",
};

function toggle(list: string[] = [], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ProductForm() {
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaults);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(id && id !== "new"));

  useEffect(() => {
    if (!id || id === "new") return;
    void getProduct(id)
      .then((p) => {
        if (!p) {
          setError("Product not found");
          return;
        }
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = p;
        setForm({ ...defaults, ...rest });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveProduct(id && id !== "new" ? { ...form, id } : form);
      router.push("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="toolbar-copy">Loading product…</p>;
  }

  return (
    <form className="editor-grid" onSubmit={onSubmit}>
      <div className="editor-main">
        <section className="editor-card">
          <h2>Product Identification</h2>
          <label className="form-label">
            <span className="label-caps">Product Name</span>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <div className="form-row-2">
            <label className="form-label">
              <span className="label-caps">Brand</span>
              <input
                className="form-input"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </label>
            <label className="form-label">
              <span className="label-caps">Price (USD)</span>
              <input
                className="form-input"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="form-row-2">
            <label className="form-label">
              <span className="label-caps">Category</span>
              <input
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </label>
            <label className="form-label">
              <span className="label-caps">SKU / Reference ID</span>
              <input
                className="form-input"
                value={form.sku || ""}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </label>
          </div>
          <label className="form-label">
            <span className="label-caps">Formula Description</span>
            <textarea
              className="form-textarea"
              rows={5}
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="form-label">
            <span className="label-caps">Target Skin Types</span>
            <div className="check-grid">
              {SKIN_TYPES.map((t) => (
                <label key={t} className="check-item">
                  <input
                    type="checkbox"
                    checked={form.skinTypes?.includes(t) || false}
                    onChange={() =>
                      setForm({ ...form, skinTypes: toggle(form.skinTypes, t) })
                    }
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div className="form-label">
            <span className="label-caps">Dermatological Concerns Addressed</span>
            <div className="check-grid">
              {CONCERNS.map((c) => (
                <label key={c} className="check-item">
                  <input
                    type="checkbox"
                    checked={form.concerns?.includes(c) || false}
                    onChange={() =>
                      setForm({ ...form, concerns: toggle(form.concerns, c) })
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>

      <aside className="editor-side">
        <section className="editor-card">
          <h3 className="side-title">Product Imagery</h3>
          <div className="image-preview">
            {form.image ? <img src={form.image} alt={form.name || "Product"} /> : null}
          </div>
          <label className="form-label">
            <span className="label-caps">Image URL</span>
            <input
              className="form-input"
              type="url"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://..."
            />
          </label>
        </section>

        <section className="editor-card">
          <h3>Dermatology Meta &amp; Status</h3>
          <label className="form-label">
            Recommendation Strength Score
            <input
              className="form-input"
              type="number"
              min={0}
              max={100}
              value={form.fit}
              onChange={(e) => setForm({ ...form, fit: Number(e.target.value) })}
            />
          </label>
          <label className="form-label">
            Match Label
            <input
              className="form-input"
              value={form.matchLabel || ""}
              onChange={(e) => setForm({ ...form, matchLabel: e.target.value })}
              placeholder="Best for Hydration"
            />
          </label>
          <div className="form-label">
            <span>Publish Status</span>
            <div className="status-toggle">
              <button
                type="button"
                className={`status-opt${form.publishStatus === "Active" ? " active-green" : ""}`}
                onClick={() =>
                  setForm({ ...form, publishStatus: "Active", stock: "In Stock" })
                }
              >
                <i /> Active
              </button>
              <button
                type="button"
                className={`status-opt${form.publishStatus === "Archived" ? " active-muted" : ""}`}
                onClick={() =>
                  setForm({ ...form, publishStatus: "Archived", stock: "Out" })
                }
              >
                <i /> Archived
              </button>
            </div>
          </div>
        </section>

        {error ? <p className="error">{error}</p> : null}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => router.push("/products")}
          >
            Discard Draft
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Saving…" : id && id !== "new" ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </aside>
    </form>
  );
}
