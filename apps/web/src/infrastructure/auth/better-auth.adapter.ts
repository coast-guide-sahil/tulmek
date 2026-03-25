import type { AuthPort } from "@tulmek/core/ports";
import type { SessionWithUser } from "@tulmek/core/domain";
import { DomainErrors } from "@tulmek/core/domain";
import { auth } from "./better-auth.config";

export class BetterAuthAdapter implements AuthPort {
  async getSession(headers: Headers): Promise<SessionWithUser | null> {
    const session = await auth.api.getSession({ headers });
    if (!session) return null;
    return session as unknown as SessionWithUser;
  }

  async requireSession(headers: Headers): Promise<SessionWithUser> {
    const session = await this.getSession(headers);
    if (!session) throw DomainErrors.unauthorized();
    return session;
  }

  async requireAdmin(headers: Headers): Promise<SessionWithUser> {
    const session = await this.requireSession(headers);
    if (session.user.role !== "admin") throw DomainErrors.forbidden();
    return session;
  }
}
