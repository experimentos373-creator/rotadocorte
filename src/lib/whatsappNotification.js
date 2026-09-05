/**
 * 📲 Automatic WhatsApp Notifications for Gabriel Silva via CallMeBot API (100% Free)
 * 
 * Gabriel's Phone: +351935190491
 */

const GABRIEL_PHONE = "+351935190491";

// Default CallMeBot API key or from environment/localStorage
export const CALLMEBOT_STORAGE_KEY = "rotadocorte_callmebot_apikey";

export function getCallMeBotApiKey() {
  try {
    return (
      import.meta.env.VITE_CALLMEBOT_API_KEY ||
      localStorage.getItem(CALLMEBOT_STORAGE_KEY) ||
      ""
    );
  } catch {
    return "";
  }
}

export function setCallMeBotApiKey(apiKey) {
  try {
    if (apiKey) {
      localStorage.setItem(CALLMEBOT_STORAGE_KEY, apiKey.trim());
    }
  } catch {}
}

/**
 * Sends a formatted WhatsApp notification to Gabriel whenever a booking occurs
 */
export async function sendGabrielWhatsAppNotification({
  customerName,
  customerPhone,
  serviceName,
  servicePrice,
  date,
  time,
  notes = ""
}) {
  const apiKey = getCallMeBotApiKey();
  if (!apiKey) {
    console.warn("CallMeBot API key not configured yet.");
    return { success: false, reason: "NO_API_KEY" };
  }

  // Build high-clarity notification message for Gabriel
  const messageLines = [
    "✂️ *NOVO AGENDAMENTO — ROTA DO CORTE*",
    "",
    `👤 *Cliente:* ${customerName}`,
    `📱 *Contacto:* ${customerPhone}`,
    `💈 *Serviço:* ${serviceName} (${servicePrice})`,
    `📅 *Data & Hora:* ${date} às ${time}`,
    notes ? `📝 *Notas:* ${notes}` : "",
    "",
    "⚡ _Agendado automaticamente pelo website rotadocorte.vercel.app_"
  ].filter(Boolean);

  const fullText = messageLines.join("\n");
  const encodedText = encodeURIComponent(fullText);

  const cleanPhone = GABRIEL_PHONE.replace("+", "");
  const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${apiKey}`;

  try {
    // Fire and forget or await fetch
    const response = await fetch(url, {
      method: "GET",
      mode: "no-cors" // CallMeBot supports direct GET
    });

    return { success: true };
  } catch (err) {
    console.error("Error sending WhatsApp notification:", err);
    return { success: false, error: err };
  }
}
