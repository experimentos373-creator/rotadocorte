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

/**
 * Update existing appointment (Supabase + LocalStorage)
 */
export async function updateAppointment(appointmentId, updatedFields) {
  const service = updatedFields.service_id
    ? servicesData.find((s) => s.id === updatedFields.service_id)
    : null;

  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        updated_at: new Date().toISOString()
      };
      if (updatedFields.customer_name !== undefined) payload.customer_name = updatedFields.customer_name;
      if (updatedFields.customer_phone !== undefined) payload.customer_phone = updatedFields.customer_phone;
      if (updatedFields.customer_email !== undefined) payload.customer_email = updatedFields.customer_email;
      if (updatedFields.customer_notes !== undefined) payload.notes = updatedFields.customer_notes;
      if (updatedFields.status !== undefined) payload.status = updatedFields.status;
      if (updatedFields.date && updatedFields.time) {
        payload.start_time = `${updatedFields.date}T${updatedFields.time}:00`;
      }
      if (updatedFields.service_id) {
        payload.service_id = updatedFields.service_id;
      }

      const { data, error } = await supabase
        .from("appointments")
        .update(payload)
        .eq("id", appointmentId)
        .select("*, services(*)")
        .single();

      if (!error && data) {
        return {
          success: true,
          appointment: data
        };
      }
    } catch (err) {
      console.warn("Supabase update error, falling back to local storage:", err);
    }
  }

  // Local storage update
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
 * Delete appointment (Supabase + LocalStorage)
 */
export async function deleteAppointment(appointmentId) {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("appointments").delete().eq("id", appointmentId);
    } catch (err) {
      console.warn("Supabase delete error:", err);
    }
  }

  const all = getLocalAppointments();
  const filtered = all.filter((a) => String(a.id) !== String(appointmentId));
  saveLocalAppointments(filtered);
  return { success: true };
}

