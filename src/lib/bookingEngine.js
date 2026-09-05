/**
 * Booking Engine & Calendar Utilities (Single Barber & 30-Minute Interval System)
 */

import { servicesData, shopInfo } from "../data/services";

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
  const service = servicesData.find((s) => s.id === serviceId) || servicesData[3];
  
  let durationMinutes = 30;
  if (service?.duration) {
    const parsed = parseInt(service.duration, 10);
    if (!isNaN(parsed) && parsed > 0) durationMinutes = parsed;
  }

  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday

  // Sunday: Closed
  if (dayOfWeek === 0) {
    return [];
  }

  // Working shift: 10:00 - 22:00
  const shiftStartMinutes = 10 * 60; // 10:00
  const shiftEndMinutes = 22 * 60;   // 22:00

  // Lunch break: 13:00 - 14:00
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
    slotStart + durationMinutes <= shiftEndMinutes;
    slotStart += slotIntervalMinutes // Strictly 30-minute increments!
  ) {
    const slotEnd = slotStart + durationMinutes;
    const timeString = minutesToTimeString(slotStart);
    const h = Math.floor(slotStart / 60);
    const period = h < 13 ? "morning" : h < 19 ? "afternoon" : "evening";

    // Skip if overlapping with lunch break
    if (slotStart < lunchEndMinutes && slotEnd > lunchStartMinutes) {
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

    // Check conflict with existing bookings (active appointments)
    const hasConflict = existingBookings.some((b) => {
      if (b.date !== date || b.status === "cancelled") return false;
      const bStart = timeStringToMinutes(b.time);
      const bEnd = bStart + (b.duration || 30);
      return slotStart < bEnd && slotEnd > bStart;
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
 * Sends an automated real-time WhatsApp alert to Admin whenever a new booking is created
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
  // Active Admin Notification Config (Developer test number; easily swapped for Gabriel's)
  const ADMIN_PHONE = import.meta.env.VITE_ADMIN_WHATSAPP_PHONE || "351926256842";
  const ADMIN_APIKEY = import.meta.env.VITE_ADMIN_WHATSAPP_APIKEY || "1825930";

  let msg = `✂️ *NOVO AGENDAMENTO — Rota do Corte*\n\n`;
  msg += `👤 *Cliente:* ${clientName || "Não indicado"}\n`;
  msg += `📱 *Contacto:* ${phone || "Não indicado"}\n`;
  msg += `💈 *Serviço:* ${serviceName} (${servicePrice})\n`;
  msg += `📅 *Data & Hora:* ${dateFormatted} às ${time}\n`;
  if (notes) msg += `📝 *Notas:* ${notes}\n`;
  msg += `\n📍 *Localização:* ${shopInfo.addressShort}\n`;
  msg += `_Notificação automática em tempo real._`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_PHONE}&text=${encodeURIComponent(
    msg
  )}&apikey=${ADMIN_APIKEY}`;

  try {
    // Mode 'no-cors' fires the API endpoint safely in background without CORS restriction
    await fetch(url, { mode: "no-cors" });
    return { success: true };
  } catch (err) {
    console.warn("CallMeBot alert non-blocking warning:", err);
    return { success: false, error: err };
  }
}
