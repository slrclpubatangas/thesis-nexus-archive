import { pgTable, text, serial, integer, boolean, timestamp, varchar, bigint, pgEnum, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["Admin", "Reader"]);
export const userStatusEnum = pgEnum("user_status", ["Active", "Inactive"]);
export const thesisStatusEnum = pgEnum("thesis_status", ["draft", "published", "archived"]);

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const thesisData = pgTable("thesis_data", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  barcode: varchar("barcode").notNull().unique(),
  thesisTitle: text("thesis_title").notNull(),
  authors: text("authors").array().notNull(),
  department: varchar("department").notNull(),
  publicationYear: integer("publication_year").notNull(),
  uploadDate: timestamp("upload_date", { withTimezone: true }).notNull().defaultNow(),
  lastModified: timestamp("last_modified", { withTimezone: true }).notNull().defaultNow(),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

export const systemUsers = pgTable("system_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull(),
  status: userStatusEnum("status").notNull().default("Active"),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const thesisSubmissions = pgTable("thesis_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  userType: text("user_type").notNull(),
  studentNumber: text("student_number"),
  school: text("school"),
  campus: text("campus").notNull(),
  program: text("program"),
  thesisTitle: text("thesis_title").notNull(),
  submissionDate: timestamp("submission_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertThesisDataSchema = createInsertSchema(thesisData).omit({
  id: true,
  uploadDate: true,
  lastModified: true,
  isDeleted: true,
});

export const insertSystemUserSchema = createInsertSchema(systemUsers).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertThesisSubmissionSchema = createInsertSchema(thesisSubmissions).omit({
  id: true,
  submissionDate: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertThesisData = z.infer<typeof insertThesisDataSchema>;
export type ThesisData = typeof thesisData.$inferSelect;

export type InsertSystemUser = z.infer<typeof insertSystemUserSchema>;
export type SystemUser = typeof systemUsers.$inferSelect;

export type InsertThesisSubmission = z.infer<typeof insertThesisSubmissionSchema>;
export type ThesisSubmission = typeof thesisSubmissions.$inferSelect;
