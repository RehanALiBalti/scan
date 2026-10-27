import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";

async function authHeader(): Promise<Record<string, string>> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await authHeader()),
  };

  const res = await fetch(path, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

/** Upload a file via multipart FormData (do not set Content-Type). */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const headers = await authHeader();
  const res = await fetch(path, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error || `Upload failed (${res.status})`,
    );
  }
  return data as T;
}

export function canUseAdminApi() {
  return isFirebaseConfigured;
}
