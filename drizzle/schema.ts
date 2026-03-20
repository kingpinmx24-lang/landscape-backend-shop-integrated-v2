import {
  integer,
  varchar,
  text,
  timestamp,
  jsonb,
  pgEnum,
  pgTable,
  decimal,
  index,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * ============================================================================
 * CORE TABLES
 * ============================================================================
 */

export const roleEnum = pgEnum("role", ["user", "admin"]);

/**
 * Users table - Core authentication and user management
 */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: roleEnum("role").default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    openIdIdx: index("users_openId_idx").on(table.openId),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projectStatusEnum = pgEnum("status", ["draft", "active", "completed", "archived"]);

/**
 * Projects table
 */
export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    terrain: jsonb("terrain").notNull(),
    status: projectStatusEnum("status").default("draft").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("projects_userId_idx").on(table.userId),
    userStatusIdx: index("projects_userId_status_idx").on(table.userId, table.status),
  })
);

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Plants table
 */
export const plants = pgTable(
  "plants",
  {
    id: serial("id").primaryKey(),
    projectId: integer("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    position: jsonb("position").notNull(),
    metadata: jsonb("metadata").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("plants_projectId_idx").on(table.projectId),
  })
);

export type Plant = typeof plants.$inferSelect;
export type InsertPlant = typeof plants.$inferInsert;

/**
 * Measurements table
 */
export const measurements = pgTable(
  "measurements",
  {
    id: serial("id").primaryKey(),
    projectId: integer("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    data: jsonb("data").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("measurements_projectId_idx").on(table.projectId),
  })
);

export type Measurement = typeof measurements.$inferSelect;
export type InsertMeasurement = typeof measurements.$inferInsert;

export const quotationStatusEnum = pgEnum("quotation_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "completed",
]);

/**
 * Quotations table
 */
export const quotations = pgTable(
  "quotations",
  {
    id: serial("id").primaryKey(),
    projectId: integer("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    totalCost: decimal("totalCost", { precision: 12, scale: 2 }).notNull(),
    items: jsonb("items").notNull(),
    status: quotationStatusEnum("status").default("draft").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("quotations_projectId_idx").on(table.projectId),
  })
);

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;

/**
 * RELATIONS
 */

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  plants: many(plants),
  measurements: many(measurements),
  quotations: many(quotations),
}));

export const plantsRelations = relations(plants, ({ one }) => ({
  project: one(projects, {
    fields: [plants.projectId],
    references: [projects.id],
  }),
}));

export const measurementsRelations = relations(measurements, ({ one }) => ({
  project: one(projects, {
    fields: [measurements.projectId],
    references: [projects.id],
  }),
}));

export const quotationsRelations = relations(quotations, ({ one }) => ({
  project: one(projects, {
    fields: [quotations.projectId],
    references: [projects.id],
  }),
}));
