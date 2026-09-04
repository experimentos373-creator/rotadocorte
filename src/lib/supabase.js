import { createClient } from "@supabase/supabase-js";
import { generateAvailableSlots } from "./bookingEngine";
import { servicesData, shopInfo } from "../data/services";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project.supabase.co"
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage Persistence Key for Local/Offline/Demo mode
const STORAGE_KEY_APPOINTMENTS = "rotadocorte_appointments_v1";

export function getLocalAppointments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAppointments(appointments) {
  try {
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
  } catch (err) {
    console.error("Error saving local appointments:", err);
  }
}

/**
 * Fetch viable 30-minute slots for a date & service
 */
export async function getAvailableSlots({
  shopSlug = "rotadocorte",
  date,
  serviceId
}) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_shop_slug: shopSlug,
        p_date: date,
        p_service_id: serviceId
      });

      if (!error && data) {
        return {
          success: true,
          slots: data.map((d) => ({
            time: d.formatted_time,
            fullTimestamp: d.slot_time
          }))
        };
      }
    } catch (err) {
      console.warn("Supabase RPC fallback to local engine:", err);
    }
  }

  // Fallback to local booking engine
  const localBookings = getLocalAppointments();
  const calculatedSlots = generateAvailableSlots({
    date,
    serviceId,
    existingBookings: localBookings,
    slotIntervalMinutes: 30
  });

  return {
    success: true,
    slots: calculatedSlots
  };
}

/**
 * Book an appointment (Single Barber, Atomic protection)
 */
export async function createBooking({
  shopSlug = "rotadocorte",
  serviceId,
  date,
  time,
  customerName,
  customerPhone,
  customerEmail = "",
  customerNotes = ""
}) {
  const service = servicesData.find((s) => s.id === serviceId) || servicesData[3];
  const duration = parseInt(service?.duration, 10) || 30;

  if (isSupabaseConfigured && supabase) {
    try {
      const startTimeIso = new Date(`${date}T${time}:00`).toISOString();
      const { data, error } = await supabase.rpc("book_appointment", {
        p_shop_slug: shopSlug,
        p_service_id: serviceId,
        p_start_time: startTimeIso,
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_customer_email: customerEmail || null,
        p_notes: customerNotes || null
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data && !data.success) {
        return { success: false, error: data.error, message: data.message };
      }

      return {
        success: true,
        appointment: data.appointment
      };
    } catch (err) {
      console.warn("Supabase booking error, falling back to local storage:", err);
    }
  }

  // Local storage simulation with conflict check
  const localBookings = getLocalAppointments();
  const hasConflict = localBookings.some(
    (b) => b.date === date && b.time === time && b.status !== "cancelled"
  );

  if (hasConflict) {
    return {
      success: false,
      error: "SLOT_ALREADY_TAKEN",
      message: "Este horário acabou de ser reservado. Por favor escolha outro horário."
    };
  }

  const newAppointment = {
    id: "local-" + Date.now(),
    shop_name: shopInfo.name,
    shop_phone: shopInfo.phone,
    service_id: serviceId,
    service_name: service.name,
    service_price: service.priceFormatted || `${service.price} €`,
    service_duration: duration,
    barber_name: "Gabriel Silva",
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    customer_notes: customerNotes,
    date,
    time,
    start_time: `${date}T${time}:00`,
    formatted_date: new Date(date).toLocaleDateString("pt-PT"),
    formatted_time: time,
    status: "confirmed",
    created_at: new Date().toISOString()
  };

  localBookings.push(newAppointment);
  saveLocalAppointments(localBookings);

  return {
    success: true,
    appointment: newAppointment
  };
}
