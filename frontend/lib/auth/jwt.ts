export type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  [key: string]: unknown;
};

const NAME_IDENTIFIER =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const EMAIL =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const ROLE =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

/**
 * Decodes the JWT payload for display only. The token is issued by the backend
 * and kept in an httpOnly cookie; upstream endpoints still validate it.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const segment = token.split(".")[1];
  if (!segment) return null;

  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  try {
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function claim(payload: JwtPayload, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

export function readIdentity(payload: JwtPayload) {
  return {
    id: claim(payload, "sub", NAME_IDENTIFIER, "nameid") ?? "",
    email: claim(payload, "email", EMAIL) ?? "",
    role: claim(payload, "role", ROLE) ?? "User",
  };
}

export function isExpired(payload: JwtPayload) {
  if (typeof payload.exp !== "number") return false;
  return payload.exp * 1000 <= Date.now();
}
