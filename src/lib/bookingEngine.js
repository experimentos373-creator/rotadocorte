/**
 * Booking Engine & Calendar Utilities (Single Barber & 30-Minute Interval System)
 */

import { servicesData, shopInfo } from "../data/services.js";

/**
 * Generates viable time slots starting strictly at 30-minute intervals (10:00, 10:30, etc.)
 * Returns all regular shift slots with an explicit 'available' flag so booked slots remain visible as occupied/disabled.
 */
export function generateAvailableSlots({
  date,
  serviceId,
  existingBookings = [],
  slotIntervalMinutes = 30,
  minNoticeHours = 1
}) {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday

  // Sunday: Closed
  if (dayOfWeek === 0) {
    return [];
  }

  // Working shifts by day of the week:
  // - Segunda-feira (1): 13:00 - 22:00 (sem pausa de almoço matinal)
  // - Terça a Sexta (2..5): 10:00 - 22:00 (almoço: 13:00 - 14:00)
  // - Sábado (6): 10:00 - 18:00 (almoço: 13:00 - 14:00)
  let shiftStartMinutes = 10 * 60;
  let shiftEndMinutes = 22 * 60;
  let hasLunchBreak = true;

  if (dayOfWeek === 1) {
    // Segunda-feira: 13:00 às 22:00
    shiftStartMinutes = 13 * 60;
    shiftEndMinutes = 22 * 60;
    hasLunchBreak = false;
  } else if (dayOfWeek === 6) {
    // Sábado: 10:00 às 18:00
    shiftStartMinutes = 10 * 60;
    shiftEndMinutes = 18 * 60;
    hasLunchBreak = true;
  }

  // Lunch break: 13:00 - 14:00 (13:00 and 13:30 are closed for lunch when active)
  const lunchStartMinutes = 13 * 60;
  const lunchEndMinutes = 14 * 60;

  const now = new Date();
  const isToday =
    targetDate.getFullYear() === now.getFullYear() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getDate() === now.getDate();

  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes() + minNoticeHours * 60;

  const slots = [];

  for (
    let slotStart = shiftStartMinutes;
    slotStart < shiftEndMinutes;
    slotStart += slotIntervalMinutes // Strictly 30-minute increments
  ) {
    const timeString = minutesToTimeString(slotStart);
    const h = Math.floor(slotStart / 60);
    const period = h < 13 ? "morning" : h < 19 ? "afternoon" : "evening";

    // Skip lunch hours (13:00 and 13:30) if applicable
    if (hasLunchBreak && slotStart >= lunchStartMinutes && slotStart < lunchEndMinutes) {
      continue;
    }

    // Check past times if today
    if (isToday && slotStart < currentMinutesFromMidnight) {
      slots.push({
        time: timeString,
        minutes: slotStart,
        period,
        available: false,
        reason: "past"
      });
      continue;
    }

    // Check conflict: exactly 1 booking = 1 slot occupied (strictly the exact time of that booking)
    const hasConflict = existingBookings.some((b) => {
      if (b.date !== date || b.status === "cancelled") return false;
      return b.time === timeString;
    });

    if (hasConflict) {
      // Slot remains VISIBLE in the grid, but marked as occupied/disabled!
      slots.push({
        time: timeString,
        minutes: slotStart,
        period,
        available: false,
        reason: "occupied"
      });
    } else {
      slots.push({
        time: timeString,
        minutes: slotStart,
        period,
        available: true
      });
    }
  }

  return slots;
}

