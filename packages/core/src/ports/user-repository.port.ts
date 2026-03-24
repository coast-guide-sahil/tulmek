import type { UserId, Email } from "../domain/brand";
import type { User } from "../domain/user";

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  count(): Promise<number>;
}
