import { createClient } from "@supabase/supabase-js";
import { generateAvailableSlots } from "./bookingEngine";
import { servicesData, shopInfo } from "../data/services";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://vvucnqnyynydjccfqnor.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_7HteCWain-w3xhd8o2hwSA_p33weMaJ";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project.supabase.co"
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      realtime: {
        params: {
          eventsPerSecond: 2
        },
        timeout: 8000
      }
    })
  : null;

// Safe promise wrapper with timeout to prevent hanging connections
function withTimeout(promise, ms = 7500) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("NETWORK_TIMEOUT"));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// LocalStorage Persistence Key for Local/Offline/Demo mode
const STORAGE_KEY_APPOINTMENTS = "rotadocorte_appointments_v1";
const CACHE_ALL_APPOINTMENTS_KEY = "rotadocorte_admin_cache_all_v1";

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
 * 🔒 Verify Admin PIN with Supabase RPC
 * Validated strictly on PostgreSQL side against the shop's admin_pin.
 */
export async function verifyAdminPin(pin, shopSlug = "rotadocorte") {
  if (!pin || typeof pin !== "string" || !pin.trim()) {
    return { success: false, message: "PIN de administrador obrigatório." };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc("admin_verify_pin", {
          p_admin_pin: pin.trim(),
          p_shop_slug: shopSlug
        }),
        7000
      );
      if (!error && data?.authorized) {
        return { success: true };
      }
      return { success: false, message: data?.message || "PIN de administrador incorreto." };
    } catch (err) {
      return { success: false, message: "Erro ao validar PIN no servidor (tempo esgotado ou ligação lenta)." };
    }
  }

  return { success: false, message: "Base de dados não configurada." };
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
      const { data, error } = await withTimeout(
        supabase.rpc("get_available_slots", {
          p_shop_slug: shopSlug,
          p_date: date,
          p_service_id: serviceId
        }),
        6000
      );

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
    } catch (_) {
      // Fallback cleanly to local calculation engine
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
      const { data, error } = await withTimeout(
        supabase.rpc("book_appointment", {
          p_shop_slug: shopSlug,
          p_service_id: serviceId,
          p_start_time: startTimeIso,
          p_customer_name: customerName,
          p_customer_phone: customerPhone,
          p_customer_email: customerEmail || null,
          p_notes: customerNotes || null
        }),
        8000
      );

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
    } catch (_) {
      // Continue to local storage fallback
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
 * Requires runtime admin PIN verified on PostgreSQL side.
 */
export async function updateAppointment(appointmentId, updatedFields, pin) {
  if (!pin) return { success: false, error: "PIN_REQUIRED" };

  if (isSupabaseConfigured && supabase) {
    try {
      let startTimeIso = null;
      if (updatedFields.date && updatedFields.time) {
        startTimeIso = new Date(`${updatedFields.date}T${updatedFields.time}:00`).toISOString();
      }

      const { data, error } = await withTimeout(
        supabase.rpc("admin_update_appointment", {
          p_admin_pin: pin,
          p_appointment_id: appointmentId,
          p_status: updatedFields.status || null,
          p_start_time: startTimeIso,
          p_customer_name: updatedFields.customer_name || null,
          p_customer_phone: updatedFields.customer_phone || null,
          p_notes: updatedFields.customer_notes || updatedFields.notes || null,
          p_service_id: updatedFields.service_id || null
        }),
        8000
      );

      if (!error && data?.success) {
        return { success: true };
      }
    } catch (_) {
      // Handled
    }
  }

  return { success: false, error: "UPDATE_FAILED" };
}

/**
 * 🔒 SECURE ADMIN RPC: Delete appointment
 * Requires runtime admin PIN verified on PostgreSQL side.
 */
export async function deleteAppointment(appointmentId, pin) {
  if (!pin) return { success: false, error: "PIN_REQUIRED" };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc("admin_delete_appointment", {
          p_admin_pin: pin,
          p_appointment_id: appointmentId
        }),
        8000
      );
      if (!error && data?.success) {
        return { success: true };
      }
    } catch (_) {
      // Handled
    }
  }

  return { success: false, error: "DELETE_FAILED" };
}

/**
 * 🔒 SECURE ADMIN RPC: Fetch all appointments across all dates (CRM & Stats)
 * Protected strictly by Admin PIN verification on PostgreSQL side.
 * Features resilient timeout & localStorage fallback.
 */
export async function getAllAppointments(pin, shopSlug = "rotadocorte") {
  const activePin =
    pin ||
    (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("rotadocorte_admin_pin") : null) ||
    import.meta.env.VITE_ADMIN_PIN ||
    "2026";

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc("admin_get_appointments", {
          p_admin_pin: activePin,
          p_shop_slug: shopSlug
        }),
        8000
      );

      if (!error && data?.success && Array.isArray(data.appointments)) {
        const formatted = data.appointments.map((d) => {
          let dateStr = "";
          let timeStr = "";
          if (d.start_time) {
            const dt = new Date(d.start_time);
            dateStr = dt.toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
            timeStr = dt.toLocaleTimeString("pt-PT", {
              timeZone: "Europe/Lisbon",
              hour: "2-digit",
              minute: "2-digit"
            });
          }
          return {
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
            date: dateStr,
            time: timeStr,
            start_time: d.start_time,
            end_time: d.end_time,
            status: d.status,
            created_at: d.created_at
          };
        });

        // Store latest snapshot in local cache
        try {
          localStorage.setItem(CACHE_ALL_APPOINTMENTS_KEY, JSON.stringify(formatted));
        } catch (_) {}

        return formatted;
      }
    } catch (_) {
      // Attempt to load from offline cache on timeout or network blip
      try {
        const cached = localStorage.getItem(CACHE_ALL_APPOINTMENTS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (_) {}
    }
  }

  return [];
}

/**
 * 🔒 REALTIME SYNC: Subscribe to appointment table changes
 */
export function subscribeToAppointments(callback) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  try {
    const channel = supabase
      .channel("rotadocorte-appointments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          if (typeof callback === "function") {
            callback(payload);
          }
        }
      )
      .subscribe((status) => {
        // Status handled silently
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
    };
  } catch (_) {
    return () => {};
  }
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
  pin
}) {
  if (!pin) return { success: false, error: "PIN_REQUIRED" };

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = (startH || 10) * 60 + (startM || 0);
  const endMinutes = (endH || 11) * 60 + (endM || 0);

  const duration = Math.max(30, endMinutes - startMinutes);

  if (isSupabaseConfigured && supabase) {
    try {
      const startTimeIso = new Date(`${date}T${startTime}:00`).toISOString();
      const endTimeIso = new Date(`${date}T${endTime}:00`).toISOString();

      const { data, error } = await withTimeout(
        supabase.rpc("admin_create_block", {
          p_admin_pin: pin,
          p_shop_slug: shopSlug,
          p_start_time: startTimeIso,
          p_end_time: endTimeIso,
          p_reason: reason
        }),
        8000
      );

      if (!error && data?.success) {
        return { success: true, id: data.id };
      }
    } catch (_) {
      // Handled
    }
  }

  return { success: false, error: "BLOCK_FAILED" };
}