export function minutesToTimeString(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function timeStringToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Builds standard pre-filled WhatsApp confirmation message
 */
export function buildWhatsAppMessage({
  serviceName,
  servicePrice,
  dateFormatted,
  time,
  clientName,
  phone,
  notes
}) {
  let msg = `Olá *Gabriel*! Fiz a minha marcação através do website da *Rota Do Corte* (Paião).\n\n`;
  msg += `*RESUMO DO AGENDAMENTO:*\n`;
  msg += `• *Serviço:* ${serviceName} (${servicePrice})\n`;
  msg += `• *Data:* ${dateFormatted}\n`;
  msg += `• *Hora:* ${time}\n`;
  msg += `• *Nome:* ${clientName}\n`;
  if (phone) msg += `• *Contacto:* ${phone}\n`;
  if (notes) msg += `• *Obs:* ${notes}\n`;
  msg += `\n• *Localização:* ${shopInfo.addressShort}\n`;
  msg += `\n_Confirmação imediata via Rota Do Corte OS._`;

  return encodeURIComponent(msg);
}

/**
 * Builds Google Calendar Link
 */
export function buildGoogleCalendarUrl({
  serviceName,
  date,
  time,
  durationMinutes = 30
}) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const formatGCalDate = (d) =>
    d.toISOString().replace(/-|:|\.\d+/g, "");

  const title = encodeURIComponent(`Rota do Corte - ${serviceName}`);
  const details = encodeURIComponent(
    `Marcação na Rota do Corte\nServiço: ${serviceName}\nContacto: ${shopInfo.phone}\nBarbeiro: Gabriel Silva`
  );
  const location = encodeURIComponent(shopInfo.address);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGCalDate(
    start
  )}/${formatGCalDate(end)}&details=${details}&location=${location}`;
}

/**
 * Generates and downloads an .ics Calendar File (compatible with iPhone Apple Calendar & Outlook)
 */
export function downloadIcsFile({
  serviceName,
  date,
  time,
  durationMinutes = 30,
  clientName
}) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const formatIcsDate = (d) =>
    d.toISOString().replace(/-|:|\.\d+/g, "").slice(0, 15) + "Z";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//P&D Agency//Rota do Corte Booking//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `SUMMARY:Rota do Corte - ${serviceName}`,
    `DESCRIPTION:Marcação para ${clientName || "Cliente"} - ${serviceName}. Contacto: ${shopInfo.phone}`,
    `LOCATION:${shopInfo.address}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `STATUS:CONFIRMED`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `rotadocorte-${date}-${time.replace(":", "")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sends an automated real-time WhatsApp alert to Admin(s) whenever a new booking is created
 */
export async function sendAdminWhatsAppNotification({
  serviceName,
  servicePrice,
  dateFormatted,
  time,
  clientName,
  phone,
  notes
}) {
  const env =
    typeof import.meta !== "undefined" && import.meta?.env
      ? import.meta.env
      : {};

  const greenApiUrl =
    env.VITE_GREEN_API_URL || "https://7107.api.greenapi.com";
  const greenApiId =
    env.VITE_GREEN_API_ID_INSTANCE || "710722740665";
  const greenApiToken =
    env.VITE_GREEN_API_TOKEN_INSTANCE ||
    "6aafbc5f8161432fb8342fc5ab5c20533dde6e794dfc406987";
  const greenApiGroupId =
    env.VITE_GREEN_API_GROUP_ID || "120363412598827459@g.us";

  // Configured WhatsApp notification recipients (Paulo + Gabriel)
  const ADMIN_RECIPIENTS = [
    { phone: "351926256842", apikey: "1825930", name: "Paulo (Admin)" },
    { phone: "351935190491", apikey: "1726665", name: "Gabriel (Barbeiro)" }
  ];

  let msg = `✂️ *ROTA DO CORTE — NOVO AGENDAMENTO!*\n\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 *Cliente:* ${clientName || "Não indicado"}\n`;
  msg += `📱 *Contacto:* ${phone || "Não indicado"}\n`;
  msg += `💈 *Serviço:* ${serviceName} (${servicePrice})\n`;
  msg += `📅 *Data & Hora:* ${dateFormatted} às ${time}\n`;
  if (notes) msg += `📝 *Observações:* ${notes}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📍 _Barbearia Gabriel Silva • Paião_`;

  // 1. Primary Dispatch: Green-API (Sends to dedicated WhatsApp Group or Admin numbers)
  if (greenApiUrl && greenApiId && greenApiToken) {
    try {
      const greenEndpoint = `${greenApiUrl}/waInstance${greenApiId}/sendMessage/${greenApiToken}`;
      const targetChatIds = greenApiGroupId
        ? [greenApiGroupId]
        : ADMIN_RECIPIENTS.map((r) => `${r.phone}@c.us`);

      const greenPromises = targetChatIds.map(async (chatId) => {
        return fetch(greenEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId,
            message: msg
          })
        });
      });
      await Promise.allSettled(greenPromises);
      return { success: true };
    } catch (err) {
      console.warn("Falha no envio Green-API, a tentar fallback:", err);
    }
  }

  // 2. Secondary Fallback: CallMeBot
  const encodedMsg = encodeURIComponent(msg);
  const promises = ADMIN_RECIPIENTS.map(async ({ phone: recipientPhone, apikey: recipientKey }) => {
    if (!recipientPhone || !recipientKey) return;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${recipientPhone}&text=${encodedMsg}&apikey=${recipientKey}`;
    try {
      await fetch(url, { mode: "no-cors", keepalive: true });
    } catch (err) {
      try {
        if (typeof Image !== "undefined") {
          const img = new Image();
          img.src = url;
        }
      } catch {}
    }
  });

  await Promise.allSettled(promises);
  return { success: true };
}
