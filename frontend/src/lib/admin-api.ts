export type AdminProfile = { id: string; email: string; displayName: string; status: string; lastLoginAt: string | null; roles: string[] };
export type AdminSession = { id: string; userAgent: string | null; ipAddress: string | null; createdAt: string; lastUsedAt: string | null; expiresAt: string; current: boolean };
export type CmsRecord = Record<string, unknown> & { id: string };
export type ContentRevision = { id: string; version: number; createdAt: string; publishedAt: string | null; createdBy: { displayName: string } | null; publishedBy: { displayName: string } | null };

type Envelope<T> = { data: T };
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

async function request<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...init?.headers } });
  if (response.status === 401 && retry && path !== "/admin/auth/refresh") {
    const refreshed = await fetch(`${apiUrl}/admin/auth/refresh`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } });
    if (refreshed.ok) return request<T>(path, init, false);
  }
  const payload = await response.json().catch(() => null) as Envelope<T> | { message?: string } | null;
  if (!response.ok) throw new Error(payload && "message" in payload && payload.message ? payload.message : "Request could not be completed");
  return (payload as Envelope<T>).data;
}

export const adminApi = {
  login: (email: string, password: string, rememberMe: boolean) => request<{ admin: AdminProfile }>("/admin/auth/login", { method: "POST", body: JSON.stringify({ email, password, rememberMe }) }, false),
  logout: () => request<{ loggedOut: boolean }>("/admin/auth/logout", { method: "POST" }, false),
  forgot: (email: string) => request<{ message: string }>("/admin/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }, false),
  reset: (token: string, password: string) => request<{ reset: boolean }>("/admin/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }, false),
  me: () => request<AdminProfile>("/admin/auth/me"),
  dashboard: () => request<Record<string, unknown>>("/admin/dashboard"),
  sessions: () => request<AdminSession[]>("/admin/auth/sessions"),
  revokeSession: (id: string) => request<{ revoked: boolean }>(`/admin/auth/sessions/${id}`, { method: "DELETE" }),
  logoutAll: () => request<{ loggedOut: boolean }>("/admin/auth/logout-all", { method: "POST" }),
  changePassword: (currentPassword: string, newPassword: string) => request<{ changed: boolean }>("/admin/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),
  cmsList: (resource: string, search = "") => request<CmsRecord[]>(`/admin/cms/${resource}${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  cmsCreate: (resource: string, data: Record<string, unknown>) => request<CmsRecord>(`/admin/cms/${resource}`, { method: "POST", body: JSON.stringify({ data }) }),
  cmsUpdate: (resource: string, id: string, data: Record<string, unknown>) => request<CmsRecord>(`/admin/cms/${resource}/${id}`, { method: "PATCH", body: JSON.stringify({ data }) }),
  cmsArchive: (resource: string, id: string) => request<{ archived: boolean }>(`/admin/cms/${resource}/${id}`, { method: "DELETE" }),
  submissionStatus: (resource: "quotes" | "contacts", id: string, status: string) => request<CmsRecord>(`/admin/cms/${resource}/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  previewContent: (resource: string, id: string) => request<{ path: string; expiresInSeconds: number }>(`/admin/publishing/${resource}/${id}/preview`, { method: "POST" }),
  publishContent: (resource: string, id: string) => request<{ published: boolean; version: number }>(`/admin/publishing/${resource}/${id}/publish`, { method: "POST" }),
  unpublishContent: (resource: string, id: string) => request<{ unpublished: boolean }>(`/admin/publishing/${resource}/${id}/unpublish`, { method: "POST" }),
  revisions: (resource: string, id: string) => request<ContentRevision[]>(`/admin/publishing/${resource}/${id}/revisions`),
};
