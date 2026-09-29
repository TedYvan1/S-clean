import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./supabase";

type BookingInput = {
  serviceId: number; date: string; startTime: string; customerName: string;
  phone: string; vehicle: string; address: string; neighborhood: string; landmark?: string;
};
type SupabaseBookingRow = Record<string, any>;

type FallbackService = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  duration_minutes: number;
  active: boolean;
};

type LocalBookingRow = {
  booking_number: string;
  user_id: string | null;
  email: string | null;
  customer_name: string;
  phone: string;
  vehicle: string;
  service_id: number;
  service_name: string;
  date: string;
  start_time: string;
  end_time: string;
  address: string;
  neighborhood: string;
  landmark: string | null;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
};

const fallbackServices: FallbackService[] = [
  { id: 1, name: "Essentiel", slug: "essentiel", description: "L’entretien régulier, simple et soigné.", price: 12000, duration_minutes: 45, active: true },
  { id: 2, name: "Premium", slug: "premium", description: "Le soin complet, dedans comme dehors.", price: 22000, duration_minutes: 90, active: true },
  { id: 3, name: "Éco Premium", slug: "eco-premium", description: "Une finition profonde, avec moins d’eau.", price: 28000, duration_minutes: 120, active: true },
];

const localBookings = new Map<string, LocalBookingRow>();

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const clamped = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function hasOverlap(startA: string, endA: string, startB: string, endB: string, paddingMinutes = 0) {
  const startMinutesA = timeToMinutes(startA);
  const endMinutesA = timeToMinutes(endA);
  const startMinutesB = timeToMinutes(startB);
  const endMinutesB = timeToMinutes(endB);
  return startMinutesA < endMinutesB + paddingMinutes && endMinutesA + paddingMinutes > startMinutesB;
}

function getFallbackBookingByDate(date: string) {
  return Array.from(localBookings.values()).filter((row) => row.date === date && row.status !== "cancelled");
}

function getFallbackBookingByUser(userId: string) {
  return Array.from(localBookings.values()).filter((row) => row.user_id === userId);
}

export async function getSupabaseProfileRole(userId: string) {
  const client = getSupabaseAdminClient();
  if (!client) return null;
  const { data, error } = await client.from("sclean_profiles").select("role").eq("id", userId).maybeSingle();
  if (error) { console.warn("[Supabase] Role lookup failed:", error.message); return null; }
  return data?.role === "admin" || data?.role === "staff" ? data.role : null;
}

export async function syncSupabaseProfile(user: SupabaseUser) {
  const client = getSupabaseAdminClient();
  if (!client) return false;
  const { error } = await client.from("sclean_profiles").upsert({ id: user.id, email: user.email ?? null, phone: user.phone ?? user.user_metadata?.phone ?? null, full_name: user.user_metadata?.full_name ?? null, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) { console.warn("[Supabase] Profile sync failed:", error.message); return false; }
  return true;
}

export async function listSupabaseServices() {
  const client = getSupabaseAdminClient();
  if (!client) return fallbackServices.map((row) => ({ ...row, durationMinutes: row.duration_minutes }));
  const { data, error } = await client.from("sclean_services").select("id,name,slug,description,price,duration_minutes,active").eq("active", true).order("id");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, durationMinutes: row.duration_minutes }));
}

export async function listSupabaseBookingsForDate(date: string) {
  const client = getSupabaseAdminClient();
  if (!client) return getFallbackBookingByDate(date).map((row) => ({ startTime: row.start_time, endTime: row.end_time }));
  const { data, error } = await client.from("sclean_bookings").select("start_time,end_time,status").eq("date", date).not("status", "eq", "cancelled");
  if (error) { console.warn("[Supabase] Availability failed:", error.message); return null; }
  return (data ?? []).map((row) => ({ startTime: row.start_time, endTime: row.end_time }));
}

