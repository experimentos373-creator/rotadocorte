import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Lock,
  Search,
  SlidersHorizontal,
  Scissors,
  Check,
  AlertCircle,
  Layers,
  ChevronDown,
  Pencil,
  Trash2,
  BarChart3,
  Users,
  Sun,
  Moon,
  Eye,
  EyeOff,
  LogOut,
  ShieldCheck,
  CalendarDays,
  Download,
  Bell,
  Volume2,
  VolumeX,
  Menu,
  X,
  Archive,
  Receipt,
  Grid3X3,
  List
} from "lucide-react";
import { WhatsAppIcon } from "../components/WhatsAppButton";
import {
  updateAppointment,
  deleteAppointment,
  getAllAppointments,
  createBlockSlot,
  verifyAdminPin,
  subscribeToAppointments,
  subscribeToLiveAlerts,
  createBooking,
  getLisbonTodayDateString
} from "../lib/supabase";
import {
  playLuxuryChime,
  playReminderChime,
  showSystemNotification,
  isSoundEnabled,
  setSoundEnabled,
  isNotificationsEnabled,
  setNotificationsEnabled,
  isRemindersEnabled,
  setRemindersEnabled,
  requestNotificationPermission,
  getNotificationPermission,
  unlockAudioContext
} from "../lib/adminNotifications";
import { servicesData, shopInfo } from "../data/services";
import {
  mergeAppointmentsWithLedger,
  sealCompletedAppointment,
  preserveAppointmentBeforeDelete,
  recordDirectSale,
  toggleArchiveClient,
  getArchivedClients,
  exportFinancialReportCSV,
  parseLedgerPrice
} from "../lib/financialLedger";

