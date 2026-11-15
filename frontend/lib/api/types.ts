export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]> | null;
  statusCode: number;
  timestamp: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type RegisteredUser = {
  email: string | null;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string;
  status: number;
  role: number;
};

export type SessionUser = {
  id: string;
  email: string;
  role: "User" | "Staff" | "Admin" | string;
};

export type Session = {
  user: SessionUser;
};
