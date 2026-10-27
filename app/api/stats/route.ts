import { NextRequest } from "next/server";
import { json, requireAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { BLOGS_COLLECTION } from "@/lib/blogs";
import { CONTACT_US_COLLECTION } from "@/lib/contactUs";
import { PRODUCTS_COLLECTION } from "@/lib/products";
import {
  formatTrend,
  relativeTime,
  startOfDay,
  toMillis,
} from "@/lib/time";

export type OverviewActivity = {
  id: string;
  name: string;
  detail: string;
  time: string;
  warn: boolean;
  at: number;
};

export type OverviewBar = {
  day: string;
  h: number;
  count: number;
  hot?: boolean;
};

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const db = adminDb();

    const [usersSnap, blogsSnap, productsSnap, contactSnap] =
      await Promise.all([
        db.collection("users").where("userRole", "==", "users").get(),
        db.collection(BLOGS_COLLECTION).get(),
        db.collection(PRODUCTS_COLLECTION).get(),
        db.collection(CONTACT_US_COLLECTION).get(),
      ]);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * dayMs;
    const twoWeeksAgo = now - 14 * dayMs;
    const dayAgo = now - dayMs;
    const twoDaysAgo = now - 2 * dayMs;

    type UserRow = {
      id: string;
      name: string;
      email: string;
      concern: string;
      scanCompleted: boolean;
      createdAt: number | null;
      updatedAt: number | null;
    };

    const users: UserRow[] = usersSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: String(data.name || data.displayName || "User"),
        email: String(data.email || ""),
        concern: String(
          data.mainSkinGoal || data.additionalSkinConcern || data.goal || "",
        ),
        scanCompleted: Boolean(data.scanCompleted),
        createdAt: toMillis(data.createdAt),
        updatedAt: toMillis(data.updatedAt) ?? toMillis(data.fcmTokenUpdatedAt),
      };
    });

    const totalUsers = users.length;

    type ContactRow = {
      id: string;
      name: string;
      userId: string;
      createdAt: number | null;
      message: string;
    };

    const contacts: ContactRow[] = contactSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: String(data.name || "User"),
        userId: String(data.userId || ""),
        createdAt: toMillis(data.createdAt),
        message: String(data.message || ""),
      };
    });

    const contactUserIds = new Set(
      contacts.map((c) => c.userId).filter(Boolean),
    );
    // Logged-in users who submitted Contact Us (unique userId)
    const contactUsers = contactUserIds.size || contacts.length;
    const contactMessages = contacts.length;

    const contactsThisWeek = contacts.filter(
      (c) => c.createdAt != null && c.createdAt >= weekAgo,
    ).length;
    const contactsPrevWeek = contacts.filter(
      (c) =>
        c.createdAt != null &&
        c.createdAt >= twoWeeksAgo &&
        c.createdAt < weekAgo,
    ).length;

    const newSignups = users.filter(
      (u) => u.createdAt != null && u.createdAt >= dayAgo,
    ).length;
    const prevSignups = users.filter(
      (u) =>
        u.createdAt != null &&
        u.createdAt >= twoDaysAgo &&
        u.createdAt < dayAgo,
    ).length;

    const weeklyActive = users.filter((u) => {
      const t = u.updatedAt ?? u.createdAt;
      return t != null && t >= weekAgo;
    }).length;
    const prevWeeklyActive = users.filter((u) => {
      const t = u.updatedAt ?? u.createdAt;
      return t != null && t >= twoWeeksAgo && t < weekAgo;
    }).length;

    // Last 7 days contact bars (oldest → newest)
    const dayLabels: OverviewBar[] = [];
    const counts: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfDay(now - i * dayMs);
      const dayEnd = dayStart + dayMs;
      const label = new Date(dayStart).toLocaleDateString("en-US", {
        weekday: "short",
      });
      const count = contacts.filter(
        (c) =>
          c.createdAt != null &&
          c.createdAt >= dayStart &&
          c.createdAt < dayEnd,
      ).length;

      counts.push(count);
      dayLabels.push({ day: label, h: 0, count });
    }

    const maxCount = Math.max(1, ...counts);
    let hotIdx = 0;
    counts.forEach((c, i) => {
      if (c >= counts[hotIdx]!) hotIdx = i;
    });
    const scanBars: OverviewBar[] = dayLabels.map((b, i) => ({
      ...b,
      h: Math.max(8, Math.round((counts[i]! / maxCount) * 180)),
      hot: counts[i]! > 0 && i === hotIdx,
    }));

    // Live activity: contacts + signups + profile updates
    const activity: OverviewActivity[] = [];

    for (const c of contacts) {
      if (c.createdAt == null) continue;
      const preview =
        c.message.length > 60 ? `${c.message.slice(0, 60)}…` : c.message;
      activity.push({
        id: `contact-${c.id}`,
        name: c.name,
        detail: preview ? `Contact Us · ${preview}` : "Submitted Contact Us",
        time: relativeTime(c.createdAt, now),
        warn: false,
        at: c.createdAt,
      });
    }

    for (const u of users) {
      if (u.createdAt != null && u.createdAt >= weekAgo) {
        activity.push({
          id: `signup-${u.id}`,
          name: u.name,
          detail: "Registered account",
          time: relativeTime(u.createdAt, now),
          warn: false,
          at: u.createdAt,
        });
      } else if (u.updatedAt != null && u.updatedAt >= weekAgo) {
        activity.push({
          id: `update-${u.id}`,
          name: u.name,
          detail: u.concern
            ? `Profile updated · ${u.concern}`
            : "Profile updated",
          time: relativeTime(u.updatedAt, now),
          warn: false,
          at: u.updatedAt,
        });
      }
    }

    activity.sort((a, b) => b.at - a.at);
    const feed = activity.slice(0, 12).map(({ at: _at, ...rest }) => rest);

    const usersTrend = formatTrend(totalUsers, Math.max(0, totalUsers - newSignups));
    const signupsTrend = formatTrend(newSignups, prevSignups);
    const contactTrend = formatTrend(contactsThisWeek, contactsPrevWeek);
    const weeklyTrend = formatTrend(weeklyActive, prevWeeklyActive);

    return json({
      totalUsers,
      newSignups,
      contactUsers,
      contactMessages,
      weeklyActive,
      publishedBlogs: blogsSnap.docs.filter((d) => d.data().published).length,
      products: productsSnap.size,
      scanBars,
      activity: feed,
      trends: {
        totalUsers: usersTrend,
        newSignups: signupsTrend,
        contactUsers: contactTrend,
        weeklyActive: weeklyTrend,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: "Failed to load stats" }, 500);
  }
}
