"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listUsers } from "@/lib/adminStore";
import type { AdminUser } from "@/data/seed";

const PAGE_SIZE = 5;

export function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">(
    "Active",
  );
  const [concernFilter, setConcernFilter] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void listUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const concerns = useMemo(() => {
    const set = new Set(
      users.map((u) => u.concern).filter((c) => c && c !== "—"),
    );
    return ["All", ...Array.from(set).sort()];
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Active"
          ? u.status === "Active"
          : u.status === "Inactive" ||
            u.status === "Pending" ||
            u.status === "Flagged");
      const matchConcern =
        concernFilter === "All" || u.concern === concernFilter;
      return matchStatus && matchConcern;
    });
  }, [users, statusFilter, concernFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, total);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, concernFilter]);

  const pageNumbers = useMemo(() => {
    const max = Math.min(totalPages, 5);
    const start = Math.max(1, Math.min(safePage - 1, totalPages - max + 1));
    return Array.from({ length: max }, (_, i) => start + i);
  }, [safePage, totalPages]);

  return (
    <div className="registry-panel">
      <div className="registry-toolbar">
        <div className="registry-filters">
          <label className="registry-select">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "All" | "Active" | "Inactive")
              }
              aria-label="Status filter"
            >
              <option value="All">All Statuses</option>
              <option value="Active">All Statuses (Active)</option>
              <option value="Inactive">All Statuses (Inactive)</option>
            </select>
          </label>
          <label className="registry-select">
            <select
              value={concernFilter}
              onChange={(e) => setConcernFilter(e.target.value)}
              aria-label="Skin concern filter"
            >
              {concerns.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "Skin Concern (All)" : c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="registry-count">
          {loading
            ? "Loading users…"
            : `Showing ${from}-${to} of ${total.toLocaleString()} registered users`}
        </p>
      </div>

      <div className="table-wrap registry-table">
        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email Address</th>
              <th>Signup Date</th>
              <th>Last Active</th>
              <th>Scans</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !pageItems.length ? (
              <tr>
                <td colSpan={7} style={{ color: "var(--muted)" }}>
                  No users match these filters.
                </td>
              </tr>
            ) : null}
            {pageItems.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <img className="avatar" src={u.avatar} alt="" />
                    <strong>{u.name}</strong>
                  </div>
                </td>
                <td className="registry-email">{u.email}</td>
                <td>{u.signupDate || "—"}</td>
                <td>{u.lastActive}</td>
                <td>
                  <strong>{u.scans}</strong>
                </td>
                <td>
                  <span
                    className={`badge ${
                      u.status === "Active" ? "badge-green" : "badge-muted"
                    }`}
                  >
                    {u.status === "Active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <Link href={`/users/${u.id}`} className="link-action">
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="registry-pagination">
        <button
          type="button"
          className="page-btn"
          disabled={safePage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <div className="page-numbers">
          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              className={`page-num${n === safePage ? " active" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="page-btn"
          disabled={safePage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
