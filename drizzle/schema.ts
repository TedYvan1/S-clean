import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "staff"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  firstName: varchar("firstName", { length: 80 }).notNull(),
  lastName: varchar("lastName", { length: 80 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  brand: varchar("brand", { length: 60 }).notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  type: varchar("type", { length: 40 }).notNull(),
  color: varchar("color", { length: 40 }).notNull(),
  licensePlate: varchar("licensePlate", { length: 30 }).notNull(),
  notes: text("notes"),
});

export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  price: int("price").notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  badge: varchar("badge", { length: 40 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const serviceOptions = mysqlTable("serviceOptions", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  price: int("price").notNull(),
  durationMinutes: int("durationMinutes").default(0).notNull(),
});

export const bookings = mysqlTable(
  "bookings",
  {
    id: int("id").autoincrement().primaryKey(),
    bookingNumber: varchar("bookingNumber", { length: 32 }).notNull().unique(),
    customerId: int("customerId").notNull(),
    vehicleId: int("vehicleId").notNull(),
    serviceId: int("serviceId").notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    startTime: varchar("startTime", { length: 5 }).notNull(),
    endTime: varchar("endTime", { length: 5 }).notNull(),
    address: text("address").notNull(),
    neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
    landmark: varchar("landmark", { length: 160 }),
    travelFee: int("travelFee").default(0).notNull(),
    totalPrice: int("totalPrice").notNull(),
    status: mysqlEnum("status", ["draft", "pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).default("pending").notNull(),
    paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "partial", "paid"]).default("unpaid").notNull(),
    paymentMethod: varchar("paymentMethod", { length: 40 }),
    amountPaid: int("amountPaid").default(0).notNull(),
    remainingAmount: int("remainingAmount").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    dateStartIdx: uniqueIndex("booking_date_start_unique").on(table.date, table.startTime),
  }),
);

export const availability = mysqlTable("availability", {
  id: int("id").autoincrement().primaryKey(),
  dayOfWeek: int("dayOfWeek").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  breakStart: varchar("breakStart", { length: 5 }),
  breakEnd: varchar("breakEnd", { length: 5 }),
  active: boolean("active").default(true).notNull(),
});

export const blockedSlots = mysqlTable("blockedSlots", {
  id: int("id").autoincrement().primaryKey(),
  startDatetime: timestamp("startDatetime").notNull(),
  endDatetime: timestamp("endDatetime").notNull(),
  reason: varchar("reason", { length: 80 }).notNull(),
  note: text("note"),
});

export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  active: boolean("active").default(true).notNull(),
});

export const teamAssignments = mysqlTable("teamAssignments", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  teamId: int("teamId").notNull(),
});

export const zones = mysqlTable("zones", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  travelFee: int("travelFee").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  type: varchar("type", { length: 60 }).notNull(),
  channel: mysqlEnum("channel", ["email", "whatsapp", "sms"]).notNull(),
  status: mysqlEnum("status", ["queued", "sent", "failed"]).default("queued").notNull(),
  sentAt: timestamp("sentAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
