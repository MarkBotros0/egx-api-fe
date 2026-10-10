/** Shared with egx-api-mobile — keep platform-neutral (see apiConfig.ts). */

export type UserRole = "user" | "admin";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

/** Anything that isn't literally "admin" is a plain user. */
export function asRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "user";
}
