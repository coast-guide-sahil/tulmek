import { count, eq } from "drizzle-orm";
import type { UserRepository } from "@tulmek/core/ports";
import type { UserId, Email, User } from "@tulmek/core/domain";
import { db } from "./client";
import * as schema from "./schema";

export class DrizzleUserRepository implements UserRepository {
  async findById(id: UserId): Promise<User | null> {
    const rows = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, id))
      .limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const rows = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async count(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(schema.user);
    return result?.value ?? 0;
  }

  private toDomain(row: typeof schema.user.$inferSelect): User {
    return {
      id: row.id as UserId,
      name: row.name,
      email: row.email as Email,
      emailVerified: row.emailVerified,
      image: row.image,
      role: (row.role ?? "user") as User["role"],
      banned: row.banned ?? false,
      banReason: row.banReason,
      banExpires: row.banExpires,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
