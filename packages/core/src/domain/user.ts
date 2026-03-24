import type { UserId, Email } from "./brand";

export type Role = "admin" | "user";

export interface User {
  readonly id: UserId;
  readonly name: string;
  readonly email: Email;
  readonly emailVerified: boolean;
  readonly image: string | null;
  readonly role: Role;
  readonly banned: boolean;
  readonly banReason: string | null;
  readonly banExpires: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
