"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserProfile, type UserProfileData } from "@/lib/adminStore";

export function UserProfile() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    void getUserProfile(id)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load profile"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="toolbar-copy">Loading profile…</p>;
  }

  if (error || !data) {
    return (
      <div>
        <p className="error">{error || "User not found"}</p>
        <Link href="/users" className="btn btn-soft" style={{ marginTop: 12 }}>
          Back to Users Registry
        </Link>
      </div>
    );
  }

  const { user, scans, routine } = data;

  return (
    <div className="profile-page">
      <div className="profile-back">
        <Link href="/users" className="link-back">
          ← Users Registry
        </Link>
      </div>

      <div className="profile-grid-layout">
        <section className="profile-card profile-identity">
          <img className="profile-avatar" src={user.avatar} alt="" />
          <h2>{user.name}</h2>
          <p className="profile-email">{user.email}</p>
          <div className="profile-meta">
            <div>
              <span>Client Since</span>
              <strong>{user.clientSince}</strong>
            </div>
            <div>
              <span>Primary Skin Type</span>
              <strong>{user.primarySkinType}</strong>
            </div>
          </div>
        </section>

        <section className="profile-card">
          <h3>Recent Diagnostic Scans</h3>
          <div className="scan-rows">
            {!scans.length ? (
              <p className="toolbar-copy">No scans recorded yet.</p>
            ) : null}
            {scans.map((s) => (
              <div key={s.id} className="scan-row">
                <div>
                  <strong>{s.when}</strong>
                  <p>
                    Hydration: {s.hydration}% ({s.label})
                  </p>
                </div>
                <Link href="/scans" className="link-action">
                  Inspect Scan
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="profile-card">
          <h3>Active Skin Concerns</h3>
          <div className="concern-tags">
            {!user.concerns.length ? (
              <p className="toolbar-copy">No concerns listed.</p>
            ) : null}
            {user.concerns.map((c) => (
              <span key={c} className="concern-tag">
                {c}
              </span>
            ))}
          </div>
        </section>

        <section className="profile-card">
          <h3>Dermatologist-Approved Routine</h3>
          <div className="routine-grid">
            {!routine.length ? (
              <p className="toolbar-copy">No matching products yet.</p>
            ) : null}
            {routine.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="routine-item"
              >
                <div className="routine-thumb">
                  <img src={p.image || "/assets/product.png"} alt="" />
                </div>
                <div>
                  <span className="routine-slot">{p.slot}</span>
                  <strong>{p.name}</strong>
                  <p>${Number(p.price || 0).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
