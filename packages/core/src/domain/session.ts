import type { UserId, SessionToken } from "./brand";

export interface Session {
  readonly id: string;
  readonly token: SessionToken;
  readonly userId: UserId;
  readonly expiresAt: Date;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SessionWithUser {
  readonly session: Session;
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly role: string;
    readonly image: string | null;
    readonly banned: boolean;
  };
}