function mapHistory(row: SupabaseBookingRow) {
  const [vehicleBrand = "Véhicule", ...vehicleModelParts] = String(row.vehicle ?? "").split(" ");
  return { bookingNumber: row.booking_number, date: row.date, startTime: row.start_time, endTime: row.end_time, address: row.address, neighborhood: row.neighborhood, totalPrice: row.total_price, status: row.status, paymentStatus: row.payment_status, serviceName: row.service_name, serviceDurationMinutes: row.duration_minutes ?? null, vehicleBrand, vehicleModel: vehicleModelParts.join(" ") || null, vehicleType: null, vehicleColor: null, vehicleLicensePlate: null };
}

export async function listSupabaseHistory(userId: string) {
  const client = getSupabaseAdminClient();
  if (!client) return getFallbackBookingByUser(userId).map((row) => ({ ...mapHistory(row), vehicleBrand: row.vehicle.split(" ")[0] ?? "Véhicule", vehicleModel: row.vehicle.split(" ").slice(1).join(" ") || null }));
  const { data, error } = await client.from("sclean_bookings").select("booking_number,date,start_time,end_time,address,neighborhood,total_price,status,payment_status,service_name,vehicle").eq("user_id", userId).order("date", { ascending: false }).order("start_time", { ascending: false });
  if (error) { console.warn("[Supabase] History failed:", error.message); return null; }
  return (data ?? []).map(mapHistory);
}

export async function createSupabaseBooking(user: SupabaseUser | null, bookingNumber: string, input: BookingInput) {
  const client = getSupabaseAdminClient();
  if (!client) {
    const service = fallbackServices.find((item) => item.id === input.serviceId) ?? fallbackServices[1];
    const startMinutes = timeToMinutes(input.startTime);
    const endMinutes = startMinutes + service.duration_minutes;
    const endTime = minutesToTime(endMinutes);
    const existing = getFallbackBookingByDate(input.date);
    const slotTaken = existing.some((row) => hasOverlap(input.startTime, endTime, row.start_time, row.end_time, 30));
    if (slotTaken) throw new Error("SLOT_UNAVAILABLE");
    const row: LocalBookingRow = {
      booking_number: bookingNumber,
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      customer_name: input.customerName,
      phone: input.phone,
      vehicle: input.vehicle,
      service_id: input.serviceId,
      service_name: service.name,
      date: input.date,
      start_time: input.startTime,
      end_time: endTime,
      address: input.address,
      neighborhood: input.neighborhood,
      landmark: input.landmark ?? null,
      total_price: service.price,
      status: "confirmed",
      payment_status: "unpaid",
      created_at: new Date().toISOString(),
    };
    localBookings.set(bookingNumber, row);
    return row;
  }
  const { data, error } = await client.rpc("create_sclean_booking", { p_booking_number: bookingNumber, p_user_id: user?.id ?? null, p_email: user?.email ?? null, p_customer_name: input.customerName, p_phone: input.phone, p_vehicle: input.vehicle, p_service_id: input.serviceId, p_date: input.date, p_start_time: input.startTime, p_address: input.address, p_neighborhood: input.neighborhood, p_landmark: input.landmark ?? null }).single();
  if (error) throw new Error(error.message);
  return data as SupabaseBookingRow;
}

export async function listAdminBookings() {
  const client = getSupabaseAdminClient();
  if (!client) return Array.from(localBookings.values()).map((row) => ({ ...row, bookingNumber: row.booking_number }));
  const { data, error } = await client.from("sclean_bookings").select("booking_number,date,start_time,end_time,customer_name,phone,vehicle,service_name,neighborhood,total_price,status,payment_status,created_at").order("date", { ascending: true }).order("start_time", { ascending: true }).limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateSupabaseBookingStatus(bookingNumber: string, status: string) {
  const client = getSupabaseAdminClient();
  if (!client) {
    const row = localBookings.get(bookingNumber);
    if (!row) throw new Error("Booking not found");
    row.status = status;
    localBookings.set(bookingNumber, row);
    return row;
  }
  const { data, error } = await client.from("sclean_bookings").update({ status }).eq("booking_number", bookingNumber).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listAdminServices() {
  const client = getSupabaseAdminClient();
  if (!client) return fallbackServices.map((row) => ({ ...row, durationMinutes: row.duration_minutes }));
  const { data, error } = await client.from("sclean_services").select("id,name,slug,description,price,duration_minutes,active").order("id");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, durationMinutes: row.duration_minutes }));
}
