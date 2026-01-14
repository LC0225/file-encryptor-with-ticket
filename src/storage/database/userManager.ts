import { eq, and, SQL, like, sql } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { users, insertUserSchema, updateUserSchema } from "./shared/schema";
import type { User, InsertUser, UpdateUser } from "./shared/schema";

export class UserManager {
  async createUser(data: InsertUser): Promise<User> {
    const db = await getDb();
    const validated = insertUserSchema.parse(data);
    const [user] = await db.insert(users).values(validated).returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async updateUser(id: string, data: UpdateUser): Promise<User | null> {
    const db = await getDb();
    const validated = updateUserSchema.parse(data);
    const [user] = await db
      .update(users)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUsers(options: { 
    skip?: number; 
    limit?: number; 
  } = {}): Promise<User[]> {
    const { skip = 0, limit = 100 } = options;
    const db = await getDb();

    return db.select().from(users).orderBy(users.createdAt).limit(limit).offset(skip);
  }
}

export const userManager = new UserManager();
