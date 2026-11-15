export type MeProfile = {
  id: string;
  email: string | null;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string;
  role: string;
  status: string;
  locale: string | null;
  marketingConsent: boolean;
  hasPassword: boolean;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  createdOnUtc: string;
};

export type AddressItem = {
  id: number;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: number | string;
  sendBy: string;
  channels: string[];
  scope: string;
  link: string | null;
  metadata: string | null;
  i18n: string | null;
  isRead: boolean;
  readAt: string | null;
  createdOnUtc: string;
};

export type NotificationList = {
  items: NotificationItem[];
  unreadCount: number;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api/proxy${path}`, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error("The studio is offline right now. Please try again.");
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const detail =
      body && typeof body === "object"
        ? ((body as { detail?: string; message?: string; title?: string }).detail ??
          (body as { message?: string }).message ??
          (body as { title?: string }).title)
        : null;
    throw new Error(detail || "Something went wrong. Please try again.");
  }

  return body as T;
}
