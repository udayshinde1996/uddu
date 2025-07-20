import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  employeeId: text("employee_id").notNull().unique(),
  department: text("department").notNull(),
  location: text("location"),
  status: text("status").notNull().default("active"), // active, on-break, off-site, unavailable
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workCards = pgTable("work_cards", {
  id: serial("id").primaryKey(),
  cardId: text("card_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  assignedToId: integer("assigned_to_id").references(() => employees.id),
  location: text("location").notNull(),
  status: text("status").notNull().default("assigned"), // assigned, in-progress, completed, overdue, on-hold
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  deadline: timestamp("deadline"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  progressPercent: integer("progress_percent").default(0),
  hoursWorked: integer("hours_worked").default(0), // in minutes
  notes: text("notes"),
  materials: jsonb("materials"), // array of {name: string, quantity: number}
  photoUrls: jsonb("photo_urls"), // array of photo URLs
  qrCode: text("qr_code").notNull().unique(),
  // Manufacturing-specific fields
  shiftTime: text("shift_time"), // first-shift, general-shift, second-shift, night-shift
  machineSlots: jsonb("machine_slots").default([]), // array of {machineNumber: string, operationNumber: string, timeWorked: number}
  machineNumber: text("machine_number"),
  operationNumber: text("operation_number"),
  timeLossActivities: jsonb("time_loss_activities").default([]), // array of {activity: string, duration: number, issueType: string}
  defectivePartNumbers: jsonb("defective_part_numbers").default([]), // array of part numbers
  totalWorkHours: integer("total_work_hours").default(0), // actual hours worked in minutes
  // Overtime fields
  isOvertime: boolean("is_overtime").default(false),
  overtimeHours: integer("overtime_hours").default(0), // overtime hours in minutes
  overtimeShiftTime: text("overtime_shift_time"), // extended-day, extended-evening, overnight, weekend
  overtimeMachineSlots: jsonb("overtime_machine_slots").default([]), // array of {machineNumber: string, operationNumber: string, timeWorked: number}
  overtimeMachineNumber: text("overtime_machine_number"),
  overtimeOperationNumber: text("overtime_operation_number"),
  overtimeTimeLossActivities: jsonb("overtime_time_loss_activities").default([]), // array of {activity: string, duration: number, issueType: string}
  overtimeDefectivePartNumbers: jsonb("overtime_defective_part_numbers").default([]), // array of part numbers
  createdAt: timestamp("created_at").defaultNow(),
});

export const workSessions = pgTable("work_sessions", {
  id: serial("id").primaryKey(),
  workCardId: integer("work_card_id").references(() => workCards.id),
  employeeId: integer("employee_id").references(() => employees.id),
  action: text("action").notNull(), // started, updated, completed, paused
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  progressUpdate: integer("progress_update"),
  hoursWorked: integer("hours_worked"), // in minutes
  notes: text("notes"),
  materials: jsonb("materials"),
  photoUrls: jsonb("photo_urls"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // daily-summary, weekly-summary, employee-performance, etc.
  dateFrom: timestamp("date_from").notNull(),
  dateTo: timestamp("date_to").notNull(),
  filters: jsonb("filters"), // additional filter criteria
  status: text("status").notNull().default("generating"), // generating, ready, failed
  filePath: text("file_path"), // path to generated Excel file
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  lastSeen: true,
  createdAt: true,
});

export const insertWorkCardSchema = createInsertSchema(workCards).omit({
  id: true,
  qrCode: true,
  createdAt: true,
});

export const insertWorkSessionSchema = createInsertSchema(workSessions).omit({
  id: true,
  timestamp: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  status: true,
  filePath: true,
  generatedAt: true,
});

// Work completion form schema
export const workCompletionSchema = z.object({
  workCardId: z.number(),
  status: z.enum(["started", "in-progress", "completed", "on-hold", "requires-review"]),
  progressPercent: z.number().min(0).max(100),
  hoursWorked: z.number().min(0),
  notes: z.string().min(1, "Work notes are required"),
  materials: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().min(0),
  })).optional(),
  photoUrls: z.array(z.string()).optional(),
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type WorkCard = typeof workCards.$inferSelect;
export type InsertWorkCard = z.infer<typeof insertWorkCardSchema>;

export type WorkSession = typeof workSessions.$inferSelect;
export type InsertWorkSession = z.infer<typeof insertWorkSessionSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type WorkCompletion = z.infer<typeof workCompletionSchema>;
