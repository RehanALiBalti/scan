"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getContactMessage, removeContactMessage } from "@/lib/adminStore";
import type { ContactMessage } from "@/lib/contactUs";

export function ContactDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [item, setItem] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    void getContactMessage(id)
      .then(setItem)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="toolbar-copy">Loading…</p>;
  if (error || !item) {
    return (
      <div>
        <p className="error">{error || "Message not found"}</p>
        <Link href="/contact" className="btn btn-soft" style={{ marginTop: 12 }}>
          Back to Contact Us
        </Link>
      </div>
    );
  }

  return (
    <div className="contact-full">
      <Link href="/contact" className="link-back">
        ← Contact Us
      </Link>

      <article className="contact-full-card">
        <header className="contact-full-head">
          <div>
            <p className="routine-kicker">contactUs / {item.id}</p>
            <h2>{item.name}</h2>
            <p className="toolbar-copy">
              {item.createdLabel} · {item.relativeLabel}
            </p>
          </div>
          <div className="product-actions">
            <a className="btn btn-primary" href={`mailto:${item.email}`}>
              Reply by email
            </a>
            <button
              type="button"
              className="btn btn-soft"
              onClick={async () => {
                if (!confirm("Delete this message?")) return;
                await removeContactMessage(item.id);
                router.push("/contact");
              }}
            >
              Delete
            </button>
          </div>
        </header>

        <dl className="contact-meta contact-meta-wide">
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${item.email}`}>{item.email}</a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${item.phone}`}>{item.phone || "—"}</a>
            </dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>
              <code>{item.userId || "—"}</code>
            </dd>
          </div>
        </dl>

        <section className="contact-body contact-body-lg">
          <p className="label-caps">Message</p>
          <p>{item.message}</p>
        </section>
      </article>
    </div>
  );
}
