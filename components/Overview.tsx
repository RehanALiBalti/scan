"use client";

import { useEffect, useState } from "react";
import { fetchStats, type OverviewStats } from "@/lib/adminStore";

const empty: OverviewStats = {
  totalUsers: 0,
  newSignups: 0,
  contactUsers: 0,
  contactMessages: 0,
  weeklyActive: 0,
  scanBars: [],
  activity: [],
  trends: {
    totalUsers: { trend: "0%", down: false },
    newSignups: { trend: "0%", down: false },
    contactUsers: { trend: "0%", down: false },
    weeklyActive: { trend: "0%", down: false },
  },
};

export function Overview() {
  const [stats, setStats] = useState<OverviewStats>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load overview"),
      )
      .finally(() => setLoading(false));
  }, []);

  const contactSub =
    typeof stats.contactMessages === "number"
      ? `${stats.contactMessages.toLocaleString()} total messages in Contact Us`
      : "Logged-in users who submitted Contact Us";

  const kpis = [
    {
      key: "totalUsers" as const,
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      sub: "App registrants (role: users)",
    },
    {
      key: "newSignups" as const,
      label: "New Signups Today",
      value: stats.newSignups.toLocaleString(),
      sub: "Past 24 hours",
    },
    {
      key: "contactUsers" as const,
      label: "Contact Us",
      value: stats.contactUsers.toLocaleString(),
      sub: contactSub,
    },
    {
      key: "weeklyActive" as const,
      label: "Weekly Active Users",
      value: stats.weeklyActive.toLocaleString(),
      sub: "Active in the last 7 days",
    },
  ];

  return (
    <>
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="toolbar-copy">Loading overview…</p> : null}

      <div className="kpi-row">
        {kpis.map((k) => {
          const t = stats.trends?.[k.key] ?? { trend: "—", down: false };
          return (
            <article key={k.label} className="kpi-card">
              <div className="kpi-top">
                <span>{k.label}</span>
                <div className={`trend${t.down ? " down" : ""}`}>{t.trend}</div>
              </div>
              <div>
                <strong>{k.value}</strong>
                <p>{k.sub}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="bento">
        <section className="panel">
          <div className="panel-head">
            <h2>Contact Activity</h2>
            <span>Last 7 Days</span>
          </div>
          <div className="bars">
            {(stats.scanBars.length
              ? stats.scanBars
              : Array.from({ length: 7 }, (_, i) => ({
                  day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                    (new Date().getDay() - 6 + i + 7) % 7
                  ]!,
                  h: 8,
                  count: 0,
                }))
            ).map((b) => (
              <div
                key={b.day + String(b.count)}
                className="bar-col"
                title={`${b.count} messages`}
              >
                <div
                  className={`bar${b.hot ? " hot" : ""}`}
                  style={{ height: b.h || 8 }}
                />
                <span>{b.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Live Activity Feed</h2>
          </div>
          <div className="activity-list">
            {!loading && !stats.activity.length ? (
              <p className="toolbar-copy">No recent activity yet.</p>
            ) : null}
            {stats.activity.map((a) => (
              <div key={a.id} className="activity-item">
                <span className={`dot${a.warn ? " warn" : ""}`} />
                <div>
                  <strong>{a.name}</strong>
                  <p>{a.detail}</p>
                </div>
                <time>{a.time}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
