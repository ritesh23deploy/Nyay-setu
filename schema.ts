import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model from the existing schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Law Categories
export const lawCategories = pgTable("law_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameHindi: text("name_hindi").notNull(),
  icon: text("icon").notNull(),
  description: text("description"),
  descriptionHindi: text("description_hindi"),
});

export const insertLawCategorySchema = createInsertSchema(lawCategories).pick({
  name: true,
  nameHindi: true,
  icon: true,
  description: true,
  descriptionHindi: true,
});

// Acts (like IPC, CrPC, etc.)
export const acts = pgTable("acts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameHindi: text("name_hindi").notNull(),
  shortName: text("short_name").notNull(),
  categoryId: integer("category_id").references(() => lawCategories.id),
  description: text("description"),
  descriptionHindi: text("description_hindi"),
  year: text("year"),
});

export const insertActSchema = createInsertSchema(acts).pick({
  name: true,
  nameHindi: true,
  shortName: true,
  categoryId: true,
  description: true,
  descriptionHindi: true,
  year: true,
});

// Legal Sections
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  actId: integer("act_id").references(() => acts.id),
  number: text("number").notNull(),
  title: text("title").notNull(),
  titleHindi: text("title_hindi").notNull(),
  content: text("content").notNull(),
  contentHindi: text("content_hindi").notNull(),
  interpretations: json("interpretations").$type<string[]>(),
  interpretationsHindi: json("interpretations_hindi").$type<string[]>(),
  relatedSections: json("related_sections").$type<string[]>(),
  amendments: json("amendments").$type<string[]>(),
  caseReferences: json("case_references").$type<string[]>(),
});

export const insertSectionSchema = createInsertSchema(sections).pick({
  actId: true,
  number: true,
  title: true,
  titleHindi: true,
  content: true,
  contentHindi: true,
  interpretations: true,
  interpretationsHindi: true,
  relatedSections: true,
  amendments: true,
  caseReferences: true,
});

// Legal Updates
export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleHindi: text("title_hindi").notNull(),
  description: text("description").notNull(),
  descriptionHindi: text("description_hindi").notNull(),
  date: timestamp("date").notNull(),
  link: text("link"),
});

export const insertUpdateSchema = createInsertSchema(updates).pick({
  title: true,
  titleHindi: true,
  description: true,
  descriptionHindi: true,
  date: true,
  link: true,
});

// User History
export const history = pgTable("history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sectionId: integer("section_id").references(() => sections.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertHistorySchema = createInsertSchema(history).pick({
  userId: true,
  sectionId: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type LawCategory = typeof lawCategories.$inferSelect;
export type InsertLawCategory = z.infer<typeof insertLawCategorySchema>;

export type Act = typeof acts.$inferSelect;
export type InsertAct = z.infer<typeof insertActSchema>;

export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema>;

export type Update = typeof updates.$inferSelect;
export type InsertUpdate = z.infer<typeof insertUpdateSchema>;

export type History = typeof history.$inferSelect;
export type InsertHistory = z.infer<typeof insertHistorySchema>;

// Advocate Workbook schemas
export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  caseNumber: varchar("case_number", { length: 100 }),
  title: varchar("title", { length: 255 }).notNull(),
  titleHindi: varchar("title_hindi", { length: 255 }),
  court: varchar("court", { length: 100 }),
  clientName: varchar("client_name", { length: 100 }),
  clientPhone: varchar("client_phone", { length: 20 }),
  clientEmail: varchar("client_email", { length: 100 }),
  description: text("description"),
  descriptionHindi: text("description_hindi"),
  status: varchar("status", { length: 50 }).default("active"),
  nextHearingDate: date("next_hearing_date"),
  nextHearingTime: varchar("next_hearing_time", { length: 10 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reminderSet: boolean("reminder_set").default(false),
  reminderDate: timestamp("reminder_date"),
  reminderTime: varchar("reminder_time", { length: 10 }),
  reminderNote: text("reminder_note"),
  documents: text("documents").array(),
});

export const insertCaseSchema = createInsertSchema(cases).pick({
  userId: true,
  caseNumber: true,
  title: true,
  titleHindi: true,
  court: true,
  clientName: true,
  clientPhone: true,
  clientEmail: true,
  description: true,
  descriptionHindi: true,
  status: true,
  nextHearingDate: true,
  nextHearingTime: true,
  notes: true,
  reminderSet: true,
  reminderDate: true,
  reminderTime: true,
  reminderNote: true,
  documents: true,
});

export const caseHearings = pgTable("case_hearings", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => cases.id),
  date: date("date").notNull(),
  notes: text("notes"),
  outcome: text("outcome"),
  nextSteps: text("next_steps"),
  attendees: text("attendees"),
  evidencePresented: text("evidence_presented"),
  judgmentSummary: text("judgment_summary"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCaseHearingSchema = createInsertSchema(caseHearings).pick({
  caseId: true,
  date: true,
  notes: true,
  outcome: true,
  nextSteps: true,
  attendees: true,
  evidencePresented: true,
  judgmentSummary: true,
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type CaseHearing = typeof caseHearings.$inferSelect;
export type InsertCaseHearing = z.infer<typeof insertCaseHearingSchema>;
