"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listRoutineChecks, removeRoutineCheck } from "@/lib/adminStore";
import {
  formatRoutineDocLabel,
  type RoutineCheckDoc,
} from "@/lib/routineChecks";

export function RoutineChecks() {
  const router = useRouter();
  const [items, setItems] = useState<RoutineCheckDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listRoutineChecks());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
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
          Daily plan docs in Firestore <code>RoutineChecks</code>. Doc ID must be{" "}
          <strong>ddMMyyyy</strong> (e.g. 26102026).
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => router.push("/routines/new")}
        >
          + Add Day Plan
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="toolbar-copy">Loading…</p> : null}
      {!loading && !items.length ? (
        <p className="toolbar-copy">
          No RoutineChecks yet. Add today&apos;s plan so the app Daily Plan is not blank.
        </p>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Doc ID</th>
              <th>Tasks</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{formatRoutineDocLabel(item.id)}</strong>
                </td>
                <td>
                  <code>{item.id}</code>
                </td>
                <td>{item.taskCount}</td>
                <td>
                  {item.updatedAt
                    ? new Date(item.updatedAt).toLocaleString()
                    : "—"}
                </td>
                <td>
                  <div className="product-actions">
                    <Link href={`/routines/${item.id}`} className="btn btn-soft">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={async () => {
                        if (!confirm(`Delete RoutineChecks/${item.id}?`)) return;
                        await removeRoutineCheck(item.id);
                        await refresh();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
