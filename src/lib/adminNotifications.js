/**
 * ROTA DO CORTE — Sistema de Alertas Sonoros & Notificações Push do Painel Admin
 * 
 * Inclui:
 * 1. Web Audio API Synth (Sino harmónico de alta definição, sem dependência de ficheiros externos)
 * 2. Browser Web Notification API (Alertas de sistema no telemóvel e PC com vibração)
 * 3. Gestão de permissões e preferências persistentes em LocalStorage
 */

// Chaves de LocalStorage
const STORAGE_SOUND_ENABLED = "rotadocorte_admin_sound_enabled";
const STORAGE_NOTIF_ENABLED = "rotadocorte_admin_notif_enabled";
const STORAGE_REMINDERS_ENABLED = "rotadocorte_admin_reminders_enabled";
const STORAGE_VOLUME = "rotadocorte_admin_volume";

// Instância única de AudioContext
let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Desbloqueia o AudioContext no primeiro toque/clique do utilizador (requisito iOS/Safari/Chrome)
 */
export function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

// Auto-desbloqueio no primeiro toque em mobile / desktop
if (typeof window !== "undefined") {
  const autoUnlock = () => {
    unlockAudioContext();
    window.removeEventListener("touchstart", autoUnlock);
    window.removeEventListener("pointerdown", autoUnlock);
    window.removeEventListener("click", autoUnlock);
  };
  window.addEventListener("touchstart", autoUnlock, { passive: true });
  window.addEventListener("pointerdown", autoUnlock, { passive: true });
  window.addEventListener("click", autoUnlock, { passive: true });

  // Registo de Service Worker para notificações em Android / Telemóvel
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW register notice:", err));
    });
  }
}

/**
 * Toca um sino harmónico de luxo em 4 notas douradas (C5 -> E5 -> G5 -> C6)
 * @param {number} customVolume Nível de volume (0.0 a 1.0)
 */
export function playLuxuryChime(customVolume = null) {
  try {
    const isSoundOn = isSoundEnabled();
    if (!isSoundOn && customVolume === null) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const masterVol = customVolume !== null ? customVolume : getSavedVolume();
    if (masterVol <= 0) return;

    const now = ctx.currentTime;

    // Sequência de notas harmónicas do sino
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.8, gain: 0.35 }, // C5
      { freq: 659.25, time: 0.12, dur: 0.9, gain: 0.40 }, // E5
      { freq: 783.99, time: 0.24, dur: 1.1, gain: 0.45 }, // G5
      { freq: 1046.50, time: 0.36, dur: 1.4, gain: 0.55 }, // C6 (brilho final)
    ];

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVol, now);
    masterGain.connect(ctx.destination);

    notes.forEach(({ freq, time, dur, gain: noteGainVal }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Forma de onda rica (sine com harmónico suave)
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);

      // Envelope ADSR suave
      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.exponentialRampToValueAtTime(noteGainVal, now + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });

    // Vibração tátil no telemóvel
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate([180, 80, 220]);
      } catch (_) {}
    }
  } catch (err) {
    console.warn("Audio chime play error:", err);
  }
}

/**
 * Toca um som de confirmação rápido
 */
export function playActionBeep() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch (_) {}
}

/**
 * Verifica se as Notificações do Navegador são suportadas
 */
export function isPushSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Devolve o estado da permissão de notificações
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getNotificationPermission() {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Pede permissão ao utilizador para notificações do sistema
 */
export async function requestNotificationPermission() {
  if (!isPushSupported()) return "unsupported";
  try {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      setNotificationsEnabled(true);
      // Notificação de boas-vindas de teste
      showSystemNotification({
        title: "✂️ Notificações Ativadas!",
        body: "Receberá alertas sonoros e de ecrã sempre que entrar um novo agendamento na Rota do Corte.",
        tag: "rotadocorte-welcome"
      });
    }
    return result;
  } catch (err) {
    console.warn("Erro ao pedir permissão de notificações:", err);
    return "denied";
  }
}

/**
 * Dispara uma notificação nativa do sistema (compatível com Android / Mobile e Desktop)
 */
export async function showSystemNotification({ title, body, icon, tag, data, onClick }) {
  if (!isPushSupported()) return null;
  if (Notification.permission !== "granted") return null;
  if (!isNotificationsEnabled()) return null;

  const notifOptions = {
    body,
    icon: icon || "/favicon.svg",
    badge: "/favicon.svg",
    tag: tag || `booking-${Date.now()}`,
    renotify: true,
    data,
    vibrate: [200, 100, 200]
  };

  // 1. Tentar primeiro via Service Worker (obrigatório para Android Chrome / Mobile)
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === "function") {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    } catch (_) {
      // Continua para fallback nativo
    }
  }

  // 2. Fallback para Desktop Notification API
  try {
    const notification = new Notification(title, notifOptions);

    notification.onclick = (e) => {
      e.preventDefault();
      if (typeof window !== "undefined") {
        window.focus();
      }
      if (typeof onClick === "function") {
        onClick(e);
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn("Erro ao emitir notificação de sistema:", err);
    return null;
  }
}

// -------------------------------------------------------------
// Getters & Setters de Preferências em LocalStorage
// -------------------------------------------------------------

export function isSoundEnabled() {
  if (typeof localStorage === "undefined") return true;
  const val = localStorage.getItem(STORAGE_SOUND_ENABLED);
  return val === null ? true : val === "true";
}

export function setSoundEnabled(enabled) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_SOUND_ENABLED, String(enabled));
}

export function isNotificationsEnabled() {
  if (typeof localStorage === "undefined") return true;
  const val = localStorage.getItem(STORAGE_NOTIF_ENABLED);
  return val === null ? true : val === "true";
}

export function setNotificationsEnabled(enabled) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_NOTIF_ENABLED, String(enabled));
}

export function getSavedVolume() {
  if (typeof localStorage === "undefined") return 0.8;
  const val = localStorage.getItem(STORAGE_VOLUME);
  if (!val) return 0.8;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0.8 : Math.max(0, Math.min(1, parsed));
}

export function isRemindersEnabled() {
  if (typeof localStorage === "undefined") return true;
  const val = localStorage.getItem(STORAGE_REMINDERS_ENABLED);
  return val === null ? true : val === "true";
}

export function setRemindersEnabled(enabled) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_REMINDERS_ENABLED, String(enabled));
}

/**
 * Toca um sino distinto de aviso de preparação (2h / 1h antes)
 */
export function playReminderChime(customVolume = null) {
  try {
    const isSoundOn = isSoundEnabled();
    if (!isSoundOn && customVolume === null) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const masterVol = customVolume !== null ? customVolume : getSavedVolume();
    if (masterVol <= 0) return;

    const now = ctx.currentTime;

    // Sequência de 2 acordes harmónicos para aviso de antecedência (D5 -> A5)
    const notes = [
      { freq: 587.33, time: 0.00, dur: 0.7, gain: 0.35 }, // D5
      { freq: 880.00, time: 0.18, dur: 1.1, gain: 0.50 }, // A5 (alerta claro)
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVol, now);
    masterGain.connect(ctx.destination);

    notes.forEach(({ freq, time, dur, gain: noteGainVal }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.exponentialRampToValueAtTime(noteGainVal, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });

    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (_) {}
    }
  } catch (err) {
    console.warn("Audio reminder chime play error:", err);
  }
}
