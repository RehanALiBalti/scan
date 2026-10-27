"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";

const NAV = [
  { to: "/overview", label: "Overview", icon: "/assets/admin/icon-home.svg" },
  { to: "/users", label: "Users Registry", icon: "/assets/admin/icon-users.svg" },
  { to: "/routines", label: "Routine Checks", icon: "/assets/admin/icon-blog.svg" },
  { to: "/blog", label: "Content / Blog", icon: "/assets/admin/icon-blog.svg" },
  { to: "/contact", label: "Contact Us", icon: "/assets/admin/icon-bell.svg" },
];

function pageTitle(pathname: string) {
  if (pathname === "/blog/new") {
    return "New Journal Article";
  }
  if (pathname.startsWith("/blog/") && pathname !== "/blog") {
    return "Edit Journal Article";
  }
  if (pathname.startsWith("/users/") && pathname !== "/users") {
    return "User Profile / Detail View";
  }
  if (pathname === "/routines/new") {
    return "Add Daily Routine Plan";
  }
  if (pathname.startsWith("/routines/") && pathname !== "/routines") {
    return "Edit Daily Routine Plan";
  }
  if (pathname.startsWith("/contact/") && pathname !== "/contact") {
    return "Contact Message";
  }
  const map: Record<string, string> = {
    "/overview": "Dashboard Overview",
    "/users": "Users Registry",
    "/routines": "Routine Checks",
    "/blog": "Content / Blog",
    "/contact": "Contact Us",
  };
  return map[pathname] || "Scan + Admin";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, profile, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitle(pathname);
  const isAdmin = Boolean(user && profile?.userRole === "admin");

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/");
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="login-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <img src="/assets/admin/logo.png" alt="Scan +" />
            <span>Scan +</span>
          </div>
          <nav className="nav-links">
            {NAV.map((item) => {
              const active =
                pathname === item.to ||
                (item.to === "/users" && pathname.startsWith("/users")) ||
                (item.to === "/routines" && pathname.startsWith("/routines")) ||
                (item.to === "/blog" && pathname.startsWith("/blog")) ||
                (item.to === "/contact" && pathname.startsWith("/contact"));
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={`nav-link${active ? " active" : ""}`}
                >
                  <img src={item.icon} alt="" width={18} height={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="admin-info">
            <img src="/assets/admin/avatar.png" alt="" />
            <div>
              <strong>
                {profile?.displayName || user?.displayName || "Admin"}
              </strong>
              <span>{profile?.email || user?.email || "admin"}</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-logout"
            onClick={async () => {
              await logout();
              router.replace("/");
            }}
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar-actions">
            <label className="search">
              <img src="/assets/admin/icon-search.svg" alt="" width={16} height={16} />
              <input placeholder="Search users, blogs, contacts..." />
            </label>
            <button type="button" className="icon-btn" aria-label="Notifications">
              <img src="/assets/admin/icon-bell.svg" alt="" width={18} height={18} />
            </button>
            <span className="topbar-divider" aria-hidden />
            <div className="status-pill">
              <i /> System Active
            </div>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
