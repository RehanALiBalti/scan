"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listContactMessages, removeContactMessage } from "@/lib/adminStore";
import type { ContactMessage } from "@/lib/contactUs";

export function ContactUs() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listContactMessages());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        m.email.toLowerCase().includes(needle) ||
        m.phone.includes(needle) ||
        m.message.toLowerCase().includes(needle),
    );
  }, [items, q]);

  return (
    <>
      <div className="contact-hero">
        <div>
          <p className="routine-kicker">Inbox · contactUs</p>
          <h2>Contact messages</h2>
          <p className="toolbar-copy">
            Messages submitted from the app. Showing {filtered.length} of{" "}
            {items.length}.
          </p>
        </div>
        <label className="search search-inline contact-search">
          <img src="/assets/admin/icon-search.svg" alt="" width={16} height={16} />
          <input
            placeholder="Search name, email, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="toolbar-copy">Loading messages…</p> : null}
      {!loading && !filtered.length ? (
        <p className="toolbar-copy">No contact messages yet.</p>
      ) : null}

      <div className="contact-layout">
        <div className="table-wrap contact-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Received</th>
                <th>Preview</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  className={selected?.id === m.id ? "row-active" : undefined}
                >
                  <td>
                    <strong>{m.name}</strong>
                  </td>
                  <td className="registry-email">{m.email || "—"}</td>
                  <td>{m.phone || "—"}</td>
                  <td>
                    <div>{m.createdLabel}</div>
                    <small className="muted-sm">{m.relativeLabel}</small>
                  </td>
                  <td className="contact-preview-cell">
                    {m.message.slice(0, 72)}
                    {m.message.length > 72 ? "…" : ""}
                  </td>
                  <td>
                    <div className="product-actions">
                      <button
                        type="button"
                        className="link-action"
                        onClick={() => setSelected(m)}
                      >
                        Open
                      </button>
                      <Link
                        href={`/contact/${m.id}`}
                        className="btn btn-soft"
                        style={{ minHeight: 32, padding: "0 12px" }}
                      >
                        Full
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="contact-detail-panel">
          {selected ? (
            <>
              <div className="contact-detail-head">
                <div>
                  <p className="label-caps">Message</p>
                  <h3>{selected.name}</h3>
                </div>
                <button
                  type="button"
                  className="btn btn-soft"
                  style={{ minHeight: 36 }}
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
              <dl className="contact-meta">
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${selected.phone}`}>{selected.phone || "—"}</a>
                  </dd>
                </div>
                <div>
                  <dt>Received</dt>
                  <dd>
                    {selected.createdLabel} · {selected.relativeLabel}
                  </dd>
                </div>
                <div>
                  <dt>User ID</dt>
                  <dd>
                    <code>{selected.userId || "—"}</code>
                  </dd>
                </div>
              </dl>
              <div className="contact-body">
                <p className="label-caps">Message</p>
                <p>{selected.message}</p>
              </div>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <Link href={`/contact/${selected.id}`} className="btn btn-primary">
                  Open full view
                </Link>
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={async () => {
                    if (!confirm("Delete this message?")) return;
                    await removeContactMessage(selected.id);
                    setSelected(null);
                    await refresh();
                  }}
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="contact-empty">
              <p className="label-caps">Detail</p>
              <p className="toolbar-copy">
                Select a message to read the full inquiry.
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
