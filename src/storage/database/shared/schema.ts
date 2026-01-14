import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    username: varchar("username", { length: 100 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    email: varchar("email", { length: 255 }),
    role: varchar("role", { length: 20 })
      .notNull()
      .default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    usernameIdx: index("users_username_idx").on(table.username),
  })
);

// 使用 createSchemaFactory 配置 date coercion（处理前端 string → Date 转换）
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Zod schemas for validation
export const insertUserSchema = createCoercedInsertSchema(users).pick({
  username: true,
  passwordHash: true,
  email: true,
  role: true,
});

export const updateUserSchema = createCoercedInsertSchema(users)
  .pick({
    username: true,
    passwordHash: true,
    email: true,
    role: true,
  })
  .partial();

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
