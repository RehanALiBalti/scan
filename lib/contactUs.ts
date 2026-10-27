import { formatSignupDate, relativeTime, toMillis } from "./time";

export const CONTACT_US_COLLECTION = "contactUs";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  userId: string;
  createdAt: number;
  createdLabel: string;
  relativeLabel: string;
};

export function mapContactDoc(
  id: string,
  data: Record<string, unknown>,
): ContactMessage {
  const createdAt = toMillis(data.createdAt) ?? 0;
  return {
    id,
    name: String(data.name || "Unknown"),
    email: String(data.email || ""),
    phone: String(data.phone || ""),
    message: String(data.message || ""),
    userId: String(data.userId || ""),
    createdAt,
    createdLabel: formatSignupDate(createdAt || null),
    relativeLabel: createdAt ? relativeTime(createdAt) : "—",
  };
}