export default function AdminAgenda() {
  // 🔒 Security: Authentication & PIN Lock
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("rotadocorte_admin_auth") === "true";
  });
  const [adminPinInput, setAdminPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [currentAdminPin, setCurrentAdminPin] = useState(() => {
    return sessionStorage.getItem("rotadocorte_admin_pin") || "";
  });

  // UI Theme (Light Executive or Dark Studio)
  const [dashboardTheme, setDashboardTheme] = useState(() => {
    return localStorage.getItem("rotadocorte_admin_theme") || "dark";
  });

  const toggleTheme = () => {
    const next = dashboardTheme === "dark" ? "light" : "dark";
    setDashboardTheme(next);
    localStorage.setItem("rotadocorte_admin_theme", next);
  };

  const isLight = dashboardTheme === "light";

  // Sidebar Open on Mobile
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Navigation Tabs: 'agenda' | 'stats' | 'crm' | 'blocks'
  const [activeTab, setActiveTab] = useState("agenda");

  // View Mode inside Agenda: 'table' (Lista Detalhada) | 'timeline' (Vista Horária)
  const [agendaViewMode, setAgendaViewMode] = useState("table");

  // Selected Date for Agenda View
  const [selectedDate, setSelectedDate] = useState(() => getLisbonTodayDateString());

  // Appointments State
  const [allAppointments, setAllAppointments] = useState([]);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Scope in Agenda View: 'day' (Agenda do Dia Selecionado) | 'all' (Todas as Marcações)
  const [agendaScope, setAgendaScope] = useState("day");

  // Sorting Mode: 'newest' | 'oldest' | 'price_desc' | 'price_asc'
  const [sortBy, setSortBy] = useState("newest");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [crmSearchQuery, setCrmSearchQuery] = useState("");

  // Stats Period Selector: 'today' | 'month' | 'all'
  const [statsPeriod, setStatsPeriod] = useState("month");
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [selectedWeekKey, setSelectedWeekKey] = useState(null);
  const [pieChartMode, setPieChartMode] = useState("days"); // 'days' | 'services'
  const [hoveredPieIndex, setHoveredPieIndex] = useState(null);

  // Modal: New Manual Appointment
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualDate, setManualDate] = useState(() => getLisbonTodayDateString());
  const [manualTime, setManualTime] = useState("11:00");
  const [manualServiceId, setManualServiceId] = useState("corte-barba-terapia");
  const [manualNotes, setManualNotes] = useState("");
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Modal: Edit Appointment
  const [editingAppt, setEditingAppt] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editServiceId, setEditServiceId] = useState("");
  const [editStatus, setEditStatus] = useState("confirmed");
  const [editNotes, setEditNotes] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal: Block Slot (Time Off / Pausa / Ausência)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(() => getLisbonTodayDateString());
  const [blockStartTime, setBlockStartTime] = useState("13:00");
  const [blockEndTime, setBlockEndTime] = useState("14:30");
  const [blockReason, setBlockReason] = useState("Pausa de Almoço");
  const [isSavingBlock, setIsSavingBlock] = useState(false);

  // Helper Price Parser
  const parsePrice = (price) => {
    if (typeof price === "number") return price;
    if (!price) return 0;
    const cleaned = String(price)
      .replace(/[^\d.,]/g, "")
      .replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Helper to get week info from a date string "YYYY-MM-DD"
  const getWeekInfo = (dateStr) => {
    if (!dateStr) return { weekKey: "other", weekLabel: "Outros", shortLabel: "Outros", startDate: "", endDate: "", monTimestamp: 0 };
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    
    const pad = (n) => String(n).padStart(2, "0");
    const monStr = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
    const sunStr = `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`;
    const labelMon = `${pad(mon.getDate())}/${pad(mon.getMonth() + 1)}`;
    const labelSun = `${pad(sun.getDate())}/${pad(sun.getMonth() + 1)}`;
    
    return {
      weekKey: `${monStr}_${sunStr}`,
      weekLabel: `Semana de ${labelMon} a ${labelSun}`,
      shortLabel: `${labelMon} - ${labelSun}`,
      startDate: monStr,
      endDate: sunStr,
      monTimestamp: mon.getTime()
    };
  };

  // Helper to generate SVG Donut slice path
  const describeDonutSlice = (cx, cy, rOuter, rInner, startAngle, endAngle) => {
    const angle = endAngle - startAngle;
    const safeEnd = angle >= 360 ? startAngle + 359.99 : endAngle;
    const rad = (a) => ((a - 90) * Math.PI) / 180.0;

    const p1 = { x: cx + rOuter * Math.cos(rad(startAngle)), y: cy + rOuter * Math.sin(rad(startAngle)) };
    const p2 = { x: cx + rOuter * Math.cos(rad(safeEnd)), y: cy + rOuter * Math.sin(rad(safeEnd)) };
    const p3 = { x: cx + rInner * Math.cos(rad(safeEnd)), y: cy + rInner * Math.sin(rad(safeEnd)) };
    const p4 = { x: cx + rInner * Math.cos(rad(startAngle)), y: cy + rInner * Math.sin(rad(startAngle)) };

    const largeArc = angle > 180 ? 1 : 0;

    return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} ` +
           `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} ` +
           `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} ` +
           `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} Z`;
  };

  // 🔒 Financial Ledger & CRM state
  const [ledgerCounter, setLedgerCounter] = useState(0);
  const refreshLedger = () => setLedgerCounter((prev) => prev + 1);
  const [archivedClientKeys, setArchivedClientKeys] = useState(() => getArchivedClients());
  const [crmFilter, setCrmFilter] = useState("all");

  // Modal: Venda Direta / Faturação Balcão
  const [isDirectSaleModalOpen, setIsDirectSaleModalOpen] = useState(false);
  const [directSaleCustomer, setDirectSaleCustomer] = useState("");
  const [directSalePhone, setDirectSalePhone] = useState("");
  const [directSaleDate, setDirectSaleDate] = useState(() => getLisbonTodayDateString());
  const [directSaleTime, setDirectSaleTime] = useState("12:00");
  const [directSaleService, setDirectSaleService] = useState("Corte de Cabelo");
  const [directSalePrice, setDirectSalePrice] = useState("10.00");
  const [directSaleNotes, setDirectSaleNotes] = useState("Venda balcão / Cliente direto");
  const [isSavingDirectSale, setIsSavingDirectSale] = useState(false);

  // Unified Appointments (Never lose financial or archived data)
  const unifiedAppointments = useMemo(() => {
    return mergeAppointmentsWithLedger(allAppointments);
  }, [allAppointments, ledgerCounter]);

  // 🔔 Live Audio, Push Notification & Advance Reminder States
  const [isSoundOn, setIsSoundOn] = useState(() => isSoundEnabled());
  const [isNotifOn, setIsNotifOn] = useState(() => isNotificationsEnabled());
  const [isRemindersOn, setIsRemindersOn] = useState(() => isRemindersEnabled());
  const [pushPermission, setPushPermission] = useState(() => getNotificationPermission());
  const [isNotifPopoverOpen, setIsNotifPopoverOpen] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(null);
  const alertTimerRef = useRef(null);
  const knownApptIdsRef = useRef(new Set());
  const isInitialLoadDoneRef = useRef(false);
  const lastAdminCreatedIdRef = useRef(null);
  const alertedBookingIdsRef = useRef(new Set());
  const remindedKeysRef = useRef(new Set());

  const toggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      unlockAudioContext();
      playLuxuryChime(0.8);
    }
  };

  const toggleReminders = () => {
    const next = !isRemindersOn;
    setIsRemindersOn(next);
    setRemindersEnabled(next);
    if (next) {
      unlockAudioContext();
      playReminderChime(0.8);
    }
  };

  const handleEnablePush = async () => {
    const perm = await requestNotificationPermission();
    setPushPermission(perm);
    setIsNotifOn(isNotificationsEnabled());
  };

  const handleTestChime = () => {
    unlockAudioContext();
    playLuxuryChime(1.0);
    showSystemNotification({
      title: "✂️ NOVA MARCAÇÃO DE CLIENTE!",
      body: "Manuel Ferreira marcou para as 16:30 (Corte & Barboterapia).",
      tag: "test-alert"
    });
  };

  const handleTestReminder = () => {
    unlockAudioContext();
    playReminderChime(1.0);
    showSystemNotification({
      title: "⏳ PREPARAÇÃO (2h Antes)",
      body: "⏳ PREPARAÇÃO — Esteja preparado: Marcação de Tiago Rodrigues às 18:00 (Corte Clássico).",
      tag: "test-reminder"
    });
  };

  // Disparo de Notificação para Novo Agendamento
  const triggerIncomingBookingAlert = (booking, source = "client_online") => {
    if (!booking) return;

    if (booking.id && booking.id === lastAdminCreatedIdRef.current) return;
    if (source === "admin_manual" || booking.source === "admin_manual") return;
    if (booking.id) {
      if (alertedBookingIdsRef.current.has(booking.id)) return;
      alertedBookingIdsRef.current.add(booking.id);
    }

    playLuxuryChime();

    const clientName = booking.customer_name || booking.name || "Cliente";
    const serviceName = booking.service_name || "Serviço";
    const dateStr = booking.date || "Hoje";
    const timeStr = booking.time || "";

    showSystemNotification({
      title: "✂️ NOVA MARCAÇÃO DE CLIENTE!",
      body: `${clientName} marcou para as ${timeStr} do dia ${dateStr} (${serviceName}).`,
      tag: `booking-${booking.id || Date.now()}`,
      onClick: () => {
        if (booking.date) {
          setSelectedDate(booking.date);
          setAgendaScope("day");
        }
      }
    });

    setIncomingAlert({
      id: booking.id || Date.now(),
      type: "new_booking",
      name: clientName,
      phone: booking.customer_phone || booking.phone || "",
      service: serviceName,
      price: booking.service_price || "15,00 €",
      date: dateStr,
      time: timeStr,
      notes: booking.customer_notes || booking.notes || ""
    });

    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => {
      setIncomingAlert(null);
    }, 20000);
  };

  // Lembretes de Antecedência
  useEffect(() => {
    if (!isAuthenticated || !isRemindersOn) return;

    const checkAdvanceReminders = () => {
      try {
        const now = new Date();
        const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
        const currentLisbonMinutes = now.getHours() * 60 + now.getMinutes();

        const activeToday = allAppointments.filter(
          (a) => a.date === todayStr && a.status === "confirmed" && a.time
        );

        activeToday.forEach((appt) => {
          const [hStr, mStr] = appt.time.split(":");
          const apptMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
          const diffMinutes = apptMinutes - currentLisbonMinutes;

          const key2h = `notified_2h_${appt.id}_${todayStr}`;
          const key1h = `notified_1h_${appt.id}_${todayStr}`;

          if (diffMinutes > 60 && diffMinutes <= 120) {
            let alreadyNotified = remindedKeysRef.current.has(key2h);
            if (!alreadyNotified) {
              remindedKeysRef.current.add(key2h);
              triggerReminderAlert(appt, "2h", diffMinutes);
            }
          }

          if (diffMinutes > 0 && diffMinutes <= 60) {
            let alreadyNotified = remindedKeysRef.current.has(key1h);
            if (!alreadyNotified) {
              remindedKeysRef.current.add(key1h);
              triggerReminderAlert(appt, "1h", diffMinutes);
            }
          }
        });
      } catch (err) {
        console.warn("Erro no motor de lembretes:", err);
      }
    };

    checkAdvanceReminders();
    const reminderInterval = setInterval(checkAdvanceReminders, 30000);
    return () => clearInterval(reminderInterval);
  }, [isAuthenticated, isRemindersOn, allAppointments]);

  const triggerReminderAlert = (appt, milestone, diffMinutes) => {
    playReminderChime();
    const title = milestone === "1h" ? "⏰ PRÓXIMA MARCAÇÃO (Falta 1h)!" : "⏳ PREPARAÇÃO (Faltam 2h)!";
    const body = `${appt.customer_name} às ${appt.time} (${appt.service_name || "Serviço"}).`;

    showSystemNotification({
      title,
      body,
      tag: `reminder-${appt.id}-${milestone}`
    });

    setIncomingAlert({
      id: `rem-${appt.id}-${milestone}`,
      type: milestone === "1h" ? "reminder_1h" : "reminder_2h",
      name: appt.customer_name,
      phone: appt.customer_phone || "",
      service: appt.service_name || "Corte",
      price: appt.service_price || "15,00 €",
      date: appt.date,
      time: appt.time,
      diffMinutes
    });

    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => {
      setIncomingAlert(null);
    }, 25000);
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminPinInput.trim()) {
      setPinError("Por favor insira a senha / PIN de acesso.");
      return;
    }
    setIsVerifyingPin(true);
    setPinError("");

    const res = await verifyAdminPin(adminPinInput.trim());
    setIsVerifyingPin(false);

    if (res.success) {
      unlockAudioContext();
      sessionStorage.setItem("rotadocorte_admin_auth", "true");
      sessionStorage.setItem("rotadocorte_admin_pin", adminPinInput.trim());
      setCurrentAdminPin(adminPinInput.trim());
      setIsAuthenticated(true);
      setAdminPinInput("");
    } else {
      setPinError(res.message || "Senha / PIN incorreto. Tente novamente.");
    }
  };

  // Logout Handler
  const handleLogout = () => {
    sessionStorage.removeItem("rotadocorte_admin_auth");
    sessionStorage.removeItem("rotadocorte_admin_pin");
    setIsAuthenticated(false);
    setAdminPinInput("");
    setPinError("");
  };

  const isFetchingRef = useRef(false);

  // Load Appointments
  const loadAppointments = async (silent = false) => {
    if (!isAuthenticated || !currentAdminPin) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setIsLoading(true);

    try {
      const data = await getAllAppointments(currentAdminPin);
      if (Array.isArray(data)) {
        data.forEach((appt) => {
          if (appt.status === "completed") {
            sealCompletedAppointment(appt);
          }
        });

        if (isInitialLoadDoneRef.current && data.length > 0) {
          const freshBookings = data.filter(
            (a) => !knownApptIdsRef.current.has(a.id) && a.status !== "cancelled"
          );
          if (freshBookings.length > 0) {
            triggerIncomingBookingAlert(freshBookings[0]);
          }
        }

        knownApptIdsRef.current = new Set(data.map((a) => a.id));
        isInitialLoadDoneRef.current = true;

        setAllAppointments(data);
        const forDay = data.filter((a) => a.date === selectedDate);
        forDay.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
        setDayAppointments(forDay);
      }
    } catch (_) {
    } finally {
      if (!silent) setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentAdminPin) {
      loadAppointments();

      const unsubLive = subscribeToLiveAlerts((payload) => {
        if (!payload) return;
        if (payload.id && payload.id === lastAdminCreatedIdRef.current) return;
        if (payload.source === "admin_manual") return;

        triggerIncomingBookingAlert(payload, "client_online");
        loadAppointments(true);
      });

      const unsubscribe = subscribeToAppointments((payload) => {
        if (payload?.eventType === "INSERT" && payload?.new) {
          const newAppt = payload.new;
          if (newAppt.id && newAppt.id === lastAdminCreatedIdRef.current) return;
          loadAppointments(true);
        } else if (payload?.eventType === "UPDATE" || payload?.eventType === "DELETE") {
          loadAppointments(true);
        }
      });

      return () => {
        if (typeof unsubLive === "function") unsubLive();
        if (typeof unsubscribe === "function") unsubscribe();
      };
    }
  }, [isAuthenticated, currentAdminPin, selectedDate]);

  useEffect(() => {
    const forDay = allAppointments.filter((a) => a.date === selectedDate);
    forDay.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    setDayAppointments(forDay);
  }, [selectedDate, allAppointments]);

  // Handlers for Appointment Status Changes
  const handleStatusChange = async (id, newStatus) => {
    const target = allAppointments.find((a) => a.id === id);
    if (!target) return;

    if (newStatus === "completed") {
      sealCompletedAppointment(target);
      refreshLedger();
    }

    const updated = { ...target, status: newStatus };
    setAllAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));

    await updateAppointment(id, { status: newStatus }, currentAdminPin);
    loadAppointments(true);
  };

  const handleDeleteAppointment = async (id, isBlock = false) => {
    const apptToDelete = allAppointments.find((a) => a.id === id);
    if (apptToDelete && !isBlock) {
      preserveAppointmentBeforeDelete(apptToDelete);
      refreshLedger();
    }

    if (!window.confirm("Tem certeza que deseja remover este horário?")) return;

    setAllAppointments((prev) => prev.filter((a) => a.id !== id));
    await deleteAppointment(id, currentAdminPin);
    if (editingAppt?.id === id) setEditingAppt(null);
    loadAppointments(true);
  };

  // Manual New Booking
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim()) return;

    setIsSavingManual(true);
    const serviceObj = servicesData.find((s) => s.id === manualServiceId) || servicesData[0];

    try {
      const res = await createBooking({
        shopSlug: "rotadocorte",
        serviceId: manualServiceId,
        date: manualDate,
        time: manualTime,
        customerName: manualName.trim(),
        customerPhone: manualPhone.trim(),
        customerNotes: manualNotes.trim(),
        source: "admin_manual"
      });

      setIsSavingManual(false);

      if (res.success) {
        lastAdminCreatedIdRef.current = res.appointment?.id;
        setIsNewModalOpen(false);
        setManualName("");
        setManualPhone("");
        setManualNotes("");
        loadAppointments();
      } else {
        alert(res.message || "Erro ao criar marcação");
      }
    } catch (_) {
      setIsSavingManual(false);
      alert("Erro na gravação da marcação.");
    }
  };

  // Edit Booking Save
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAppt) return;

    setIsSavingEdit(true);
    const serviceObj = servicesData.find((s) => s.id === editServiceId) || servicesData[0];

    const updates = {
      customer_name: editName.trim(),
      customer_phone: editPhone.trim(),
      date: editDate,
      time: editTime,
      service_id: editServiceId,
      service_name: serviceObj.name,
      service_price: serviceObj.priceFormatted,
      service_duration: parseInt(serviceObj.duration, 10) || 30,
      status: editStatus,
      customer_notes: editNotes.trim()
    };

    if (editStatus === "completed") {
      sealCompletedAppointment({ ...editingAppt, ...updates });
      refreshLedger();
    }

    await updateAppointment(editingAppt.id, updates, currentAdminPin);
    setIsSavingEdit(false);
    setEditingAppt(null);
    loadAppointments();
  };

  // Create Block Slot
  const handleCreateBlock = async (e) => {
    e.preventDefault();
    setIsSavingBlock(true);

    const [sh, sm] = blockStartTime.split(":").map(Number);
    const [eh, em] = blockEndTime.split(":").map(Number);
    const duration = Math.max((eh * 60 + em) - (sh * 60 + sm), 30);

    const res = await createBlockSlot({
      date: blockDate,
      time: blockStartTime,
      durationMinutes: duration,
      reason: blockReason.trim() || "Pausa / Indisponível"
    }, currentAdminPin);

    setIsSavingBlock(false);

    if (res.success) {
      setIsBlockModalOpen(false);
      setBlockReason("Pausa de Almoço");
      loadAppointments();
    } else {
      alert("Erro ao bloquear horário");
    }
  };

  // Direct Sale / Venda Balcão (Sincronizado Centralmente no Supabase)
  const handleSaveDirectSale = async (e) => {
    e.preventDefault();
    if (!directSaleCustomer.trim()) return;

    setIsSavingDirectSale(true);
    const numPrice = parseFloat(directSalePrice) || 10.0;

    // 1. Grava no ledger local
    recordDirectSale({
      customerName: directSaleCustomer.trim(),
      customerPhone: directSalePhone.trim(),
      date: directSaleDate,
      time: directSaleTime,
      serviceName: directSaleService,
      price: numPrice,
      notes: directSaleNotes.trim()
    });

    // 2. Grava no Supabase central como concluído para que ambos (Gabriel e Paulo) vejam o mesmo valor
    try {
      const res = await createBooking({
        shopSlug: "rotadocorte",
        serviceId: "corte-cabelo",
        date: directSaleDate,
        time: directSaleTime,
        customerName: directSaleCustomer.trim(),
        customerPhone: directSalePhone.trim() || "Balcão",
        customerNotes: `[Venda Balcão] ${directSaleNotes.trim()} (${numPrice.toFixed(2)} €)`,
        totalPrice: `${numPrice.toFixed(2)} €`,
        source: "admin_direct_sale"
      });

      if (res.success && res.appointment?.id) {
        await updateAppointment(
          res.appointment.id,
          {
            status: "completed",
            service_price: `${numPrice.toFixed(2)} €`
          },
          currentAdminPin
        );
      }
    } catch (err) {
      console.warn("Aviso ao sincronizar venda balcão com Supabase:", err);
    }

    refreshLedger();
    setIsSavingDirectSale(false);
    setIsDirectSaleModalOpen(false);
    setDirectSaleCustomer("");
    setDirectSalePhone("");
    setDirectSaleNotes("Venda balcão / Cliente direto");
    loadAppointments();
  };

  const handleExportCSV = () => {
    exportFinancialReportCSV(unifiedAppointments);
  };

  const handleArchiveToggle = (clientKey) => {
    const updated = toggleArchiveClient(clientKey);
    setArchivedClientKeys(updated);
  };

  // Step Date Forward/Backward
  const stepDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // Filtered & Sorted Appointments
  const sortedAndFilteredAppointments = useMemo(() => {
    const base = agendaScope === "day" ? dayAppointments : allAppointments;

    let filtered = base.filter((appt) => {
      if (filterStatus !== "all" && appt.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (appt.customer_name || "").toLowerCase().includes(q);
        const matchesPhone = (appt.customer_phone || "").includes(q);
        const matchesService = (appt.service_name || "").toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesService) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (sortBy === "price_desc") return parsePrice(b.service_price) - parsePrice(a.service_price);
      if (sortBy === "price_asc") return parsePrice(a.service_price) - parsePrice(b.service_price);
      if (sortBy === "oldest") return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      return `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`);
    });

    return filtered;
  }, [agendaScope, dayAppointments, allAppointments, filterStatus, searchQuery, sortBy]);

  // Statistics Calculations
  const statsData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const targetList = unifiedAppointments.filter((a) => {
      if (!a.date) return false;
      if (statsPeriod === "today") return a.date === todayStr;
      if (statsPeriod === "week") {
        const d = new Date(a.date);
        const diff = (now - d) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      }
      if (statsPeriod === "month") {
        return a.date.substring(0, 7) === todayStr.substring(0, 7);
      }
      return true; // "all" (Histórico Total)
    });

    const nonBlocked = targetList.filter((a) => a.status !== "blocked");
    const completed = targetList.filter((a) => a.status === "completed");
    const confirmed = targetList.filter((a) => a.status === "confirmed");
    const cancelled = targetList.filter((a) => a.status === "cancelled");

    const completedRev = completed.reduce((sum, a) => sum + parsePrice(a.service_price), 0);
    const estimatedRev = nonBlocked
      .filter((a) => a.status !== "cancelled")
      .reduce((sum, a) => sum + parsePrice(a.service_price), 0);

    const avgTicket = completed.length > 0 ? completedRev / completed.length : 0;
    const completionRate = nonBlocked.length > 0 ? Math.round((completed.length / nonBlocked.length) * 100) : 0;

    const clientSet = new Set(nonBlocked.map((a) => a.customer_phone || a.customer_name).filter(Boolean));
    const uniqueClientsCount = clientSet.size;

    // Days activity (Seg - Sáb)
    const daysCount = [0, 0, 0, 0, 0, 0];
    const daysRevenue = [0, 0, 0, 0, 0, 0];
    const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dayFullNames = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const dayColors = [
      "#C6924B", // Seg (Ouro Rota do Corte)
      "#71717A", // Ter (Zinc médio)
      "#A1A1AA", // Qua (Zinc neutro)
      "#EAB308", // Qui (Dourado luminoso)
      "#F59E0B", // Sex (Âmbar vibrante)
      "#D97706"  // Sáb (Âmbar caloroso)
    ];

    completed.forEach((a) => {
      const d = new Date(a.date);
      const dayIdx = d.getDay();
      if (dayIdx >= 1 && dayIdx <= 6) {
        daysCount[dayIdx - 1] += 1;
        daysRevenue[dayIdx - 1] += parsePrice(a.service_price);
      }
    });

    const totalDaysCount = daysCount.reduce((acc, c) => acc + c, 0);
    const totalDaysRevenue = daysRevenue.reduce((acc, r) => acc + r, 0);
    const maxDayCount = Math.max(...daysCount, 1);
    let peakDayIdx = 0;
    daysCount.forEach((c, i) => {
      if (c > daysCount[peakDayIdx]) peakDayIdx = i;
    });

    const peakDay = {
      name: dayNames[peakDayIdx],
      fullName: dayFullNames[peakDayIdx],
      count: daysCount[peakDayIdx],
      revenue: daysRevenue[peakDayIdx],
      percent: totalDaysCount > 0 ? Math.round((daysCount[peakDayIdx] / totalDaysCount) * 100) : 0,
      color: dayColors[peakDayIdx]
    };

    const daysActivity = dayNames.map((name, i) => ({
      label: name,
      fullName: dayFullNames[i],
      count: daysCount[i],
      revenue: daysRevenue[i],
      percent: totalDaysCount > 0 ? Math.round((daysCount[i] / totalDaysCount) * 100) : 0,
      color: dayColors[i]
    }));

    // Slices for Days Donut Chart
    let currDayAngle = 0;
    const daysDonutSlices = daysActivity.map((d, idx) => {
      const slicePct = totalDaysCount > 0 ? d.count / totalDaysCount : 0;
      const angle = slicePct * 360;
      const startAngle = currDayAngle;
      const endAngle = currDayAngle + angle;
      currDayAngle += angle;
      return {
        ...d,
        index: idx,
        slicePct,
        startAngle,
        endAngle
      };
    });

    // Service composition
    const sMap = {};
    const sCountMap = {};
    completed.forEach((a) => {
      const s = a.service_name || "Outros";
      sMap[s] = (sMap[s] || 0) + parsePrice(a.service_price);
      sCountMap[s] = (sCountMap[s] || 0) + 1;
    });

    const serviceColorsPalette = [
      "#F59E0B", // Âmbar 500
      "#C6924B", // Ouro da Marca
      "#D97706", // Âmbar 600
      "#EAB308", // Dourado claro
      "#71717A", // Zinc 500
      "#52525B", // Zinc 600
      "#A1A1AA"  // Zinc 400
    ];

    const serviceRanking = Object.entries(sMap)
      .map(([name, rev], idx) => ({
        name,
        count: sCountMap[name] || 0,
        revenue: rev,
        percent: completedRev > 0 ? Math.round((rev / completedRev) * 100) : 0,
        hex: serviceColorsPalette[idx % serviceColorsPalette.length],
        color: serviceColorsPalette[idx % serviceColorsPalette.length]
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalServiceRevenue = serviceRanking.reduce((acc, s) => acc + s.revenue, 0);
    let currServiceAngle = 0;
    const servicesDonutSlices = serviceRanking.map((s, idx) => {
      const slicePct = totalServiceRevenue > 0 ? s.revenue / totalServiceRevenue : 0;
      const angle = slicePct * 360;
      const startAngle = currServiceAngle;
      const endAngle = currServiceAngle + angle;
      currServiceAngle += angle;
      return {
        label: s.name,
        fullName: s.name,
        count: s.count,
        revenue: s.revenue,
        percent: s.percent,
        color: s.color,
        index: idx,
        slicePct,
        startAngle,
        endAngle
      };
    });

    // Detailed day maps (including all non-blocked cuts & bookings)
    const dayDetailsMap = {};
    nonBlocked.forEach((a) => {
      if (!a.date) return;
      if (!dayDetailsMap[a.date]) {
        dayDetailsMap[a.date] = {
          date: a.date,
          revenue: 0,
          completedCount: 0,
          totalCount: 0,
          appointments: []
        };
      }
      if (a.status === "completed") {
        dayDetailsMap[a.date].revenue += parsePrice(a.service_price);
        dayDetailsMap[a.date].completedCount += 1;
      }
      dayDetailsMap[a.date].totalCount += 1;
      dayDetailsMap[a.date].appointments.push(a);
    });

    Object.values(dayDetailsMap).forEach((dayObj) => {
      dayObj.appointments.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
      dayObj.count = dayObj.completedCount > 0 ? dayObj.completedCount : dayObj.totalCount;
    });

    const dayConfirmedMap = {};
    confirmed.forEach((a) => {
      if (!a.date) return;
      if (!dayConfirmedMap[a.date]) {
        dayConfirmedMap[a.date] = {
          date: a.date,
          revenue: 0,
          count: 0,
          appointments: []
        };
      }
      dayConfirmedMap[a.date].revenue += parsePrice(a.service_price);
      dayConfirmedMap[a.date].count += 1;
      dayConfirmedMap[a.date].appointments.push(a);
    });

    const sortedDates = Object.keys(dayDetailsMap).sort();
    const timelineData = sortedDates.map((d) => {
      const parts = d.split("-");
      const dayNum = parts[2] || "";
      const monthNum = parts[1] || "";
      return {
        date: d,
        label: `${dayNum}/${monthNum}`,
        revenue: dayDetailsMap[d].revenue,
        count: dayDetailsMap[d].completedCount > 0 ? dayDetailsMap[d].completedCount : dayDetailsMap[d].totalCount,
        appointments: dayDetailsMap[d].appointments
      };
    });

    const allAppointmentsList = [...nonBlocked].sort((a, b) => {
      const tA = `${a.date} ${a.time || "00:00"}`;
      const tB = `${b.date} ${b.time || "00:00"}`;
      return tB.localeCompare(tA);
    });

    // Group all non-blocked appointments by week
    const weeksMap = {};
    allAppointmentsList.forEach((appt) => {
      const { weekKey, weekLabel, shortLabel, startDate, endDate, monTimestamp } = getWeekInfo(appt.date);
      if (!weeksMap[weekKey]) {
        weeksMap[weekKey] = {
          weekKey,
          weekLabel,
          shortLabel,
          startDate,
          endDate,
          monTimestamp,
          revenue: 0,
          completedCount: 0,
          totalCount: 0,
          appointments: [],
          dayKeys: []
        };
      }
      const w = weeksMap[weekKey];
      if (appt.status === "completed") {
        w.revenue += parsePrice(appt.service_price);
        w.completedCount += 1;
      }
      w.totalCount += 1;
      w.appointments.push(appt);
      if (appt.date && !w.dayKeys.includes(appt.date)) {
        w.dayKeys.push(appt.date);
      }
    });

    Object.values(weeksMap).forEach((w) => {
      w.dayKeys.sort().reverse();
    });

    const sortedWeeks = Object.values(weeksMap).sort((a, b) => b.monTimestamp - a.monTimestamp);

    // Dynamic Y-Max & Lateral Scale
    const maxDayRevenue = timelineData.length > 0 ? Math.max(...timelineData.map((t) => t.revenue), 10) : 10;
    const targetHeadroom = maxDayRevenue * 1.25;
    let yMax = 30;
    if (targetHeadroom <= 20) yMax = 20;
    else if (targetHeadroom <= 30) yMax = 30;
    else if (targetHeadroom <= 40) yMax = 40;
    else if (targetHeadroom <= 50) yMax = 50;
    else if (targetHeadroom <= 60) yMax = 60;
    else if (targetHeadroom <= 80) yMax = 80;
    else if (targetHeadroom <= 100) yMax = 100;
    else yMax = Math.ceil(targetHeadroom / 20) * 20;

    const chartW = 680;
    const chartH = 220;
    const padL = 52;
    const padR = 24;
    const padT = 32;
    const padB = 34;

    const yTicks = [
      { val: yMax, y: padT, label: `${Math.round(yMax)} €` },
      { val: yMax * 0.75, y: padT + (chartH - padT - padB) * 0.25, label: `${Math.round(yMax * 0.75)} €` },
      { val: yMax * 0.5, y: padT + (chartH - padT - padB) * 0.5, label: `${Math.round(yMax * 0.5)} €` },
      { val: yMax * 0.25, y: padT + (chartH - padT - padB) * 0.75, label: `${Math.round(yMax * 0.25)} €` },
      { val: 0, y: chartH - padB, label: "0 €" }
    ];

    let chartSvgPath = "";
    let chartAreaPath = "";
    const chartPoints = [];

    if (timelineData.length > 1) {
      const stepX = (chartW - padL - padR) / (timelineData.length - 1);
      timelineData.forEach((item, idx) => {
        const x = padL + idx * stepX;
        const y = chartH - padB - (item.revenue / yMax) * (chartH - padT - padB);
        chartPoints.push({ ...item, x, y });
      });

      let d = `M ${chartPoints[0].x.toFixed(1)} ${chartPoints[0].y.toFixed(1)}`;
      for (let i = 0; i < chartPoints.length - 1; i++) {
        const p1 = chartPoints[i];
        const p2 = chartPoints[i + 1];
        const cx = (p1.x + p2.x) / 2;
        d += ` C ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${cx.toFixed(1)} ${p2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
      chartSvgPath = d;
      chartAreaPath = `${d} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${chartH - padB} L ${chartPoints[0].x.toFixed(1)} ${chartH - padB} Z`;
    } else if (timelineData.length === 1) {
      const x = padL + (chartW - padL - padR) / 2;
      const y = chartH - padB - (timelineData[0].revenue / yMax) * (chartH - padT - padB);
      chartPoints.push({ ...timelineData[0], x, y });
    }

    return {
      total: nonBlocked.length,
      uniqueClientsCount,
      completedCount: completed.length,
      confirmedCount: confirmed.length,
      cancelledCount: cancelled.length,
      completedRevenue: completedRev,
      estimatedRevenue: estimatedRev,
      avgTicket,
      completionRate,
      daysActivity,
      maxDayCount,
      peakDay,
      totalDaysCount,
      totalDaysRevenue,
      daysDonutSlices,
      servicesDonutSlices,
      serviceRanking,
      timelineData,
      allAppointmentsList,
      sortedWeeks,
      weeksMap,
      maxRev: yMax,
      yMax,
      yTicks,
      dayDetailsMap,
      dayConfirmedMap,
      chartSvgPath,
      chartAreaPath,
      chartPoints,
      chartW,
      chartH,
      padL,
      padR,
      padT,
      padB
    };
  }, [unifiedAppointments, statsPeriod]);

  // Mini-CRM
  const { crmClients, crmCounts } = useMemo(() => {
    const map = {};

    unifiedAppointments.forEach((a) => {
      if (a.status === "blocked") return;
      const key = (a.customer_phone || a.customer_name || "sem-contacto").trim();
      if (!key || key === "---") return;

      if (!map[key]) {
        map[key] = {
          key,
          name: a.customer_name || "Cliente",
          phone: a.customer_phone || "",
          email: a.customer_email || "",
          totalBookings: 0,
          completedBookings: 0,
          totalSpent: 0,
          lastVisit: a.date,
          servicesUsed: {},
          notesList: []
        };
      }

      const client = map[key];
      client.totalBookings += 1;

      if (a.status === "completed") {
        client.completedBookings += 1;
        client.totalSpent += parsePrice(a.service_price);
      }

      if (a.date && (!client.lastVisit || a.date > client.lastVisit)) {
        client.lastVisit = a.date;
      }

      const sName = a.service_name || "Serviço";
      client.servicesUsed[sName] = (client.servicesUsed[sName] || 0) + 1;

      if (a.customer_notes && !client.notesList.includes(a.customer_notes)) {
        client.notesList.push(a.customer_notes);
      }
    });

    const list = Object.values(map).map((c) => {
      let favService = "Corte Clássico";
      let maxCount = 0;
      Object.entries(c.servicesUsed).forEach(([s, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favService = s;
        }
      });

      const isArchived = archivedClientKeys.includes(c.key);

      return {
        ...c,
        avgTicket: c.completedBookings > 0 ? c.totalSpent / c.completedBookings : 0,
        favService,
        isVip: c.totalBookings >= 3,
        isArchived
      };
    });

    list.sort((a, b) => b.totalBookings - a.totalBookings || b.totalSpent - a.totalSpent);

    const counts = {
      all: list.length,
      active: list.filter((c) => !c.isArchived).length,
      archived: list.filter((c) => c.isArchived).length
    };

    const statusFiltered = list.filter((c) => {
      if (crmFilter === "active") return !c.isArchived;
      if (crmFilter === "archived") return c.isArchived;
      return true;
    });

    const query = crmSearchQuery.toLowerCase().trim();
    if (!query) return { crmClients: statusFiltered, crmCounts: counts };

    const searchFiltered = statusFiltered.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.favService.toLowerCase().includes(query)
    );

    return { crmClients: searchFiltered, crmCounts: counts };
  }, [unifiedAppointments, crmSearchQuery, archivedClientKeys, crmFilter]);

  const formattedPortugueseDate = new Date(selectedDate).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // 🔒 PIN LOCK SCREEN
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors ${
        isLight ? "bg-zinc-100 text-zinc-900" : "bg-zinc-950 text-zinc-100"
      }`}>
        <div className={`w-full max-w-sm rounded-2xl p-6 sm:p-8 shadow-2xl border transition-all ${
          isLight ? "bg-white border-zinc-200" : "bg-zinc-900/90 border-zinc-800"
        }`}>
          <div className="text-center space-y-2 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 border ${
              isLight ? "bg-zinc-100 border-zinc-200 text-[#C6924B]" : "bg-zinc-800 border-zinc-700 text-[#C6924B]"
            }`}>
              <Scissors className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Acesso à Administração
            </h1>
            <p className="text-xs text-zinc-400">
              Introduza o código PIN de Gabriel Silva para gerir a agenda.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Código PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    if (pinError) setPinError("");
                  }}
                  placeholder="••••"
                  autoFocus
                  className={`w-full border rounded-lg px-4 py-2.5 text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all ${
                    isLight
                      ? "bg-zinc-50 border-zinc-200 text-zinc-900"
                      : "bg-zinc-950 border-zinc-800 text-zinc-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinError && (
                <p className="text-xs text-red-400 pt-1 text-center font-medium">
                  {pinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifyingPin}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isVerifyingPin ? "A verificar..." : "Entrar no Painel"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED SHADCN DASHBOARD LAYOUT
  // =========================================================================
  return (
    <div className={`min-h-screen flex font-sans transition-colors ${
      isLight ? "bg-zinc-50 text-zinc-900" : "bg-zinc-950 text-zinc-100"
    }`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* SHADCN SIDEBAR BLOCK                                                      */}
      {/* ========================================================================= */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col justify-between p-4 border-r transition-all duration-200 lg:static lg:translate-x-0 ${
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${
        isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800"
      }`}>
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#C6924B]/15 border border-[#C6924B]/30 flex items-center justify-center text-[#C6924B] shrink-0 group-hover:scale-105 transition-transform">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm leading-tight tracking-tight">
                  Rota do Corte
                </h2>
                <span className="text-[10px] text-zinc-500 font-mono block">
                  Studio Admin
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {[
              { id: "agenda", label: "Agenda & Marcações", icon: CalendarDays, badge: dayAppointments.length },
              { id: "stats", label: "Faturação & Métricas", icon: BarChart3 },
              { id: "crm", label: "Base de Clientes", icon: Users, badge: crmClients.length },
              { id: "blocks", label: "Pausas & Bloqueios", icon: Lock }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? isLight
                        ? "bg-zinc-100 text-zinc-950 font-semibold"
                        : "bg-zinc-800 text-zinc-100 font-semibold"
                      : isLight
                        ? "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0 text-zinc-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? isLight
                          ? "bg-zinc-200 text-zinc-800"
                          : "bg-zinc-700 text-zinc-100"
                        : isLight
                          ? "bg-zinc-100 text-zinc-600"
                          : "bg-zinc-900 text-zinc-400"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`space-y-3 pt-3 border-t ${isLight ? "border-zinc-200" : "border-zinc-800"}`}>
          {/* Quick Sound/Alert Status */}
          <div className="flex items-center justify-between px-2 text-xs text-zinc-500">
            <span className="text-[11px]">Sons & Lembretes</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSoundOn ? "bg-emerald-500" : "bg-zinc-600"}`} />
              <span className="font-mono text-[10px]">{isSoundOn ? "Ativo" : "Mudo"}</span>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#C6924B]/20 text-[#C6924B] flex items-center justify-center font-bold text-xs shrink-0">
                G
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">Gabriel Silva</p>
                <p className="text-[10px] text-zinc-500 truncate">Paião, PT</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN APP CANVAS & SHADCN HEADER                                           */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Live Incoming Alert Banner */}
        {incomingAlert && (
          <div className="sticky top-0 z-40 px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-xs animate-in slide-in-from-top-2">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-zinc-100 truncate">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-emerald-400 font-mono text-[11px] uppercase">
                  {incomingAlert.type === "new_booking" ? "Nova Marcação:" : "Lembrete:"}
                </span>
                <span className="font-medium truncate">
                  {incomingAlert.name} — {incomingAlert.service} às {incomingAlert.time}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {incomingAlert.phone && (
                  <a
                    href={`https://wa.me/${incomingAlert.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Olá ${incomingAlert.name}! Confirmamos o seu agendamento na Rota do Corte para ${incomingAlert.date} às ${incomingAlert.time}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-semibold flex items-center gap-1"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                    <span>WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIncomingAlert(null)}
                  className="p-1 text-zinc-500 hover:text-zinc-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Header App Bar */}
        <header className={`sticky top-0 z-30 px-4 sm:px-8 py-3 border-b backdrop-blur-md transition-colors ${
          isLight ? "bg-white/90 border-zinc-200" : "bg-zinc-950/90 border-zinc-800"
        }`}>
          <div className="flex items-center justify-between gap-3">
            {/* Left: Mobile Toggle + Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 hidden sm:inline">Admin /</span>
                <h1 className="text-sm font-semibold tracking-tight text-zinc-100 capitalize">
                  {activeTab === "agenda" ? "Agenda & Marcações" : activeTab === "stats" ? "Faturação & Métricas" : activeTab === "crm" ? "Base de Clientes" : "Pausas & Bloqueios"}
                </h1>
              </div>
            </div>

            {/* Center: Global Search (Desktop) */}
            <div className="relative hidden md:block w-64 lg:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Pesquisar marcação, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 ${
                  isLight
                    ? "bg-zinc-100 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                }`}
              />
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Notifications Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotifPopoverOpen(!isNotifPopoverOpen)}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    isSoundOn || isRemindersOn
                      ? "border-zinc-700 bg-zinc-800 text-zinc-200"
                      : "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                  }`}
                  title="Configurar Notificações & Áudio"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>

                {isNotifPopoverOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifPopoverOpen(false)} />
                    <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl p-3 shadow-2xl z-50 space-y-3 border text-xs ${
                      isLight ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800"
                    }`}>
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                        <span className="font-semibold text-zinc-100">Sons & Alertas</span>
                        <button type="button" onClick={() => setIsNotifPopoverOpen(false)}>
                          <X className="w-3.5 h-3.5 text-zinc-500" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Sino de Nova Marcação</span>
                          <button
                            type="button"
                            onClick={toggleSound}
                            className={`p-1.5 rounded-md border text-xs ${
                              isSoundOn ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border-zinc-700"
                            }`}
                          >
                            {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Avisos de Preparação (2h e 1h)</span>
                          <button
                            type="button"
                            onClick={toggleReminders}
                            className={`p-1.5 rounded-md border text-xs ${
                              isRemindersOn ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-zinc-800 text-zinc-500 border-zinc-700"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleTestChime}
                            className="py-1 px-2 rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-[10px] font-medium"
                          >
                            Testar Sino
                          </button>
                          <button
                            type="button"
                            onClick={handleTestReminder}
                            className="py-1 px-2 rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-[10px] font-medium"
                          >
                            Testar Lembrete
                          </button>
                        </div>

                        {pushPermission !== "granted" && (
                          <button
                            type="button"
                            onClick={handleEnablePush}
                            className="w-full py-1.5 px-2 rounded-md bg-zinc-100 text-zinc-950 font-semibold text-[11px] mt-1"
                          >
                            Ativar Notificações Push
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors cursor-pointer"
                title={isLight ? "Modo Escuro" : "Modo Claro"}
              >
                {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-[#C6924B]" />}
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => loadAppointments(false)}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Recarregar dados"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#C6924B]" : ""}`} />
              </button>

              {/* Block Slot Button */}
              <button
                type="button"
                onClick={() => {
                  setBlockDate(selectedDate);
                  setIsBlockModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs font-medium cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#C6924B]" />
                <span>Bloquear</span>
              </button>

              {/* New Booking Primary Button */}
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold tracking-tight shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Marcar</span>
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-2.5 md:hidden">
            <input
              type="text"
              placeholder="Pesquisar marcação, cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {/* ========================================================================= */}
          {/* 4 TOP METRIC CARDS BLOCK (SHADCN KPI CARDS)                               */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Faturação Real */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
            }`}>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Faturação Real</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {statsData.completedCount} concluídos
                </span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
                  {statsData.completedRevenue.toFixed(2)} €
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Previsto: {statsData.estimatedRevenue.toFixed(2)} €
                </p>
              </div>
            </div>

            {/* Card 2: Total Marcações */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
            }`}>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Total de Marcações</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-zinc-800 text-zinc-300">
                  {statsData.confirmedCount} ativas
                </span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
                  {statsData.total}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {statsData.cancelledCount} canceladas
                </p>
              </div>
            </div>

            {/* Card 3: Ticket Médio */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
            }`}>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Ticket Médio</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Média
                </span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
                  {statsData.avgTicket.toFixed(2)} €
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Por corte concluído
                </p>
              </div>
            </div>

            {/* Card 4: Comparência */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
            }`}>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Comparência</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Taxa
                </span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xl sm:text-2xl font-bold font-mono text-zinc-100">
                  {statsData.completionRate}%
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {statsData.uniqueClientsCount} clientes únicos
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: AGENDA & MARCAÇÕES                                                 */}
          {/* ========================================================================= */}
          {activeTab === "agenda" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Controls Bar: Scope, Stepper & Filters */}
              <div className={`p-4 rounded-xl border space-y-3.5 ${
                isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
              }`}>
                {/* Row 1: Scope Switcher + Date Stepper + View Toggle */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
                  {/* Scope Tabs */}
                  <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-800 bg-zinc-950/60 w-fit">
                    <button
                      type="button"
                      onClick={() => setAgendaScope("day")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        agendaScope === "day"
                          ? "bg-zinc-800 text-zinc-100 font-semibold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Agenda do Dia</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-700 text-zinc-200">
                        {dayAppointments.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAgendaScope("all")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        agendaScope === "all"
                          ? "bg-zinc-800 text-zinc-100 font-semibold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Todas</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                        {allAppointments.length}
                      </span>
                    </button>
                  </div>

                  {/* Day Stepper */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => stepDate(-1)}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Dia Anterior</span>
                    </button>

                    <div className="relative">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs font-semibold text-zinc-100 cursor-pointer focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => stepDate(1)}
                      className="px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="hidden sm:inline">Dia Seguinte</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* View Switcher: Table vs Timeline */}
                    <div className="flex items-center gap-1 ml-auto p-1 rounded-lg border border-zinc-800 bg-zinc-950/60">
                      <button
                        type="button"
                        onClick={() => setAgendaViewMode("table")}
                        className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                          agendaViewMode === "table" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                        title="Vista Lista"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgendaViewMode("timeline")}
                        className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                          agendaViewMode === "timeline" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                        title="Vista Horária / Timeline"
                      >
                        <Grid3X3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Status Tabs Filter & Sort Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: "all", label: "Todos" },
                      { id: "confirmed", label: "Confirmados" },
                      { id: "completed", label: "Concluídos" },
                      { id: "cancelled", label: "Cancelados" },
                      { id: "blocked", label: "Bloqueios" }
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setFilterStatus(st.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                          filterStatus === st.id
                            ? "bg-zinc-100 text-zinc-950 font-semibold"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 text-xs font-medium text-zinc-300 flex items-center gap-2 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {sortBy === "newest" ? "Recentes" : sortBy === "oldest" ? "Antigos" : sortBy === "price_desc" ? "Preço: Maior" : "Preço: Menor"}
                      </span>
                      <ChevronDown className="w-3 h-3 text-zinc-500" />
                    </button>

                    {isSortDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsSortDropdownOpen(false)} />
                        <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg p-1 shadow-2xl z-30 space-y-0.5 border border-zinc-800 bg-zinc-900 text-xs">
                          {[
                            { id: "newest", label: "Mais recentes primeiro" },
                            { id: "oldest", label: "Mais antigos primeiro" },
                            { id: "price_desc", label: "Preço: Maior primeiro" },
                            { id: "price_asc", label: "Preço: Menor primeiro" }
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.id);
                                setIsSortDropdownOpen(false);
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                                sortBy === opt.id ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Table View */}
              {agendaViewMode === "table" && (
                <div>
                  {isLoading ? (
                    <div className="py-20 text-center space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/30">
                      <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-zinc-400 font-mono">A carregar agendamentos...</p>
                    </div>
                  ) : sortedAndFilteredAppointments.length === 0 ? (
                    <div className="p-12 text-center space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/30">
                      <CalendarIcon className="w-8 h-8 text-zinc-500 mx-auto" />
                      <h3 className="text-sm font-semibold text-zinc-300">Nenhuma marcação encontrada</h3>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        {searchQuery ? "Nenhum resultado corresponde à pesquisa." : `Não existem marcações para ${formattedPortugueseDate}.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sortedAndFilteredAppointments.map((appt) => {
                        const isCancelled = appt.status === "cancelled";
                        const isCompleted = appt.status === "completed";
                        const isBlocked = appt.status === "blocked";

                        if (isBlocked) {
                          return (
                            <div
                              key={appt.id}
                              className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-semibold px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  {appt.time}
                                </span>
                                <div>
                                  <span className="font-semibold text-amber-300">
                                    {appt.customer_name}
                                  </span>
                                  <p className="text-[11px] text-zinc-400 mt-0.5">
                                    Duração: {appt.service_duration} min • Horário Bloqueado
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteAppointment(appt.id, true)}
                                className="px-2.5 py-1 rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium cursor-pointer"
                              >
                                Desbloquear
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={appt.id}
                            className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isCancelled
                                ? "bg-red-500/5 border-red-500/20 opacity-60"
                                : isCompleted
                                  ? "bg-zinc-900/30 border-zinc-800/80"
                                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                            }`}
                          >
                            {/* Time & Client Info */}
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <div className="font-mono text-center px-2.5 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 shrink-0">
                                <span className="text-xs font-bold text-zinc-100 block">
                                  {appt.time}
                                </span>
                                <span className="text-[9px] text-zinc-500 block">
                                  {appt.service_duration}m
                                </span>
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-xs sm:text-sm text-zinc-100 truncate">
                                    {appt.customer_name}
                                  </h4>
                                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                                    isCancelled
                                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                      : isCompleted
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                                  }`}>
                                    {isCancelled ? "Cancelado" : isCompleted ? "Concluído" : "Confirmado"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap">
                                  <span className="text-[#C6924B] font-medium">{appt.service_name}</span>
                                  <span>•</span>
                                  <span className="font-mono">{appt.customer_phone}</span>
                                  {appt.customer_notes && (
                                    <>
                                      <span>•</span>
                                      <span className="italic text-zinc-500 truncate max-w-[200px]">"{appt.customer_notes}"</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Price & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                              <span className="font-mono font-bold text-xs sm:text-sm text-zinc-100">
                                {appt.service_price}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {appt.customer_phone && (
                                  <a
                                    href={`https://wa.me/${appt.customer_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                      `Olá ${appt.customer_name}! Confirmamos o seu agendamento na Rota do Corte para ${appt.date} às ${appt.time} (${appt.service_name}). Até já!`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                    title="WhatsApp Direto"
                                  >
                                    <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                                  </a>
                                )}

                                {!isCompleted && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(appt.id, "completed")}
                                    className="p-1.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors cursor-pointer"
                                    title="Marcar como Concluído"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAppt(appt);
                                    setEditName(appt.customer_name || "");
                                    setEditPhone(appt.customer_phone || "");
                                    setEditDate(appt.date || selectedDate);
                                    setEditTime(appt.time || "10:00");
                                    setEditServiceId(appt.service_id || "corte-barba-terapia");
                                    setEditStatus(appt.status || "confirmed");
                                    setEditNotes(appt.customer_notes || "");
                                  }}
                                  className="p-1.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAppointment(appt.id)}
                                  className="p-1.5 rounded-md border border-zinc-800 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Schedule View */}
              {agendaViewMode === "timeline" && (
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <span className="text-xs font-medium text-zinc-400">
                      Grelha Horária • {formattedPortugueseDate}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Cadeiras: 1 (Gabriel Silva)
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                    {[
                      "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
                      "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
                      "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
                      "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
                    ].map((slotTime) => {
                      const match = dayAppointments.find((a) => a.time === slotTime && a.status !== "cancelled");
                      const isFree = !match;

                      return (
                        <div
                          key={slotTime}
                          className={`flex items-center gap-3 p-2 rounded-lg border text-xs transition-colors ${
                            match
                              ? match.status === "blocked"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                                : match.status === "completed"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-100"
                              : "bg-zinc-950/40 border-zinc-800/40 text-zinc-500 hover:border-zinc-700"
                          }`}
                        >
                          <span className="font-mono font-semibold w-12 shrink-0 text-zinc-400">
                            {slotTime}
                          </span>

                          {match ? (
                            <div className="flex-1 flex items-center justify-between truncate">
                              <span className="font-medium truncate">
                                {match.customer_name} ({match.service_name})
                              </span>
                              <span className="font-mono text-[11px] font-semibold">
                                {match.service_price}
                              </span>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-between text-zinc-600">
                              <span className="italic">Horário Livre</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setManualDate(selectedDate);
                                  setManualTime(slotTime);
                                  setIsNewModalOpen(true);
                                }}
                                className="text-[10px] text-zinc-400 hover:text-zinc-200 font-medium px-2 py-0.5 rounded border border-zinc-800"
                              >
                                + Marcar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FATURAÇÃO & MÉTRICAS                                               */}
          {/* ========================================================================= */}
          {activeTab === "stats" && (
            <div className="space-y-5 animate-fadeIn">
              {/* Controls & Quick Actions */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
              }`}>
                {/* Period Selector */}
                <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-800 bg-zinc-950/60 overflow-x-auto">
                  {[
                    { id: "today", label: "Hoje" },
                    { id: "week", label: "Semana" },
                    { id: "month", label: "Mês Atual" },
                    { id: "all", label: "Histórico Total" }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setStatsPeriod(p.id);
                        setSelectedDayKey(null);
                        setSelectedWeekKey(null);
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                        statsPeriod === p.id
                          ? "bg-zinc-100 text-zinc-950 font-semibold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDirectSaleModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>+ Venda Balcão</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar CSV</span>
                  </button>
                </div>
              </div>

              {/* Chart & Ranking Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Chart Card (8 cols) */}
                <div className={`lg:col-span-8 p-5 rounded-xl border space-y-4 ${
                  isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-zinc-100">
                          Evolução da Faturação
                        </h3>
                        {statsPeriod === "month" && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C6924B]/15 text-[#C6924B] border border-[#C6924B]/30 font-medium">
                            Setembro 2026
                          </span>
                        )}
                        {statsPeriod === "week" && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#C6924B]/15 text-[#C6924B] border border-[#C6924B]/30 font-medium">
                            Últimos 7 Dias
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {statsPeriod === "week"
                          ? "Rendimento diário nos últimos 7 dias com escala lateral em euros."
                          : "Rendimento diário detalhado com escala lateral em euros."}
                      </p>
                    </div>

                    <span className="font-mono font-bold text-base text-zinc-100">
                      {statsData.completedRevenue.toFixed(2)} €
                    </span>
                  </div>

                  {statsData.timelineData.length === 0 ? (
                    <div className="py-20 text-center text-xs text-zinc-500">
                      Sem dados de faturação suficientes para este período.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* SVG Timeline com Escala Lateral em Euros & Pontos com Valores */}
                      <div className="space-y-2">
                        <div className="w-full relative">
                          <svg
                            className="w-full h-52 overflow-visible"
                            viewBox={`0 0 ${statsData.chartW} ${statsData.chartH}`}
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <linearGradient id="zincRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#C6924B" stopOpacity="0.38" />
                                <stop offset="100%" stopColor="#C6924B" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Lateral Y-Axis Ticks & Horizontal Grid Lines */}
                            {statsData.yTicks.map((t, idx) => (
                              <g key={idx}>
                                <line
                                  x1={statsData.padL}
                                  y1={t.y}
                                  x2={statsData.chartW - statsData.padR}
                                  y2={t.y}
                                  stroke="currentColor"
                                  strokeDasharray={t.val === 0 ? "none" : "3 3"}
                                  strokeWidth={t.val === 0 ? "1.5" : "1"}
                                  className={t.val === 0 ? "text-zinc-700" : "text-zinc-800/80"}
                                />
                                <text
                                  x={statsData.padL - 10}
                                  y={t.y + 3.5}
                                  textAnchor="end"
                                  className="text-[10px] font-mono font-semibold fill-zinc-400"
                                >
                                  {t.label}
                                </text>
                              </g>
                            ))}

                            {/* Area fill */}
                            {statsData.chartAreaPath && (
                              <path d={statsData.chartAreaPath} fill="url(#zincRevenueGrad)" />
                            )}

                            {/* Stroke line */}
                            {statsData.chartSvgPath && (
                              <path
                                d={statsData.chartSvgPath}
                                fill="none"
                                stroke="#C6924B"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}

                            {/* Points with Value Labels */}
                            {statsData.chartPoints.map((pt, i) => {
                              const isSelected = selectedDayKey === pt.date;
                              return (
                                <g
                                  key={i}
                                  className="cursor-pointer group"
                                  onClick={() => {
                                    if (selectedDayKey === pt.date) {
                                      setSelectedDayKey(null);
                                    } else {
                                      setSelectedDayKey(pt.date);
                                      const wInfo = getWeekInfo(pt.date);
                                      setSelectedWeekKey(wInfo.weekKey);
                                    }
                                  }}
                                >
                                  {/* Value badge above point */}
                                  <text
                                    x={pt.x}
                                    y={pt.y - 9}
                                    textAnchor="middle"
                                    className={`text-[9px] font-mono font-bold transition-all ${
                                      isSelected ? "fill-amber-300 text-[10px]" : "fill-zinc-400 group-hover:fill-zinc-100"
                                    }`}
                                  >
                                    {pt.revenue.toFixed(0)}€
                                  </text>

                                  {/* Selection ring */}
                                  {isSelected && (
                                    <circle
                                      cx={pt.x}
                                      cy={pt.y}
                                      r="8"
                                      fill="none"
                                      stroke="#C6924B"
                                      strokeWidth="1.5"
                                      className="animate-ping opacity-75"
                                    />
                                  )}

                                  {/* Main point */}
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isSelected ? "5" : "3.5"}
                                    fill={isSelected ? "#F59E0B" : "#C6924B"}
                                    stroke="#18181B"
                                    strokeWidth="2"
                                    className="transition-transform group-hover:scale-125"
                                  />
                                </g>
                              );
                            })}
                          </svg>
                        </div>

                        {/* X-Axis Dates */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800 pl-12 pr-4">
                          {statsData.timelineData.map((d) => (
                            <button
                              key={d.date}
                              type="button"
                              onClick={() => {
                                if (selectedDayKey === d.date) {
                                  setSelectedDayKey(null);
                                } else {
                                  setSelectedDayKey(d.date);
                                  const wInfo = getWeekInfo(d.date);
                                  setSelectedWeekKey(wInfo.weekKey);
                                }
                              }}
                              className={`hover:text-zinc-200 transition-colors cursor-pointer ${
                                selectedDayKey === d.date ? "text-[#C6924B] font-bold underline" : ""
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Daily & Weekly Details: Organizado por Semana */}
                      {(() => {
                        const totalHistoryCount = statsData.allAppointmentsList?.length || 0;
                        const activeDayData = selectedDayKey ? statsData.dayDetailsMap[selectedDayKey] : null;
                        const activeWeekData = selectedWeekKey
                          ? statsData.weeksMap[selectedWeekKey]
                          : selectedDayKey
                            ? statsData.weeksMap[getWeekInfo(selectedDayKey).weekKey]
                            : null;

                        // Title, Subtitle and Stats
                        let sectionTitle = "📋 Histórico Semanal de Cortes";
                        let sectionSubtitle = "Organizado por semana com totais acumulados";
                        let sectionCount = statsData.completedCount;
                        let sectionRevenue = statsData.completedRevenue;

                        if (selectedDayKey) {
                          sectionTitle = `📅 Cortes do Dia ${selectedDayKey.substring(8)}/${selectedDayKey.substring(5, 7)}/${selectedDayKey.substring(0, 4)}`;
                          sectionSubtitle = activeWeekData ? `Integrado na ${activeWeekData.weekLabel}` : "Filtrado para o dia selecionado";
                          sectionCount = activeDayData?.completedCount ?? activeDayData?.count ?? activeDayData?.appointments?.length ?? 0;
                          sectionRevenue = activeDayData?.revenue || 0;
                        } else if (selectedWeekKey && activeWeekData) {
                          sectionTitle = `🗓️ ${activeWeekData.weekLabel}`;
                          sectionSubtitle = "Faturação e cortes desta semana";
                          sectionCount = activeWeekData.completedCount || activeWeekData.totalCount;
                          sectionRevenue = activeWeekData.revenue;
                        } else if (statsPeriod === "month") {
                          sectionTitle = "📋 Semanas do Mês Atual";
                          sectionSubtitle = "Resumo e cortes agrupados por semana";
                        } else if (statsPeriod === "week") {
                          sectionTitle = "📋 Cortes dos Últimos 7 Dias";
                          sectionSubtitle = "Detalhamento da semana atual";
                        } else if (statsPeriod === "today") {
                          sectionTitle = "📋 Cortes de Hoje";
                          sectionSubtitle = "Movimento registado hoje";
                        }

                        // Helper to render an appointment card
                        const renderApptCard = (appt, idx) => {
                          const isDirect = appt.source === "admin_direct_sale" || (appt.customer_notes && appt.customer_notes.includes("[Venda Balcão]"));
                          const dateFormatted = appt.date
                            ? `${appt.date.substring(8, 10)}/${appt.date.substring(5, 7)}`
                            : "";

                          return (
                            <div
                              key={appt.id || `${appt.date}-${appt.time}-${idx}`}
                              className="p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-2.5 hover:border-zinc-700/80 transition-colors"
                            >
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-xs text-zinc-100 truncate">
                                    {appt.customer_name || "Cliente"}
                                  </span>
                                  {dateFormatted && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                      📅 {dateFormatted}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-800">
                                    ⏰ {appt.time || "Horário livre"}
                                  </span>
                                  {isDirect && (
                                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                                      Balcão
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-400 truncate">
                                  {appt.service_name || "Serviço"}
                                </p>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  {appt.customer_phone || "Sem contacto"}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-xs text-[#C6924B] block">
                                  {appt.service_price}
                                </span>
                                {appt.status === "completed" ? (
                                  <span className="text-[9px] text-emerald-400 font-medium">
                                    Concluído
                                  </span>
                                ) : appt.status === "confirmed" ? (
                                  <span className="text-[9px] text-cyan-400 font-medium">
                                    Confirmado
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-zinc-500 font-medium">
                                    {appt.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        };

                        return (
                          <div className="mt-4 p-3.5 sm:p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-3">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-2.5 gap-2">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-[#C6924B] shrink-0" />
                                <div>
                                  <span className="font-semibold text-xs text-zinc-100 block">
                                    {sectionTitle}
                                  </span>
                                  <span className="text-[11px] text-zinc-500">
                                    {sectionSubtitle}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-2.5 text-xs bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800">
                                  <span className="font-mono text-zinc-400">
                                    {sectionCount} corte{sectionCount !== 1 ? "s" : ""}
                                  </span>
                                  <span className="font-mono font-bold text-sm text-[#C6924B]">
                                    {sectionRevenue.toFixed(2)} €
                                  </span>
                                </div>

                                {selectedDayKey && activeWeekData && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDayKey(null);
                                      setSelectedWeekKey(activeWeekData.weekKey);
                                    }}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#C6924B]/15 text-[#C6924B] border border-[#C6924B]/30 hover:bg-[#C6924B]/25 transition-colors cursor-pointer flex items-center gap-1"
                                    title="Ver todos os cortes desta semana"
                                  >
                                    <span>🗓️ Ver Semana ({activeWeekData.totalCount})</span>
                                  </button>
                                )}

                                {(selectedDayKey || selectedWeekKey) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDayKey(null);
                                      setSelectedWeekKey(null);
                                    }}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1"
                                    title="Ver todas as semanas"
                                  >
                                    <span>✕ Ver Todas as Semanas</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Weekly Filter Bar (Abas de Semanas) */}
                            {statsData.sortedWeeks?.length > 0 && (
                              <div className="space-y-1.5 pt-0.5">
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                                  <span className="text-zinc-500 font-mono text-[10px] shrink-0 mr-1">Semana:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedWeekKey(null);
                                      setSelectedDayKey(null);
                                    }}
                                    className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 font-medium ${
                                      !selectedWeekKey && !selectedDayKey
                                        ? "bg-[#C6924B] text-zinc-950 border-[#C6924B] font-semibold shadow-xs"
                                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                                    }`}
                                  >
                                    ✨ Todas as Semanas ({totalHistoryCount})
                                  </button>

                                  {statsData.sortedWeeks.map((w) => {
                                    const isCurrentWeek = selectedWeekKey === w.weekKey && !selectedDayKey;
                                    const isParentOfSelectedDay = selectedDayKey && activeWeekData?.weekKey === w.weekKey;

                                    return (
                                      <button
                                        key={w.weekKey}
                                        type="button"
                                        onClick={() => {
                                          if (selectedWeekKey === w.weekKey && !selectedDayKey) {
                                            setSelectedWeekKey(null);
                                          } else {
                                            setSelectedWeekKey(w.weekKey);
                                            setSelectedDayKey(null);
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer shrink-0 font-mono ${
                                          isCurrentWeek
                                            ? "bg-[#C6924B] text-zinc-950 border-[#C6924B] font-bold shadow-xs"
                                            : isParentOfSelectedDay
                                              ? "bg-[#C6924B]/20 text-[#C6924B] border-[#C6924B]/50 font-semibold"
                                              : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                                        }`}
                                      >
                                        🗓️ {w.shortLabel} ({w.revenue > 0 ? `${w.revenue.toFixed(0)}€` : `${w.totalCount}c`})
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Sub-bar: Days of Active Week (when a week or day is focused) */}
                                {activeWeekData && activeWeekData.dayKeys?.length > 1 && (
                                  <div className="flex items-center gap-1.5 overflow-x-auto pl-4 border-l-2 border-[#C6924B]/40 py-0.5 text-[10px]">
                                    <span className="text-zinc-500 font-mono shrink-0">Dias da semana:</span>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDayKey(null)}
                                      className={`px-2 py-0.5 rounded-md border transition-all cursor-pointer shrink-0 font-mono ${
                                        !selectedDayKey
                                          ? "bg-zinc-200 text-zinc-950 font-bold border-zinc-200"
                                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                      }`}
                                    >
                                      Semana Inteira ({activeWeekData.totalCount})
                                    </button>

                                    {activeWeekData.dayKeys.map((dKey) => {
                                      const isDaySelected = selectedDayKey === dKey;
                                      const dayRev = statsData.dayDetailsMap[dKey]?.revenue || 0;
                                      const dayCount = statsData.dayDetailsMap[dKey]?.count || 0;
                                      const parts = dKey.split("-");
                                      const dLabel = `${parts[2]}/${parts[1]}`;

                                      return (
                                        <button
                                          key={dKey}
                                          type="button"
                                          onClick={() => setSelectedDayKey(isDaySelected ? null : dKey)}
                                          className={`px-2 py-0.5 rounded-md border transition-all cursor-pointer shrink-0 font-mono ${
                                            isDaySelected
                                              ? "bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-xs"
                                              : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                                          }`}
                                        >
                                          {dLabel} ({dayRev > 0 ? `${dayRev.toFixed(0)}€` : `${dayCount}c`})
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Appointments Body */}
                            <div className="max-h-80 overflow-y-auto pr-1 space-y-4">
                              {/* CASE 1: Single day focused */}
                              {selectedDayKey ? (
                                !activeDayData || activeDayData.appointments.length === 0 ? (
                                  <div className="py-6 text-center text-xs text-zinc-500">
                                    Sem cortes registados neste dia.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {activeDayData.appointments.map(renderApptCard)}
                                  </div>
                                )
                              ) : selectedWeekKey && activeWeekData ? (
                                /* CASE 2: Single week focused */
                                activeWeekData.appointments.length === 0 ? (
                                  <div className="py-6 text-center text-xs text-zinc-500">
                                    Sem cortes registados nesta semana.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {activeWeekData.appointments.map(renderApptCard)}
                                  </div>
                                )
                              ) : (
                                /* CASE 3: All weeks grouped */
                                !statsData.sortedWeeks || statsData.sortedWeeks.length === 0 ? (
                                  <div className="py-6 text-center text-xs text-zinc-500">
                                    Sem marcações para o período selecionado.
                                  </div>
                                ) : (
                                  statsData.sortedWeeks.map((wk) => (
                                    <div key={wk.weekKey} className="space-y-2">
                                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
                                        <div className="flex items-center gap-2">
                                          <CalendarDays className="w-3.5 h-3.5 text-[#C6924B]" />
                                          <span className="font-semibold text-zinc-200">
                                            {wk.weekLabel}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 font-mono text-[11px]">
                                          <span className="text-zinc-400">
                                            {wk.completedCount || wk.totalCount} corte{(wk.completedCount || wk.totalCount) !== 1 ? "s" : ""}
                                          </span>
                                          <span className="text-[#C6924B] font-bold">
                                            {wk.revenue.toFixed(2)} €
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedWeekKey(wk.weekKey);
                                              setSelectedDayKey(null);
                                            }}
                                            className="text-[10px] text-[#C6924B] hover:text-amber-300 font-medium underline ml-1 cursor-pointer"
                                          >
                                            Ver Semana
                                          </button>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                                        {wk.appointments.map(renderApptCard)}
                                      </div>
                                    </div>
                                  ))
                                )
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Gráfico de Pizza / Donut Interativo: Dias Mais Ativos & Mix de Serviços */}
                <div className={`lg:col-span-4 p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
                  isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
                }`}>
                  {/* Top Bar: Title & Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
                        <span>{pieChartMode === "days" ? "Dias Mais Ativos" : "Mix de Serviços"}</span>
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {pieChartMode === "days" ? "Distribuição Semanal (Seg – Sáb)" : "Composição de Faturação"}
                      </p>
                    </div>

                    {/* Mode Toggle: Dias vs Serviços */}
                    <div className="flex items-center p-0.5 rounded-lg border border-zinc-800 bg-zinc-950/80">
                      <button
                        type="button"
                        onClick={() => {
                          setPieChartMode("days");
                          setHoveredPieIndex(null);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                          pieChartMode === "days"
                            ? "bg-[#C6924B] text-zinc-950 font-bold shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Dias
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPieChartMode("services");
                          setHoveredPieIndex(null);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                          pieChartMode === "services"
                            ? "bg-[#C6924B] text-zinc-950 font-bold shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        Serviços
                      </button>
                    </div>
                  </div>

                  {/* Donut Chart Canvas & Dynamic Center */}
                  {(() => {
                    const activeSlices = pieChartMode === "days" ? statsData.daysDonutSlices : statsData.servicesDonutSlices;
                    const hasData = pieChartMode === "days" ? statsData.totalDaysCount > 0 : statsData.serviceRanking.length > 0;
                    const hoveredItem = hoveredPieIndex !== null ? activeSlices.find((s) => s.index === hoveredPieIndex) : null;

                    return (
                      <div className="relative flex flex-col items-center justify-center my-1">
                        <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
                          {!hasData ? (
                            <svg viewBox="0 0 200 200" className="w-full h-full">
                              <circle
                                cx="100"
                                cy="100"
                                r="65"
                                fill="none"
                                stroke={isLight ? "#e4e4e7" : "#27272a"}
                                strokeWidth="24"
                                strokeDasharray="4 4"
                              />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                              {activeSlices.map((slice) => {
                                if (!slice.slicePct || slice.slicePct <= 0) return null;
                                const isHovered = hoveredPieIndex === slice.index;
                                const pathD = describeDonutSlice(
                                  100,
                                  100,
                                  isHovered ? 82 : 78,
                                  isHovered ? 48 : 52,
                                  slice.startAngle,
                                  slice.endAngle
                                );
                                return (
                                  <path
                                    key={slice.label}
                                    d={pathD}
                                    fill={slice.color}
                                    stroke={isLight ? "#ffffff" : "#18181b"}
                                    strokeWidth="2.5"
                                    strokeLinejoin="round"
                                    className="cursor-pointer transition-all duration-200"
                                    style={{
                                      opacity: hoveredPieIndex === null ? 1 : isHovered ? 1 : 0.4,
                                      filter: isHovered ? "drop-shadow(0 0 6px rgba(198,146,75,0.45))" : "none"
                                    }}
                                    onMouseEnter={() => setHoveredPieIndex(slice.index)}
                                    onMouseLeave={() => setHoveredPieIndex(null)}
                                  />
                                );
                              })}
                            </svg>
                          )}

                          {/* Dynamic Center Badge */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2 select-none">
                            {!hasData ? (
                              <>
                                <span className="text-xs text-zinc-500 font-medium">Sem dados</span>
                                <span className="text-[10px] text-zinc-600">no período</span>
                              </>
                            ) : hoveredItem ? (
                              <div className="flex flex-col items-center animate-fadeIn">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 truncate max-w-[100px]">
                                  {hoveredItem.fullName || hoveredItem.label}
                                </span>
                                <span className="text-base font-extrabold text-zinc-100 font-mono tracking-tight">
                                  {pieChartMode === "days" ? `${hoveredItem.count} cortes` : `${hoveredItem.revenue.toFixed(0)} €`}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400">
                                  {hoveredItem.percent}% • {hoveredItem.revenue.toFixed(0)} €
                                </span>
                              </div>
                            ) : pieChartMode === "days" ? (
                              <div className="flex flex-col items-center animate-fadeIn">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#C6924B]">
                                  Top Dia
                                </span>
                                <span className="text-sm font-extrabold text-zinc-100">
                                  {statsData.peakDay.name}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400">
                                  {statsData.peakDay.count} cortes ({statsData.peakDay.percent}%)
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center animate-fadeIn">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#C6924B]">
                                  Top Serviço
                                </span>
                                <span className="text-xs font-extrabold text-zinc-100 truncate max-w-[90px]">
                                  {statsData.serviceRanking[0]?.name || "N/A"}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400">
                                  {(statsData.serviceRanking[0]?.revenue || 0).toFixed(0)} € ({statsData.serviceRanking[0]?.percent || 0}%)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive Legend Grid */}
                        <div className="w-full mt-3">
                          {pieChartMode === "days" ? (
                            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-zinc-800/60">
                              {statsData.daysDonutSlices.map((d) => {
                                const isHovered = hoveredPieIndex === d.index;
                                return (
                                  <div
                                    key={d.label}
                                    onMouseEnter={() => setHoveredPieIndex(d.index)}
                                    onMouseLeave={() => setHoveredPieIndex(null)}
                                    className={`flex items-center justify-between p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                                      isHovered
                                        ? "border-[#C6924B]/50 bg-zinc-800/80 shadow-sm"
                                        : isLight
                                        ? "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                                        : "border-zinc-800/40 bg-zinc-950/40 hover:bg-zinc-800/40"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: d.color }}
                                      />
                                      <span className={`text-[11px] font-medium truncate ${isHovered ? "text-[#C6924B] font-semibold" : "text-zinc-300"}`}>
                                        {d.label}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-1">
                                      {d.count} <span className="text-zinc-500">({d.percent}%)</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar pt-2 border-t border-zinc-800/60">
                              {statsData.servicesDonutSlices.map((s) => {
                                const isHovered = hoveredPieIndex === s.index;
                                return (
                                  <div
                                    key={s.label}
                                    onMouseEnter={() => setHoveredPieIndex(s.index)}
                                    onMouseLeave={() => setHoveredPieIndex(null)}
                                    className={`flex items-center justify-between p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                                      isHovered
                                        ? "border-[#C6924B]/50 bg-zinc-800/80 shadow-sm"
                                        : isLight
                                        ? "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                                        : "border-zinc-800/40 bg-zinc-950/40 hover:bg-zinc-800/40"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: s.color }}
                                      />
                                      <span className={`text-[11px] font-medium truncate ${isHovered ? "text-[#C6924B] font-semibold" : "text-zinc-300"}`}>
                                        {s.label}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-1">
                                      {s.revenue.toFixed(0)} € <span className="text-zinc-500">({s.percent}%)</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bottom Highlight Banner */}
                  <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    isLight ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950/60 border-zinc-800"
                  }`}>
                    {pieChartMode === "days" ? (
                      <>
                        <div className="min-w-0 pr-2">
                          <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-medium">Dia Mais Ativo</span>
                          <strong className="text-zinc-100 font-semibold truncate block">
                            {statsData.peakDay.fullName || statsData.peakDay.name}
                          </strong>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-zinc-200 font-bold font-mono text-xs">
                            {statsData.peakDay.count} cortes
                          </span>
                          <p className="text-[11px] text-[#C6924B] font-mono">
                            {statsData.peakDay.revenue.toFixed(2)} € ({statsData.peakDay.percent}%)
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0 pr-2">
                          <span className="text-zinc-500 text-[10px] uppercase tracking-wider block font-medium">Serviço Principal</span>
                          <strong className="text-zinc-100 font-semibold truncate block">
                            {statsData.serviceRanking[0]?.name || "N/A"}
                          </strong>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-zinc-200 font-bold font-mono text-xs">
                            {(statsData.serviceRanking[0]?.revenue || 0).toFixed(2)} €
                          </span>
                          <p className="text-[11px] text-[#C6924B] font-mono">
                            {statsData.serviceRanking[0]?.count || 0} cortes ({statsData.serviceRanking[0]?.percent || 0}%)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: BASE DE CLIENTES / MINI-CRM                                        */}
          {/* ========================================================================= */}
          {activeTab === "crm" && (
            <div className="space-y-4 animate-fadeIn">
              {/* CRM Top Controls */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
              }`}>
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Pesquisar cliente por nome ou contacto..."
                    value={crmSearchQuery}
                    onChange={(e) => setCrmSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-800 bg-zinc-950/60">
                  {[
                    { id: "all", label: `Todos (${crmCounts.all})` },
                    { id: "active", label: `Ativos (${crmCounts.active})` },
                    { id: "archived", label: `Arquivados (${crmCounts.archived})` }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCrmFilter(f.id)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        crmFilter === f.id ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CRM Clients List */}
              {crmClients.length === 0 ? (
                <div className="p-12 text-center space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <Users className="w-8 h-8 text-zinc-500 mx-auto" />
                  <h3 className="text-sm font-semibold text-zinc-300">Nenhum cliente encontrado</h3>
                  <p className="text-xs text-zinc-500">Ajuste os filtros de pesquisa.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {crmClients.map((client) => (
                    <div
                      key={client.key}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        client.isArchived
                          ? "bg-zinc-950/40 border-zinc-900 opacity-60"
                          : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-xs sm:text-sm text-zinc-100 truncate">
                              {client.name}
                            </h4>
                            {client.isVip && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-[#C6924B]/10 text-[#C6924B] border border-[#C6924B]/30 font-semibold">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-xs text-zinc-400 mt-0.5">
                            {client.phone || "Sem contacto telefónico"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleArchiveToggle(client.key)}
                          className="p-1.5 rounded-md border border-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                          title={client.isArchived ? "Desarquivar Cliente" : "Arquivar Cliente"}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/60 text-center">
                        <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                          <span className="text-[10px] text-zinc-500 block">Total Gasto</span>
                          <span className="font-mono font-bold text-xs text-zinc-100 block">
                            {client.totalSpent.toFixed(2)} €
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                          <span className="text-[10px] text-zinc-500 block">Visitas</span>
                          <span className="font-mono font-bold text-xs text-zinc-100 block">
                            {client.totalBookings}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                          <span className="text-[10px] text-zinc-500 block">Ticket Médio</span>
                          <span className="font-mono font-bold text-xs text-zinc-100 block">
                            {client.avgTicket.toFixed(2)} €
                          </span>
                        </div>
                      </div>

                      {client.phone && (
                        <a
                          href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Olá ${client.name}! Como tem passado? Esperamos voltar a vê-lo em breve na Rota do Corte!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                          <span>Contactar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PAUSAS & BLOQUEIOS                                                 */}
          {/* ========================================================================= */}
          {activeTab === "blocks" && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                isLight ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-800"
              }`}>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100">
                    Gestão de Pausas e Folgas
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Bloqueie horários ou dias inteiros para impedir marcações públicas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Bloqueio</span>
                </button>
              </div>

              {allAppointments.filter((a) => a.status === "blocked").length === 0 ? (
                <div className="p-12 text-center space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <Lock className="w-8 h-8 text-zinc-500 mx-auto" />
                  <h3 className="text-sm font-semibold text-zinc-300">Sem horários bloqueados</h3>
                  <p className="text-xs text-zinc-500">Todos os horários estão livres para marcações.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allAppointments
                    .filter((a) => a.status === "blocked")
                    .map((block) => (
                      <div
                        key={block.id}
                        className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {block.date} às {block.time}
                          </span>
                          <div>
                            <span className="font-semibold text-amber-300">
                              {block.customer_name}
                            </span>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              Duração: {block.service_duration} min
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAppointment(block.id, true)}
                          className="px-2.5 py-1 rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium cursor-pointer"
                        >
                          Remover Bloqueio
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* SHADCN DIALOG: NOVA MARCAÇÃO MANUAL                                       */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsNewModalOpen(false)}
        >
          <div
            className={`relative max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 my-auto border ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800 text-zinc-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold tracking-tight">Nova Marcação Manual</h3>
                <p className="text-xs text-zinc-400">Registo direto pelo barbeiro</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: André Simões"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Contacto / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 912 345 678"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Data *</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Horário *</label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Serviço *</label>
                <select
                  value={manualServiceId}
                  onChange={(e) => setManualServiceId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                >
                  {servicesData.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.priceFormatted})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Notas / Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Corte clássico sem barba"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingManual ? "A registar..." : "Registar Marcação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHADCN DIALOG: EDITAR MARCAÇÃO                                            */}
      {/* ========================================================================= */}
      {editingAppt && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditingAppt(null)}
        >
          <div
            className={`relative max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 my-auto border ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800 text-zinc-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold tracking-tight">Editar Marcação</h3>
                <p className="text-xs text-zinc-400">Altere horário, estado ou serviço</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAppt(null)}
                className="p-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Nome *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Telemóvel *</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Data *</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Horário *</label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Serviço *</label>
                  <select
                    value={editServiceId}
                    onChange={(e) => setEditServiceId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  >
                    {servicesData.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.priceFormatted})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Estado *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  >
                    <option value="confirmed">Confirmado</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Notas</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleDeleteAppointment(editingAppt.id)}
                  className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium"
                >
                  Eliminar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAppt(null)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSavingEdit ? "A guardar..." : "Guardar Alterações"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHADCN DIALOG: BLOQUEAR HORÁRIO / PAUSA                                   */}
      {/* ========================================================================= */}
      {isBlockModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsBlockModalOpen(false)}
        >
          <div
            className={`relative max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 my-auto border ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800 text-zinc-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-semibold tracking-tight">Bloquear Horário / Pausa</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="p-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              O horário selecionado ficará indisponível para marcações online de clientes.
            </p>

            <form onSubmit={handleCreateBlock} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Data *</label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Hora Início *</label>
                  <input
                    type="time"
                    required
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Hora Fim *</label>
                  <input
                    type="time"
                    required
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Motivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pausa de Almoço / Formação"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlock}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingBlock ? "A bloquear..." : "Confirmar Bloqueio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHADCN DIALOG: REGISTAR VENDA BALCÃO / FATURAÇÃO DIRETA                   */}
      {/* ========================================================================= */}
      {isDirectSaleModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsDirectSaleModalOpen(false)}
        >
          <div
            className={`relative max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 my-auto border ${
              isLight ? "bg-white border-zinc-200" : "bg-zinc-950 border-zinc-800 text-zinc-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#C6924B]" />
                <h3 className="text-base font-semibold tracking-tight">Registar Venda Balcão</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectSaleModalOpen(false)}
                className="p-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Faturação para clientes diretos sem marcação prévia. O valor fica registado no Livro de Faturação.
            </p>

            <form onSubmit={handleSaveDirectSale} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pedro Santos / Cliente Balcão"
                  value={directSaleCustomer}
                  onChange={(e) => setDirectSaleCustomer(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Telemóvel (Opcional)</label>
                <input
                  type="tel"
                  placeholder="Ex: 9XXXXXXXX"
                  value={directSalePhone}
                  onChange={(e) => setDirectSalePhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Data *</label>
                  <input
                    type="date"
                    required
                    value={directSaleDate}
                    onChange={(e) => setDirectSaleDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Hora</label>
                  <input
                    type="time"
                    value={directSaleTime}
                    onChange={(e) => setDirectSaleTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Serviço *</label>
                  <select
                    value={directSaleService}
                    onChange={(e) => {
                      setDirectSaleService(e.target.value);
                      const matched = servicesData.find((s) => s.name === e.target.value);
                      if (matched && matched.price) {
                        setDirectSalePrice(parseLedgerPrice(matched.price).toFixed(2));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                  >
                    {servicesData.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.price})
                      </option>
                    ))}
                    <option value="Outro Serviço">Outro Serviço</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">Valor Cobrado (€) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      value={directSalePrice}
                      onChange={(e) => setDirectSalePrice(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">
                      €
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Numerário / MBWay"
                  value={directSaleNotes}
                  onChange={(e) => setDirectSaleNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDirectSaleModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingDirectSale}
                  className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingDirectSale ? "A registar..." : "Registar Faturação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
