/**
 * Drizzle schema for SOA Platform
 * Note: Uses text IDs for Better Auth compatibility
 */
import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  integer,
  jsonb,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

// Helper to generate cuid2 IDs
const generateId = () => createId()

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "paraplanner",
  "financial_planner",
])

export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "in_progress",
  "review",
  "completed",
])

export const changeTypeEnum = pgEnum("change_type", [
  "generation",
  "edit",
  "approval",
])

export const commentStatusEnum = pgEnum("comment_status", ["open", "resolved"])

export const sectionStatusEnum = pgEnum("section_status", [
  "pending",
  "generated",
  "reviewed",
  "approved",
])

// Users table (Better Auth compatible - uses text IDs)
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    name: text("name").notNull(),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("paraplanner"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
)

// Sessions table (for Better Auth)
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Accounts table (for Better Auth - stores password hash)
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Verifications table (for Better Auth - email verification, password reset)
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey().$defaultFn(generateId),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Projects table
export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(generateId),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Documents table
export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(generateId),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  parsedContent: text("parsed_content"),
  fileType: text("file_type").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
})

// Workflow state table
export const workflowState = pgTable(
  "workflow_state",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    currentStep: integer("current_step").notNull().default(1),
    stepStatuses: jsonb("step_statuses")
      .notNull()
      .$type<{
        step1: "pending" | "in_progress" | "completed" | "failed"
        step2: "pending" | "in_progress" | "completed" | "failed"
        step3: "pending" | "in_progress" | "completed" | "failed"
        step4: "pending" | "in_progress" | "completed" | "failed" | "awaiting_approval"
        step5: "pending" | "in_progress" | "completed" | "failed" | "awaiting_approval"
        step6: "pending" | "in_progress" | "completed" | "failed"
      }>()
      .default({
        step1: "pending",
        step2: "pending",
        step3: "pending",
        step4: "pending",
        step5: "pending",
        step6: "pending",
      }),
    workflowRunId: text("workflow_run_id"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("workflow_state_project_idx").on(table.projectId)]
)

// SOA Sections table
export const soaSections = pgTable("soa_sections", {
  id: text("id").primaryKey().$defaultFn(generateId),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  sectionId: text("section_id").notNull(), // e.g., "M1", "M3_S1", "M3_S7_SS1"
  parentSectionId: text("parent_section_id"), // e.g., "M3" for "M3_S1"
  title: text("title").notNull(),
  contentType: text("content_type").notNull(), // "paragraph", "table", "mixed"
  content: jsonb("content")
    .notNull()
    .$type<{
      text?: string
      tables?: Array<{
        headers: string[]
        rows: string[][]
      }>
      bullets?: string[]
    }>()
    .default({}),
  sources: jsonb("sources")
    .notNull()
    .$type<
      Array<{
        documentId: string
        documentName: string
        excerpt: string
        location?: string
      }>
    >()
    .default([]),
  requiredFields: jsonb("required_fields")
    .notNull()
    .$type<string[]>()
    .default([]),
  status: sectionStatusEnum("status").notNull().default("pending"),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// SOA Versions table (for JSON Patch version control)
export const soaVersions = pgTable("soa_versions", {
  id: text("id").primaryKey().$defaultFn(generateId),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  patch: jsonb("patch").notNull(), // RFC 6902 JSON Patch
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  changeType: changeTypeEnum("change_type").notNull(),
  changeSummary: text("change_summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Comments table
export const comments = pgTable("comments", {
  id: text("id").primaryKey().$defaultFn(generateId),
  sectionId: text("section_id")
    .notNull()
    .references(() => soaSections.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  status: commentStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Type exports for use in application code
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type WorkflowState = typeof workflowState.$inferSelect
export type NewWorkflowState = typeof workflowState.$inferInsert
export type SoaSection = typeof soaSections.$inferSelect
export type NewSoaSection = typeof soaSections.$inferInsert
export type SoaVersion = typeof soaVersions.$inferSelect
export type NewSoaVersion = typeof soaVersions.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
