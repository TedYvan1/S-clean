import { and, desc, eq, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { bookings, customers, InsertUser, services, users, vehicles } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  } else {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = values.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listActiveServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services).where(eq(services.active, true));
}

export async function listBookingsForDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(and(eq(bookings.date, date), ne(bookings.status, "cancelled")));
}

export async function getCustomerHistoryForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      bookingNumber: bookings.bookingNumber,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      address: bookings.address,
      neighborhood: bookings.neighborhood,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      serviceName: services.name,
      serviceDurationMinutes: services.durationMinutes,
      vehicleBrand: vehicles.brand,
      vehicleModel: vehicles.model,
      vehicleType: vehicles.type,
      vehicleColor: vehicles.color,
      vehicleLicensePlate: vehicles.licensePlate,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(eq(customers.userId, userId))
    .orderBy(desc(bookings.date), desc(bookings.startTime));
}

export async function getCustomerHistoryForEmail(email: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      bookingNumber: bookings.bookingNumber,
      date: bookings.date,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      address: bookings.address,
      neighborhood: bookings.neighborhood,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      serviceName: services.name,
      serviceDurationMinutes: services.durationMinutes,
      vehicleBrand: vehicles.brand,
      vehicleModel: vehicles.model,
      vehicleType: vehicles.type,
      vehicleColor: vehicles.color,
      vehicleLicensePlate: vehicles.licensePlate,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(eq(customers.email, email))
    .orderBy(desc(bookings.date), desc(bookings.startTime));
}

export async function findCustomerByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  return result[0];
}

export async function findVehicleByPlate(licensePlate: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(vehicles).where(eq(vehicles.licensePlate, licensePlate)).limit(1);
  return result[0];
}

export function hasTimeOverlap(
  candidateStart: number,
  candidateEnd: number,
  existingStart: number,
  existingEnd: number,
  travelBufferMinutes = 30,
) {
  return candidateStart < existingEnd + travelBufferMinutes && candidateEnd + travelBufferMinutes > existingStart;
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
