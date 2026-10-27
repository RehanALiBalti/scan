"use client";

import { useEffect, useState } from "react";
import { listScans } from "@/lib/adminStore";
import type { AdminScan } from "@/data/seed";

export function Scans() {
  const [scans, setScans] = useState<AdminScan[]>([]);

  useEffect(() => {
    void listScans().then(setScans);
  }, []);

  return (
    <>
      <div className="toolbar">
        <p className="toolbar-copy">Review facial diagnostic results across the platform.</p>
        <button type="button" className="btn btn-soft">
          Export CSV
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Concern</th>
              <th>Hydration</th>
              <th>Oiliness</th>
              <th>Wrinkles</th>
              <th>Diagnostic Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.user}</strong>
                </td>
                <td>{s.concern}</td>
                <td>{s.hydration}%</td>
                <td>{s.oiliness}%</td>
                <td>{s.wrinkles}%</td>
                <td>
                  <span
                    className={`badge ${
                      s.status === "Complete"
                        ? "badge-green"
                        : s.status === "Review"
                          ? "badge-amber"
                          : "badge-rose"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td>{s.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
