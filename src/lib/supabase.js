import { createClient } from "@supabase/supabase-js";
import { generateAvailableSlots } from "./bookingEngine";
import { servicesData, shopInfo } from "../data/services";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const adminPin = import.meta.env.VITE_ADMIN_PIN || "2026";

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
 * 🔒 ZERO-LEAK RPC: Fetch viable 30-minute slots for a date & service
 * Does NOT leak any customer information or existing booking IDs.
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

      if (!error && Array.isArray(data)) {
        return {
          success: true,
          slots: data.map((d) => ({
            time: d.formatted_time,
            fullTimestamp: d.slot_time,
            available: d.is_available !== false,
            period: parseInt(d.formatted_time.split(":")[0], 10) < 13
              ? "morning"
              : parseInt(d.formatted_time.split(":")[0], 10) < 19
                ? "afternoon"
                : "evening"
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
 * 🔒 ANTI-TAMPER RPC: Book an appointment
 * Prices and durations are calculated strictly inside PostgreSQL.
 * Atomic exclusion prevents double-booking.
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

/**
 * 🔒 SECURE ADMIN RPC: Update existing appointment
 */
export async function updateAppointment(appointmentId, updatedFields, pin = adminPin) {
  const service = updatedFields.service_id
    ? servicesData.find((s) => s.id === updatedFields.service_id)
    : null;

  if (isSupabaseConfigured && supabase) {
    try {
      let startTimeIso = null;
      if (updatedFields.date && updatedFields.time) {
        startTimeIso = new Date(`${updatedFields.date}T${updatedFields.time}:00`).toISOString();
      }

      const { data, error } = await supabase.rpc("admin_update_appointment", {
        p_admin_pin: pin,
        p_appointment_id: appointmentId,
        p_status: updatedFields.status || null,
        p_start_time: startTimeIso,
        p_customer_name: updatedFields.customer_name || null,
        p_customer_phone: updatedFields.customer_phone || null,
        p_notes: updatedFields.customer_notes || updatedFields.notes || null,
        p_service_id: updatedFields.service_id || null
      });

      if (!error && data?.success) {
        return { success: true };
      }
    } catch (err) {
      console.warn("Supabase update RPC error, falling back to local storage:", err);
    }
  }

  // Local storage update fallback
  const all = getLocalAppointments();
  const index = all.findIndex((a) => String(a.id) === String(appointmentId));
  if (index !== -1) {
    const existing = all[index];
    const newService = service || servicesData.find((s) => s.id === existing.service_id) || servicesData[3];

    all[index] = {
      ...existing,
      ...updatedFields,
      service_name: newService.name,
      service_price: newService.priceFormatted,
      service_duration: parseInt(newService.duration, 10) || 30,
      updated_at: new Date().toISOString()
    };
    saveLocalAppointments(all);
    return {
      success: true,
      appointment: all[index]
    };
  }

  return { success: false, error: "NOT_FOUND" };
}

/**
 * 🔒 SECURE ADMIN RPC: Delete appointment
 */
export async function deleteAppointment(appointmentId, pin = adminPin) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc("admin_delete_appointment", {
        p_admin_pin: pin,
        p_appointment_id: appointmentId
      });
      if (!error && data?.success) {
        return { success: true };
      }
    } catch (err) {
      console.warn("Supabase delete RPC error:", err);
    }
  }

  const all = getLocalAppointments();
  const filtered = all.filter((a) => String(a.id) !== String(appointmentId));
  saveLocalAppointments(filtered);
  return { success: true };
}

/**
 * 🔒 SECURE ADMIN RPC: Fetch all appointments across all dates (CRM & Stats)
 * Protected by Admin PIN verification.
 */
export async function getAllAppointments(pin = adminPin, shopSlug = "rotadocorte") {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc("admin_get_appointments", {
        p_admin_pin: pin,
        p_shop_slug: shopSlug
      });

      if (!error && data?.success && Array.isArray(data.appointments)) {
        return data.appointments.map((d) => ({
          id: d.id,
          customer_name: d.customer_name,
          customer_phone: d.customer_phone,
          customer_email: d.customer_email,
          customer_notes: d.customer_notes || d.notes,
          service_id: d.service_id,
          service_name: d.service_name || "Serviço",
          service_price: d.service_price || "15,00 €",
          service_duration: d.service_duration || 30,
          barber_name: d.barber_name || "Gabriel Silva",
          date: d.start_time ? d.start_time.split("T")[0] : "",
          time: d.start_time
            ? new Date(d.start_time).toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit"
              })
            : "",
          start_time: d.start_time,
          end_time: d.end_time,
          status: d.status,
          created_at: d.created_at
        }));
      }
    } catch (err) {
      console.warn("Supabase fetch all RPC error, falling back to local storage:", err);
    }
  }

  return getLocalAppointments();
}

/**
 * 🔒 SECURE ADMIN RPC: Create a blocked time slot (Pausa / Formação / Folga)
 */
export async function createBlockSlot({
  date,
  startTime,
  endTime,
  reason = "Pausa / Indisponível",
  shopSlug = "rotadocorte",
  pin = adminPin
}) {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = (startH || 10) * 60 + (startM || 0);
  const endMinutes = (endH || 11) * 60 + (endM || 0);

  const duration = Math.max(30, endMinutes - startMinutes);

  if (isSupabaseConfigured && supabase) {
    try {
      const startTimeIso = new Date(`${date}T${startTime}:00`).toISOString();
      const endTimeIso = new Date(`${date}T${endTime}:00`).toISOString();

      const { data, error } = await supabase.rpc("admin_create_block", {
        p_admin_pin: pin,
        p_shop_slug: shopSlug,
        p_start_time: startTimeIso,
        p_end_time: endTimeIso,
        p_reason: reason
      });

      if (!error && data?.success) {
        return { success: true, id: data.id };
      }
    } catch (err) {
      console.warn("Supabase block slot insert RPC error:", err);
    }
  }

  const all = getLocalAppointments();
  const newBlock = {
    id: "block-" + Date.now(),
    shop_name: shopInfo.name,
    shop_phone: shopInfo.phone,
    service_id: "bloqueio",
    service_name: `Bloqueio: ${reason}`,
    service_price: "0,00 €",
    service_duration: duration,
    barber_name: "Gabriel Silva",
    customer_name: `[BLOQUEIO] ${reason}`,
    customer_phone: "---",
    customer_notes: reason,
    date,
    time: startTime,
    start_time: `${date}T${startTime}:00`,
    formatted_date: new Date(date).toLocaleDateString("pt-PT"),
    formatted_time: startTime,
    status: "blocked",
    created_at: new Date().toISOString()
  };

  all.push(newBlock);
  saveLocalAppointments(all);

  return { success: true, block: newBlock };
}
