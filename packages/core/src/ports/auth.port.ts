import type { SessionWithUser } from "../domain/session";

export interface AuthPort {
  getSession(headers: Headers): Promise<SessionWithUser | null>;
  requireSession(headers: Headers): Promise<SessionWithUser>;
  requireAdmin(headers: Headers): Promise<SessionWithUser>;
}
