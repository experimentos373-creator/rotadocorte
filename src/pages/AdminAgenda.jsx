import { useState, useEffect, useMemo } from "react";
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
  Euro,
  Lock,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Scissors,
  Check,
  AlertCircle,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Pencil,
  Trash2,
  BarChart3,
  Users,
  Award,
  Flame,
  Coffee,
  PieChart,
  ArrowUpRight,
  ShieldAlert,
  DollarSign,
  Percent,
  CalendarDays,
  Sunrise,
  Sun,
  Moon,
  Lightbulb,
  Star,
  Eye,
  EyeOff,
  LogOut,
  KeyRound,
  ShieldCheck
} from "lucide-react";
import { WhatsAppIcon } from "../components/WhatsAppButton";
import {
  getLocalAppointments,
  saveLocalAppointments,
  updateAppointment,
  deleteAppointment,
  getAllAppointments,
  createBlockSlot,
  verifyAdminPin,
  isSupabaseConfigured,
  supabase
} from "../lib/supabase";
import { servicesData, shopInfo } from "../data/services";

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

  // Navigation Tabs: 'agenda' | 'stats' | 'crm'
  const [activeTab, setActiveTab] = useState("agenda");

  // Selected Date for Agenda View
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Global & Day Appointments
  const [allAppointments, setAllAppointments] = useState([]);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Scope: 'all' (Todas as Marcações) | 'day' (Agenda do Dia Selecionado)
  const [agendaScope, setAgendaScope] = useState("all");

  // Sorting Mode: 'newest' | 'oldest' | 'price_desc' | 'price_asc'
  const [sortBy, setSortBy] = useState("newest");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [crmSearchQuery, setCrmSearchQuery] = useState("");

  // Stats Period Selector: 'today' | 'week' | 'month' | '30days' | 'all'
  const [statsPeriod, setStatsPeriod] = useState("month");

  // Modal: New Manual Appointment
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualTime, setManualTime] = useState("11:00");
  const [manualServiceId, setManualServiceId] = useState("corte-barba-terapia");
  const [manualNotes, setManualNotes] = useState("");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);

  // Modal: Edit Appointment
  const [editingAppt, setEditingAppt] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editServiceId, setEditServiceId] = useState("");
  const [editStatus, setEditStatus] = useState("confirmed");
  const [editNotes, setEditNotes] = useState("");
  const [isEditTimeDropdownOpen, setIsEditTimeDropdownOpen] = useState(false);
  const [isEditServiceDropdownOpen, setIsEditServiceDropdownOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal: Block Slot (Time Off / Pausa / Ausência)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split("T")[0]);
  const [blockStartTime, setBlockStartTime] = useState("13:00");
  const [blockEndTime, setBlockEndTime] = useState("14:30");
  const [blockReason, setBlockReason] = useState("Pausa de Almoço");
  const [isBlockStartDropdownOpen, setIsBlockStartDropdownOpen] = useState(false);
  const [isBlockEndDropdownOpen, setIsBlockEndDropdownOpen] = useState(false);
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

  // Load All Appointments (Both for Day View, Multi-Period Stats & CRM)
  const loadAppointments = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    const data = await getAllAppointments(currentAdminPin);
    setAllAppointments(data || []);

    // Filter day appointments
    const forDay = (data || []).filter((a) => a.date === selectedDate);
    forDay.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    setDayAppointments(forDay);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAppointments();
    }
  }, [selectedDate, isAuthenticated, currentAdminPin]);

  // Lock background scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isNewModalOpen || editingAppt || isBlockModalOpen;
    if (isAnyModalOpen) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isNewModalOpen, editingAppt, isBlockModalOpen]);

  const changeDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // Status Updater
  const handleUpdateStatus = async (id, newStatus) => {
    await updateAppointment(id, { status: newStatus });
    await loadAppointments();
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAppt) return;
    setIsSavingEdit(true);

    const res = await updateAppointment(editingAppt.id, {
      customer_name: editName.trim(),
      customer_phone: editPhone.trim(),
      date: editDate,
      time: editTime,
      service_id: editServiceId,
      status: editStatus,
      customer_notes: editNotes.trim()
    });

    setIsSavingEdit(false);
    if (res.success) {
      if (editDate !== selectedDate) {
        setSelectedDate(editDate);
      }
      await loadAppointments();
      setEditingAppt(null);
    }
  };

  // Delete / Unblock
  const handleDeleteAppointment = async (id, isBlock = false) => {
    const msg = isBlock
      ? "Deseja desbloquear e libertar este horário?"
      : "Deseja eliminar esta marcação permanentemente?";
    if (window.confirm(msg)) {
      await deleteAppointment(id);
      setEditingAppt(null);
      await loadAppointments();
    }
  };

  // Open Edit Modal
  const openEditModal = (appt) => {
    setEditingAppt(appt);
    setEditName(appt.customer_name || "");
    setEditPhone(appt.customer_phone || "");
    setEditDate(appt.date || selectedDate);
    setEditTime(appt.time || "10:30");
    const matchedService =
      servicesData.find(
        (s) =>
          s.name?.toLowerCase() === appt.service_name?.toLowerCase() ||
          s.id === appt.service_id
      ) || servicesData[3];
    setEditServiceId(matchedService.id);
    setEditStatus(appt.status || "confirmed");
    setEditNotes(appt.customer_notes || "");
    setIsEditTimeDropdownOpen(false);
    setIsEditServiceDropdownOpen(false);
  };

  // Create Manual Appointment
  const handleCreateManual = (e) => {
    e.preventDefault();
    const s = servicesData.find((item) => item.id === manualServiceId) || servicesData[3];
    const newAppt = {
      id: "manual-" + Date.now(),
      shop_name: shopInfo.name,
      shop_phone: shopInfo.phone,
      service_id: manualServiceId,
      service_name: s.name,
      service_price: s.priceFormatted,
      service_duration: parseInt(s.duration, 10) || 30,
      barber_name: "Gabriel Silva",
      customer_name: manualName.trim(),
      customer_phone: manualPhone.trim(),
      customer_notes: manualNotes.trim(),
      date: selectedDate,
      time: manualTime,
      status: "confirmed",
      created_at: new Date().toISOString()
    };

    const all = getLocalAppointments();
    all.push(newAppt);
    saveLocalAppointments(all);

    setIsNewModalOpen(false);
    setManualName("");
    setManualPhone("");
    setManualNotes("");
    loadAppointments();
  };

  // Create Block Slot (Time Off)
  const handleCreateBlock = async (e) => {
    e.preventDefault();
    setIsSavingBlock(true);
    await createBlockSlot({
      date: blockDate,
      startTime: blockStartTime,
      endTime: blockEndTime,
      reason: blockReason
    });
    setIsSavingBlock(false);
    setIsBlockModalOpen(false);
    if (blockDate === selectedDate) {
      await loadAppointments();
    } else {
      setSelectedDate(blockDate);
    }
  };

  // Active list based on scope (all or day)
  const currentScopeList = agendaScope === "day" ? dayAppointments : allAppointments;

  // Metrics for Current Scope
  const scopeActive = currentScopeList.filter((a) => a.status !== "cancelled" && a.status !== "blocked");
  const scopeConfirmed = currentScopeList.filter((a) => a.status === "confirmed");
  const scopeCompleted = currentScopeList.filter((a) => a.status === "completed");
  const scopeCompletedRevenue = scopeCompleted.reduce((acc, curr) => acc + parsePrice(curr.service_price), 0);
  const scopeEstimatedRevenue = scopeActive.reduce((acc, curr) => acc + parsePrice(curr.service_price), 0);

  // Filtered & Sorted Appointments List
  const sortedAndFilteredAppointments = useMemo(() => {
    const sourceList = agendaScope === "day" ? dayAppointments : allAppointments;

    const filtered = sourceList.filter((a) => {
      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "blocked"
            ? a.status === "blocked"
            : a.status === filterStatus;

      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        a.customer_name?.toLowerCase().includes(query) ||
        a.customer_phone?.includes(query) ||
        a.service_name?.toLowerCase().includes(query) ||
        a.customer_notes?.toLowerCase().includes(query) ||
        a.date?.includes(query);

      return matchesStatus && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") {
        // Most recent first
        const timeA = new Date(a.start_time || `${a.date || "2000-01-01"}T${a.time || "00:00"}:00`).getTime() || 0;
        const timeB = new Date(b.start_time || `${b.date || "2000-01-01"}T${b.time || "00:00"}:00`).getTime() || 0;
        return timeB - timeA;
      }
      if (sortBy === "oldest") {
        // Oldest first
        const timeA = new Date(a.start_time || `${a.date || "2000-01-01"}T${a.time || "00:00"}:00`).getTime() || 0;
        const timeB = new Date(b.start_time || `${b.date || "2000-01-01"}T${b.time || "00:00"}:00`).getTime() || 0;
        return timeA - timeB;
      }
      if (sortBy === "price_desc") {
        // Highest price first
        return parsePrice(b.service_price) - parsePrice(a.service_price);
      }
      if (sortBy === "price_asc") {
        // Lowest price first
        return parsePrice(a.service_price) - parsePrice(b.service_price);
      }
      return 0;
    });
  }, [agendaScope, dayAppointments, allAppointments, filterStatus, searchQuery, sortBy]);

  // =========================================================================
  // MULTI-PERIOD STATS CALCULATIONS (FASE 1 & FASE 2)
  // =========================================================================
  const statsData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Get Start of Current Week (Monday)
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    // Filter by period
    const filtered = allAppointments.filter((a) => {
      if (!a.date) return false;
      const apptDate = new Date(a.date);

      if (statsPeriod === "today") {
        return a.date === todayStr;
      }
      if (statsPeriod === "week") {
        return apptDate >= monday && apptDate <= now;
      }
      if (statsPeriod === "month") {
        return (
          apptDate.getFullYear() === now.getFullYear() &&
          apptDate.getMonth() === now.getMonth()
        );
      }
      if (statsPeriod === "30days") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return apptDate >= thirtyDaysAgo;
      }
      return true; // 'all'
    });

    const nonBlocked = filtered.filter((a) => a.status !== "blocked");
    const completed = filtered.filter((a) => a.status === "completed");
    const confirmed = filtered.filter((a) => a.status === "confirmed");
    const cancelled = filtered.filter((a) => a.status === "cancelled");
    const active = filtered.filter((a) => a.status !== "cancelled" && a.status !== "blocked");

    const completedRev = completed.reduce((acc, c) => acc + parsePrice(c.service_price), 0);
    const estimatedRev = active.reduce((acc, c) => acc + parsePrice(c.service_price), 0);

    // Unique Clients Count in Period
    const uniqueClientsInPeriod = new Set(
      nonBlocked
        .map((a) => (a.customer_phone || a.customer_name || "").trim())
        .filter((k) => k && k !== "---")
    );
    const uniqueClientsCount = uniqueClientsInPeriod.size || nonBlocked.length;

    // Ticket Médio (€)
    const avgTicket = completed.length > 0 ? completedRev / completed.length : active.length > 0 ? estimatedRev / active.length : 0;

    // Taxa de Conclusão / Comparecimento (%)
    const totalFinishedOrCancelled = completed.length + cancelled.length;
    const completionRate = totalFinishedOrCancelled > 0 ? Math.round((completed.length / totalFinishedOrCancelled) * 100) : 100;

    // Service Breakdown & Ranking
    const serviceMap = {};
    active.forEach((a) => {
      const sName = a.service_name || "Outro Serviço";
      const price = parsePrice(a.service_price);
      if (!serviceMap[sName]) {
        serviceMap[sName] = { name: sName, count: 0, revenue: 0 };
      }
      serviceMap[sName].count += 1;
      serviceMap[sName].revenue += price;
    });

    const serviceRanking = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);
    const maxServiceRevenue = serviceRanking.reduce((max, s) => Math.max(max, s.revenue), 1);

    // Peak Hours Breakdown
    let morningCount = 0; // 10:00 - 13:00
    let afternoonCount = 0; // 14:00 - 17:00
    let eveningCount = 0; // 17:00 - 22:00

    active.forEach((a) => {
      const h = parseInt((a.time || "10:00").split(":")[0], 10);
      if (h < 13) morningCount++;
      else if (h < 17) afternoonCount++;
      else eveningCount++;
    });

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
      serviceRanking,
      maxServiceRevenue,
      peakHours: {
        morning: morningCount,
        afternoon: afternoonCount,
        evening: eveningCount,
        total: active.length || 1
      }
    };
  }, [allAppointments, statsPeriod]);

  // =========================================================================
  // MINI-CRM AGGREGATION (FASE 4)
  // =========================================================================
  const crmClients = useMemo(() => {
    const map = {};

    allAppointments.forEach((a) => {
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
      // Find favorite service
      let favService = "Corte Clássico";
      let maxCount = 0;
      Object.entries(c.servicesUsed).forEach(([s, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favService = s;
        }
      });

      return {
        ...c,
        avgTicket: c.completedBookings > 0 ? c.totalSpent / c.completedBookings : 0,
        favService,
        isVip: c.totalBookings >= 3
      };
    });

    list.sort((a, b) => b.totalBookings - a.totalBookings || b.totalSpent - a.totalSpent);

    const query = crmSearchQuery.toLowerCase().trim();
    if (!query) return list;

    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.favService.toLowerCase().includes(query)
    );
  }, [allAppointments, crmSearchQuery]);

  const formattedPortugueseDate = new Date(selectedDate).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // 🔒 Lock Screen View when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07080A] text-[#FAF8F5] flex flex-col items-center justify-center p-4 selection:bg-[#C89B58] selection:text-black font-sans relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C89B58]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#121318] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#C89B58]/10 border border-[#C89B58]/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(200,155,88,0.15)]">
              <KeyRound className="w-8 h-8 text-[#E5C268]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C89B58]/15 border border-[#C89B58]/30 text-[#E5C268] text-[11px] font-mono uppercase tracking-wider font-bold">
              <ShieldCheck className="w-3 h-3" />
              <span>Painel Administrativo</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white pt-1">
              Acesso do Barbeiro
            </h1>
            <p className="text-xs text-[#9E9EA7] leading-relaxed">
              Introduza a senha ou PIN de segurança para aceder à agenda, faturação e dados de clientes.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#C5C3BC] uppercase tracking-wider">
                Senha / Código PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    if (pinError) setPinError("");
                  }}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full bg-[#0A0B0E] border border-white/15 focus:border-[#C89B58] rounded-xl px-4 py-3.5 text-center text-lg sm:text-xl tracking-widest text-white placeholder:text-white/20 placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-[#C89B58] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E9EA7] hover:text-white transition-colors cursor-pointer p-1"
                  title={showPin ? "Ocultar senha" : "Ver senha"}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-xs text-red-400 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifyingPin}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C89B58] to-[#E5C268] text-black font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-[#C89B58]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifyingPin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>A verificar...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Entrar no Painel</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="pt-2 text-center border-t border-white/5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#9E9EA7] hover:text-[#E5C268] transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Voltar ao Website Principal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#FAF8F5] p-4 sm:p-8 selection:bg-[#C89B58] selection:text-black pt-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Studio System Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#9E9EA7] hover:text-[#E5C268] transition-colors mb-1 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Voltar ao Website Oficial</span>
            </Link>

            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Painel do Barbeiro
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold bg-[#C89B58]/20 text-[#E5C268] border border-[#C89B58]/35">
                Rota Do Corte OS
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#9E9EA7] pt-0.5">
              <span>Gabriel Silva • Paião</span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isSupabaseConfigured ? "Supabase Live Sync" : "Armazenamento Seguro Ativo"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={loadAppointments}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[#9E9EA7] hover:text-white transition-colors cursor-pointer"
              title="Atualizar Dados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* Quick Time Off Block Button */}
            <button
              type="button"
              onClick={() => {
                setBlockDate(selectedDate);
                setIsBlockModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Bloquear Horário / Pausa"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear Horário</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Terminar Sessão de Administrador"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>

            {/* New Manual Appointment Button */}
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="btn-pill-gold px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#C89B58]/15 hover:scale-[1.02] transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Marcar Cliente</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN NAVIGATION TABS                                                      */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 p-1.5 bg-[#111319] border border-white/10 rounded-2xl overflow-x-auto shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab("agenda")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "agenda"
                ? "bg-[#C89B58] text-black shadow-lg shadow-[#C89B58]/25 font-black scale-[1.01]"
                : "text-[#9E9EA7] hover:text-white hover:bg-white/5"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Agenda & Slots Diários</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === "agenda" ? "bg-black/20 text-black" : "bg-white/10 text-white"
            }`}>
              {dayAppointments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "stats"
                ? "bg-[#C89B58] text-black shadow-lg shadow-[#C89B58]/25 font-black scale-[1.01]"
                : "text-[#9E9EA7] hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estatísticas & Rentabilidade</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Multi-Período
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("crm")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "crm"
                ? "bg-[#C89B58] text-black shadow-lg shadow-[#C89B58]/25 font-black scale-[1.01]"
                : "text-[#9E9EA7] hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes (Mini-CRM)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === "crm" ? "bg-black/20 text-black" : "bg-white/10 text-white"
            }`}>
              {crmClients.length}
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: AGENDA & MARCAÇÕES (COM FILTROS & ORDENAÇÃO)                       */}
        {/* ========================================================================= */}
        {activeTab === "agenda" && (
          <div className="space-y-6 animate-fadeIn">
            {/* View Scope & Controls Header */}
            <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 space-y-4 shadow-lg">
              
              {/* Row 1: Scope Toggle & Date Stepper */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/5">
                {/* Scope Toggle */}
                <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setAgendaScope("all")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      agendaScope === "all"
                        ? "bg-[#C89B58] text-black shadow-md font-black"
                        : "text-[#9E9EA7] hover:text-white"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Todas as Marcações</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      agendaScope === "all" ? "bg-black/20 text-black font-bold" : "bg-white/10 text-white"
                    }`}>
                      {allAppointments.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAgendaScope("day")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      agendaScope === "day"
                        ? "bg-[#C89B58] text-black shadow-md font-black"
                        : "text-[#9E9EA7] hover:text-white"
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Agenda do Dia</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      agendaScope === "day" ? "bg-black/20 text-black font-bold" : "bg-white/10 text-white"
                    }`}>
                      {dayAppointments.length}
                    </span>
                  </button>
                </div>

                {/* Day Stepper (Active in 'day' scope) */}
                {agendaScope === "day" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => changeDay(-1)}
                      className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer transition-colors"
                      title="Dia Anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                      className="px-3.5 py-2 rounded-xl border border-[#C89B58]/30 bg-[#C89B58]/15 hover:bg-[#C89B58]/25 text-[#E5C268] text-xs font-bold cursor-pointer transition-colors font-mono"
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => changeDay(1)}
                      className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer transition-colors"
                      title="Dia Seguinte"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold capitalize ml-1 text-white font-serif">
                      {formattedPortugueseDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Row 2: Search, Status Filter & Sorting Dropdown */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search & Status Pills */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-grow">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9EA7]" />
                    <input
                      type="text"
                      placeholder="Pesquisar cliente, telefone ou serviço..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#C89B58] w-full sm:w-60 transition-colors"
                    />
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto p-1 bg-black/30 rounded-xl border border-white/5">
                    {["all", "confirmed", "completed", "cancelled", "blocked"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFilterStatus(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          filterStatus === st
                            ? "bg-[#C89B58] text-black shadow-sm font-bold"
                            : "text-[#9E9EA7] hover:text-white"
                        }`}
                      >
                        {st === "all"
                          ? "Todos"
                          : st === "confirmed"
                            ? "Confirmados"
                            : st === "completed"
                              ? "Concluídos"
                              : st === "cancelled"
                                ? "Cancelados"
                                : "Bloqueios"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🔽 SORTING DROPDOWN (DROPBOX DE ORDENAÇÃO) */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-black/40 border border-white/10 hover:border-[#C89B58]/40 text-xs font-medium text-white flex items-center justify-between gap-2.5 cursor-pointer transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#C89B58]" />
                      <span className="text-[#9E9EA7]">Ordenar:</span>
                      <span className="font-bold text-[#E5C268]">
                        {sortBy === "newest"
                          ? "Mais Recentes"
                          : sortBy === "oldest"
                            ? "Mais Antigos"
                            : sortBy === "price_desc"
                              ? "Preço: Mais Caro"
                              : "Preço: Mais Barato"}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#9E9EA7] transition-transform ${isSortDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isSortDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsSortDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#121318] border border-white/15 rounded-xl p-1.5 shadow-2xl z-30 space-y-1 animate-scaleIn">
                        <button
                          type="button"
                          onClick={() => {
                            setSortBy("newest");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            sortBy === "newest" ? "bg-[#C89B58] text-black font-bold" : "text-white hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Mais recentes primeiro</span>
                          </div>
                          {sortBy === "newest" && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSortBy("oldest");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            sortBy === "oldest" ? "bg-[#C89B58] text-black font-bold" : "text-white hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>Mais antigos primeiro</span>
                          </div>
                          {sortBy === "oldest" && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div className="h-px bg-white/10 my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            setSortBy("price_desc");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            sortBy === "price_desc" ? "bg-[#C89B58] text-black font-bold" : "text-white hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Euro className="w-3.5 h-3.5" />
                            <span>Preço: Mais Caro</span>
                          </div>
                          {sortBy === "price_desc" && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSortBy("price_asc");
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            sortBy === "price_asc" ? "bg-[#C89B58] text-black font-bold" : "text-white hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Euro className="w-3.5 h-3.5" />
                            <span>Preço: Mais Barato</span>
                          </div>
                          {sortBy === "price_asc" && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Studio Metrics Cards for Current Scope */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Total Marcações */}
              <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9E9EA7]">
                  {agendaScope === "all" ? "Total de Pedidos" : "Total do Dia"}
                </p>
                <p className="text-2xl font-mono font-bold text-white">{currentScopeList.length}</p>
              </div>

              {/* Confirmadas */}
              <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Confirmadas</p>
                <p className="text-2xl font-mono font-bold text-emerald-400">
                  {scopeConfirmed.length}
                </p>
              </div>

              {/* Concluídas */}
              <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Concluídas</p>
                <p className="text-2xl font-mono font-bold text-sky-400">
                  {scopeCompleted.length}
                </p>
              </div>

              {/* Faturação Concluída */}
              <div className="p-4 rounded-2xl bg-[#111319] border border-sky-500/30 bg-gradient-to-br from-[#111319] to-sky-500/10 space-y-1 shadow-lg shadow-sky-500/5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Faturação Realizada</p>
                <p className="text-2xl font-mono font-bold text-sky-300">
                  {scopeCompletedRevenue.toFixed(2)} €
                </p>
              </div>

              {/* Faturação Prevista Total */}
              <div className="p-4 rounded-2xl bg-[#111319] border border-[#C89B58]/40 bg-gradient-to-br from-[#111319] to-[#C89B58]/15 space-y-1 shadow-lg shadow-[#C89B58]/10 col-span-2 sm:col-span-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#E5C268]">Faturação Prevista</p>
                <p className="text-2xl font-mono font-bold text-[#E5C268]">{scopeEstimatedRevenue.toFixed(2)} €</p>
              </div>
            </div>

            {/* Timeline & Ordered List of Appointments */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-20 text-center space-y-3 bg-[#111319] rounded-2xl border border-white/10">
                  <div className="w-9 h-9 border-2 border-[#C89B58] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#9E9EA7] font-mono">A carregar agendamentos...</p>
                </div>
              ) : sortedAndFilteredAppointments.length === 0 ? (
                <div className="p-14 text-center space-y-3 rounded-2xl bg-[#111319] border border-white/10">
                  <CalendarIcon className="w-10 h-10 text-[#9E9EA7] mx-auto opacity-40" />
                  <h3 className="text-sm font-bold text-white">Nenhuma marcação encontrada</h3>
                  <p className="text-xs text-[#9E9EA7] max-w-sm mx-auto">
                    {searchQuery
                      ? "Nenhum resultado corresponde à sua pesquisa."
                      : agendaScope === "all"
                        ? "Ainda não existem marcações registadas no sistema."
                        : `Não existem marcações registadas para ${formattedPortugueseDate}.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedAndFilteredAppointments.map((appt) => {
                    const isCancelled = appt.status === "cancelled";
                    const isCompleted = appt.status === "completed";
                    const isBlocked = appt.status === "blocked";

                    const apptFormattedDate = appt.date
                      ? new Date(appt.date).toLocaleDateString("pt-PT", {
                          weekday: "short",
                          day: "numeric",
                          month: "short"
                        })
                      : "";

                    const whatsAppClientText = encodeURIComponent(
                      `Olá ${appt.customer_name}! Confirmamos o seu agendamento na Rota Do Corte para ${appt.formatted_date || appt.date} às ${appt.time} (${appt.service_name}). Até já!`
                    );

                    // Render Blocked Slot differently
                    if (isBlocked) {
                      return (
                        <div
                          key={appt.id}
                          className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              <span>{appt.time}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-300 font-serif">
                                  {appt.customer_name}
                                </span>
                                <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Horário Bloqueado
                                </span>
                                {appt.date && (
                                  <span className="text-[10px] font-mono text-amber-400/80">
                                    • {appt.date}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#9E9EA7] mt-0.5">
                                Duração: {appt.service_duration} min • Indisponível no agendamento público
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(appt.id, true)}
                            className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-auto"
                            title="Desbloquear horário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Desbloquear</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={appt.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isCancelled
                            ? "bg-red-950/10 border-red-500/20 opacity-60"
                            : isCompleted
                              ? "bg-sky-950/10 border-sky-500/25"
                              : "bg-[#111319] border-white/10 hover:border-[#C89B58]/40 shadow-md"
                        }`}
                      >
                        {/* Time Slot & Customer Info */}
                        <div className="flex items-start gap-4">
                          {/* Time & Date Badge */}
                          <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-center font-mono shrink-0 shadow-inner min-w-[80px]">
                            {appt.date && (
                              <span className="text-[10px] font-bold text-[#9E9EA7] uppercase tracking-wider block border-b border-white/5 pb-0.5 mb-1">
                                {apptFormattedDate}
                              </span>
                            )}
                            <span className="text-lg font-bold text-[#E5C268] block">
                              {appt.time}
                            </span>
                            <span className="text-[10px] text-[#9E9EA7] block mt-0.5">
                              {appt.service_duration} min
                            </span>
                          </div>

                          {/* Details */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="font-bold text-sm text-white font-serif">
                                {appt.customer_name}
                              </h3>
                              <span
                                className={`text-[9px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                                  isCancelled
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : isCompleted
                                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                {appt.status}
                              </span>
                            </div>

                            <p className="text-xs text-[#C89B58] font-medium flex items-center gap-2">
                              <Scissors className="w-3.5 h-3.5 shrink-0" />
                              <span>{appt.service_name}</span>
                              <span>•</span>
                              <span className="font-mono font-bold text-white">{appt.service_price}</span>
                            </p>

                            <div className="flex items-center gap-3 text-xs text-[#9E9EA7] pt-0.5">
                              <a
                                href={`tel:${appt.customer_phone?.replace(/\s/g, "")}`}
                                className="flex items-center gap-1 hover:text-white transition-colors"
                              >
                                <Phone className="w-3 h-3 text-[#C89B58]" /> {appt.customer_phone}
                              </a>
                              {appt.customer_notes && (
                                <span className="italic text-[#9E9EA7] line-clamp-1">
                                  "{appt.customer_notes}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Operational Action Controls */}
                        <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-white/5 flex-wrap">
                          {/* WhatsApp Contact */}
                          {appt.customer_phone && appt.customer_phone !== "---" && (
                            <a
                              href={`https://wa.me/${appt.customer_phone.replace(/\D/g, "")}?text=${whatsAppClientText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Enviar Confirmação WhatsApp"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}

                          {/* Edit Appointment */}
                          <button
                            type="button"
                            onClick={() => openEditModal(appt)}
                            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Editar dados da marcação"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          {/* Complete */}
                          {!isCompleted && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(appt.id, "completed")}
                              className="px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Marcar como Concluído"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Concluir</span>
                            </button>
                          )}

                          {/* Re-confirm */}
                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(appt.id, "confirmed")}
                              className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Reabrir como Confirmado"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Reabrir</span>
                            </button>
                          )}

                          {/* Cancel */}
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-[#9E9EA7] hover:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Cancelar marcação"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(appt.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-[#9E9EA7] hover:text-red-400 transition-colors cursor-pointer"
                            title="Eliminar definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ESTATÍSTICAS & RENTABILIDADE (MULTI-PERÍODO)                        */}
        {/* ========================================================================= */}
        {activeTab === "stats" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Period Selector Header */}
            <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div>
                <h2 className="text-base font-bold font-serif text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#C89B58]" />
                  <span>Análise de Performance do Barber Studio</span>
                </h2>
                <p className="text-xs text-[#9E9EA7]">
                  Métricas agregadas de receita, rentabilidade e fidelização.
                </p>
              </div>

              {/* Period Selector Buttons */}
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto">
                {[
                  { id: "today", label: "Hoje" },
                  { id: "week", label: "Esta Semana" },
                  { id: "month", label: "Este Mês" },
                  { id: "30days", label: "Últimos 30 Dias" },
                  { id: "all", label: "Histórico Total" }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setStatsPeriod(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statsPeriod === p.id
                        ? "bg-[#C89B58] text-black shadow-md font-black"
                        : "text-[#9E9EA7] hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategic KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Faturação Concluída */}
              <div className="p-5 rounded-2xl bg-[#111319] border border-sky-500/30 bg-gradient-to-br from-[#111319] to-sky-500/10 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                    Faturação Concluída
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Euro className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-mono font-bold text-sky-300">
                  {statsData.completedRevenue.toFixed(2)} €
                </p>
                <p className="text-[11px] text-[#9E9EA7]">
                  {statsData.completedCount} cortes/serviços finalizados
                </p>
              </div>

              {/* 2. Ticket Médio por Cliente */}
              <div className="p-5 rounded-2xl bg-[#111319] border border-[#C89B58]/40 bg-gradient-to-br from-[#111319] to-[#C89B58]/15 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#E5C268]">
                    Ticket Médio / Cliente
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#C89B58]/20 border border-[#C89B58]/35 flex items-center justify-center text-[#E5C268]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-mono font-bold text-[#FAF8F5]">
                  {statsData.avgTicket.toFixed(2)} €
                </p>
                <p className="text-[11px] text-[#9E9EA7]">
                  Média de valor gasto por atendimento
                </p>
              </div>

              {/* 3. Total de Clientes */}
              <div className="p-5 rounded-2xl bg-[#111319] border border-emerald-500/30 bg-gradient-to-br from-[#111319] to-emerald-500/10 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Total de Clientes
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-mono font-bold text-emerald-300">
                  {statsData.uniqueClientsCount}
                </p>
                <p className="text-[11px] text-[#9E9EA7]">
                  {statsData.completedCount} {statsData.completedCount === 1 ? "atendimento concluído" : "atendimentos concluídos"} no período
                </p>
              </div>

              {/* 4. Taxa de Conclusão / Comparecimento */}
              <div className="p-5 rounded-2xl bg-[#111319] border border-white/10 bg-gradient-to-br from-[#111319] to-white/5 shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9EA7]">
                    Taxa de Comparecimento
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-mono font-bold text-white">
                  {statsData.completionRate}%
                </p>
                <p className="text-[11px] text-[#9E9EA7]">
                  {statsData.cancelledCount} cancelamentos no período
                </p>
              </div>
            </div>

            {/* In-Depth Analytics Section (Service Ranking & Peak Hours) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Service Mix & Revenue Ranking (2 Cols) */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-[#111319] border border-white/10 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-[#C89B58]" />
                      <span>Ranking de Serviços & Receita Gerada</span>
                    </h3>
                    <p className="text-xs text-[#9E9EA7]">
                      Distribuição de faturação por cada corte e tratamento no período.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#E5C268]">
                    Total: {statsData.estimatedRevenue.toFixed(2)} €
                  </span>
                </div>

                {statsData.serviceRanking.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#9E9EA7]">
                    Sem dados suficientes no período selecionado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {statsData.serviceRanking.map((s, idx) => {
                      const percent = statsData.estimatedRevenue > 0
                        ? Math.round((s.revenue / statsData.estimatedRevenue) * 100)
                        : 0;

                      return (
                        <div key={s.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-white/5 text-[10px] font-mono font-bold flex items-center justify-center text-[#E5C268]">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-white">{s.name}</span>
                              <span className="text-[11px] text-[#9E9EA7]">({s.count} marcações)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-sky-300">
                                {s.revenue.toFixed(2)} €
                              </span>
                              <span className="font-mono font-bold text-[#C89B58] text-[11px] w-9 text-right">
                                {percent}%
                              </span>
                            </div>
                          </div>

                          {/* Visual Progress Bar */}
                          <div className="w-full h-2.5 rounded-full bg-black/40 border border-white/5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#C89B58] to-[#E5C268] rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Peak Hours & Shift Distribution (1 Col) */}
              <div className="p-6 rounded-3xl bg-[#111319] border border-white/10 space-y-5 shadow-xl">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Horários de Maior Procura</span>
                  </h3>
                  <p className="text-xs text-[#9E9EA7]">
                    Distribuição da procura por faixa horária.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Morning Shift */}
                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9E9EA7] font-medium flex items-center gap-2">
                        <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Manhã (10:00 - 13:00)</span>
                      </span>
                      <span className="font-mono font-bold text-white">
                        {statsData.peakHours.morning} marcações
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-amber-400/80 rounded-full"
                        style={{
                          width: `${Math.round((statsData.peakHours.morning / statsData.peakHours.total) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Early Afternoon Shift */}
                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9E9EA7] font-medium flex items-center gap-2">
                        <Sun className="w-4 h-4 text-[#C89B58] shrink-0" />
                        <span>Início da Tarde (14:00 - 17:00)</span>
                      </span>
                      <span className="font-mono font-bold text-white">
                        {statsData.peakHours.afternoon} marcações
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-[#C89B58] rounded-full"
                        style={{
                          width: `${Math.round((statsData.peakHours.afternoon / statsData.peakHours.total) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Evening Shift */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-300 font-bold flex items-center gap-2">
                        <Moon className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Fim da Tarde / Noite (17:00 - 22:00)</span>
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        {statsData.peakHours.evening} marcações
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        style={{
                          width: `${Math.round((statsData.peakHours.evening / statsData.peakHours.total) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-[#9E9EA7] leading-relaxed flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-[#C89B58] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Dica de Gestão:</strong> O período das 17h às 21h concentra a maior procura. Programe as pausas preferencialmente no intervalo das 13h às 14h.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CLIENTES (MINI-CRM DO BARBEIRO)                                    */}
        {/* ========================================================================= */}
        {activeTab === "crm" && (
          <div className="space-y-6 animate-fadeIn">
            {/* CRM Header & Search */}
            <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <h2 className="text-base font-bold font-serif text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C89B58]" />
                  <span>Base de Clientes & Fidelização</span>
                </h2>
                <p className="text-xs text-[#9E9EA7]">
                  Histórico de visitas, total investido e preferências por cliente.
                </p>
              </div>

              {/* Search Client */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9EA7]" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou telemóvel..."
                  value={crmSearchQuery}
                  onChange={(e) => setCrmSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#C89B58]"
                />
              </div>
            </div>

            {/* Quick CRM Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#111319] border border-white/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9E9EA7]">Total Clientes Registados</p>
                <p className="text-2xl font-mono font-bold text-white">{crmClients.length}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#111319] border border-[#C89B58]/35 bg-gradient-to-br from-[#111319] to-[#C89B58]/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#E5C268]">Clientes Recorrentes (VIP)</p>
                <p className="text-2xl font-mono font-bold text-[#E5C268]">
                  {crmClients.filter((c) => c.isVip).length}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#111319] border border-sky-500/30 bg-gradient-to-br from-[#111319] to-sky-500/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Total Histórico Acumulado</p>
                <p className="text-2xl font-mono font-bold text-sky-300">
                  {crmClients.reduce((acc, c) => acc + c.totalSpent, 0).toFixed(2)} €
                </p>
              </div>
            </div>

            {/* Clients Cards Grid */}
            {crmClients.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#111319] border border-white/10 space-y-2">
                <Users className="w-8 h-8 text-[#9E9EA7] mx-auto opacity-40" />
                <h3 className="text-sm font-bold text-white">Nenhum cliente encontrado</h3>
                <p className="text-xs text-[#9E9EA7]">
                  {crmSearchQuery ? "Nenhum resultado corresponde à pesquisa." : "Ainda não existem marcações registadas."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {crmClients.map((client) => {
                  const whatsAppChatUrl = client.phone && client.phone !== "---"
                    ? `https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Olá ${client.name}! Daqui é o Gabriel Silva da Rota Do Corte. Espero que esteja tudo bem!`
                      )}`
                    : null;

                  return (
                    <div
                      key={client.key}
                      className="p-5 rounded-2xl bg-[#111319] border border-white/10 hover:border-[#C89B58]/40 transition-all space-y-3.5 shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-[#C89B58]/20 border border-[#C89B58]/35 flex items-center justify-center font-bold text-xs text-[#E5C268]">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-white font-serif leading-tight">
                                {client.name}
                              </h3>
                              {client.phone && client.phone !== "---" && (
                                <span className="text-[11px] font-mono text-[#9E9EA7]">
                                  {client.phone}
                                </span>
                              )}
                            </div>
                          </div>

                          {client.isVip && (
                            <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#C89B58]/25 text-[#E5C268] border border-[#C89B58]/40 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 text-[#E5C268] fill-[#E5C268]" />
                              <span>VIP</span>
                            </span>
                          )}
                        </div>

                        {/* Stats Matrix */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-center">
                            <span className="text-[9px] uppercase text-[#9E9EA7] block">Visitas</span>
                            <span className="text-xs font-mono font-bold text-white">{client.totalBookings}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-center">
                            <span className="text-[9px] uppercase text-sky-400 block">Total Gasto</span>
                            <span className="text-xs font-mono font-bold text-sky-300">{client.totalSpent.toFixed(0)} €</span>
                          </div>
                          <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-center">
                            <span className="text-[9px] uppercase text-[#E5C268] block">Ticket Médio</span>
                            <span className="text-xs font-mono font-bold text-[#E5C268]">{client.avgTicket.toFixed(0)} €</span>
                          </div>
                        </div>

                        {/* Preferred Service & Last Visit */}
                        <div className="text-[11px] text-[#9E9EA7] space-y-1 pt-1">
                          <p className="flex items-center gap-1.5 text-white">
                            <Scissors className="w-3 h-3 text-[#C89B58]" />
                            <span>Favorito: <strong>{client.favService}</strong></span>
                          </p>
                          {client.lastVisit && (
                            <p className="flex items-center gap-1.5 text-[10px]">
                              <Clock className="w-3 h-3 text-[#9E9EA7]" />
                              <span>Última visita: {new Date(client.lastVisit).toLocaleDateString("pt-PT")}</span>
                            </p>
                          )}
                          {client.notesList.length > 0 && (
                            <p className="italic text-[#9E9EA7] line-clamp-2 text-[10px] bg-white/5 p-1.5 rounded-lg">
                              "{client.notesList[0]}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Direct WhatsApp Contact */}
                      {whatsAppChatUrl && (
                        <a
                          href={whatsAppChatUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                          <span>Mensagem WhatsApp</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MARCAR NOVO CLIENTE (MANUAL APPOINTMENT)                          */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-fadeIn"
          onClick={() => {
            setIsTimeDropdownOpen(false);
            setIsServiceDropdownOpen(false);
          }}
        >
          <div 
            className="relative max-w-md w-full bg-[#111319] border border-[#C89B58]/40 rounded-3xl p-6 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-white">Marcar Novo Cliente</h3>
              <button
                type="button"
                onClick={() => {
                  setIsNewModalOpen(false);
                  setIsTimeDropdownOpen(false);
                  setIsServiceDropdownOpen(false);
                }}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-[#9E9EA7] hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#C89B58]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Telemóvel / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+351 9xx xxx xxx"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#C89B58]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Time Dropdown (30 min slots) */}
                <div className="relative">
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Horário (30 min) *
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTimeDropdownOpen((prev) => !prev);
                      setIsServiceDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2.5 text-xs font-mono font-bold rounded-xl bg-black/40 border border-white/10 hover:border-[#C89B58]/60 text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#C89B58]" />
                      <span>{manualTime}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#9E9EA7] transition-transform duration-200 ${
                        isTimeDropdownOpen ? "rotate-180 text-[#C89B58]" : ""
                      }`}
                    />
                  </button>

                  {isTimeDropdownOpen && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[#14161F] border border-[#C89B58]/40 rounded-2xl p-2.5 shadow-2xl space-y-2.5 max-h-56 overflow-y-auto animate-fadeIn backdrop-blur-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#C89B58] px-1 flex items-center gap-1.5 mb-1.5">
                          <Sunrise className="w-3 h-3 text-[#C89B58]" />
                          <span>Manhã (10:00 - 13:00)</span>
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setManualTime(t);
                                setIsTimeDropdownOpen(false);
                              }}
                              className={`py-1.5 px-2 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer text-center ${
                                manualTime === t
                                  ? "bg-[#C89B58] text-black shadow-md shadow-[#C89B58]/25 font-black scale-105"
                                  : "bg-white/5 hover:bg-white/15 text-[#FAF8F5] hover:text-[#E5C268]"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-white/5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#C89B58] px-1 flex items-center gap-1.5 mb-1.5">
                          <Sun className="w-3 h-3 text-[#C89B58]" />
                          <span>Tarde & Noite (14:00 - 22:00)</span>
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                            "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
                            "20:00", "20:30", "21:00", "21:30"
                          ].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setManualTime(t);
                                setIsTimeDropdownOpen(false);
                              }}
                              className={`py-1.5 px-2 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer text-center ${
                                manualTime === t
                                  ? "bg-[#C89B58] text-black shadow-md shadow-[#C89B58]/25 font-black scale-105"
                                  : "bg-white/5 hover:bg-white/15 text-[#FAF8F5] hover:text-[#E5C268]"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Service Dropdown */}
                <div className="relative">
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Serviço *
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsServiceDropdownOpen((prev) => !prev);
                      setIsTimeDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 hover:border-[#C89B58]/60 text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      <Scissors className="w-3.5 h-3.5 text-[#C89B58] shrink-0" />
                      <span className="truncate font-medium text-left">
                        {servicesData.find((s) => s.id === manualServiceId)?.name || "Selecionar"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#9E9EA7] transition-transform duration-200 ${
                        isServiceDropdownOpen ? "rotate-180 text-[#C89B58]" : ""
                      }`}
                    />
                  </button>

                  {isServiceDropdownOpen && (
                    <div 
                      className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 sm:w-72 mt-1.5 z-40 bg-[#14161F] border border-[#C89B58]/40 rounded-2xl p-1.5 shadow-2xl space-y-1 max-h-60 overflow-y-auto animate-fadeIn backdrop-blur-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {servicesData.map((s) => {
                        const isSelected = manualServiceId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setManualServiceId(s.id);
                              setIsServiceDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                              isSelected
                                ? "bg-[#C89B58]/20 border-[#C89B58]/60 text-white shadow-sm"
                                : "hover:bg-white/5 text-[#c4c4cc] hover:text-white border-transparent"
                            }`}
                          >
                            <div className="space-y-0.5 pr-2">
                              <span className="text-xs font-bold text-white block">
                                {s.name}
                              </span>
                              <span className="text-[10px] text-[#9E9EA7] flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-[#C89B58]" /> {s.duration}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#E5C268]">
                              {s.priceFormatted}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Notas / Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cliente prefere máquina 1 / Barba desenhada"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#C89B58]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#9E9EA7] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-pill-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Confirmar Marcação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDITAR MARCAÇÃO                                                  */}
      {/* ========================================================================= */}
      {editingAppt && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-fadeIn"
          onClick={() => {
            setIsEditTimeDropdownOpen(false);
            setIsEditServiceDropdownOpen(false);
          }}
        >
          <div 
            className="relative max-w-md w-full bg-[#111319] border border-[#C89B58]/40 rounded-3xl p-6 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-white">Editar Marcação</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingAppt(null);
                  setIsEditTimeDropdownOpen(false);
                  setIsEditServiceDropdownOpen(false);
                }}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-[#9E9EA7] hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#C89B58]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Telemóvel / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#C89B58]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#C89B58] font-mono"
                  />
                </div>

                {/* Edit Time Selector */}
                <div className="relative">
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Horário (30 min) *
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditTimeDropdownOpen((prev) => !prev);
                      setIsEditServiceDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2.5 text-xs font-mono font-bold rounded-xl bg-black/40 border border-white/10 hover:border-[#C89B58]/60 text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#C89B58]" />
                      <span>{editTime}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#9E9EA7] transition-transform duration-200 ${
                        isEditTimeDropdownOpen ? "rotate-180 text-[#C89B58]" : ""
                      }`}
                    />
                  </button>

                  {isEditTimeDropdownOpen && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[#14161F] border border-[#C89B58]/40 rounded-2xl p-2.5 shadow-2xl space-y-2.5 max-h-56 overflow-y-auto animate-fadeIn backdrop-blur-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#C89B58] px-1 flex items-center gap-1.5 mb-1.5">
                          <Sunrise className="w-3 h-3 text-[#C89B58]" />
                          <span>Manhã (10:00 - 13:00)</span>
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setEditTime(t);
                                setIsEditTimeDropdownOpen(false);
                              }}
                              className={`py-1.5 px-2 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer text-center ${
                                editTime === t
                                  ? "bg-[#C89B58] text-black shadow-md shadow-[#C89B58]/25 font-black scale-105"
                                  : "bg-white/5 hover:bg-white/15 text-[#FAF8F5] hover:text-[#E5C268]"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-white/5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#C89B58] px-1 flex items-center gap-1.5 mb-1.5">
                          <Sun className="w-3 h-3 text-[#C89B58]" />
                          <span>Tarde & Noite (14:00 - 22:00)</span>
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                            "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
                            "20:00", "20:30", "21:00", "21:30"
                          ].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setEditTime(t);
                                setIsEditTimeDropdownOpen(false);
                              }}
                              className={`py-1.5 px-2 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer text-center ${
                                editTime === t
                                  ? "bg-[#C89B58] text-black shadow-md shadow-[#C89B58]/25 font-black scale-105"
                                  : "bg-white/5 hover:bg-white/15 text-[#FAF8F5] hover:text-[#E5C268]"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Service Selector */}
                <div className="relative">
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Serviço *
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditServiceDropdownOpen((prev) => !prev);
                      setIsEditTimeDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 hover:border-[#C89B58]/60 text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      <Scissors className="w-3.5 h-3.5 text-[#C89B58] shrink-0" />
                      <span className="truncate font-medium text-left">
                        {servicesData.find((s) => s.id === editServiceId)?.name || "Selecionar"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#9E9EA7] transition-transform duration-200 ${
                        isEditServiceDropdownOpen ? "rotate-180 text-[#C89B58]" : ""
                      }`}
                    />
                  </button>

                  {isEditServiceDropdownOpen && (
                    <div 
                      className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 sm:w-72 mt-1.5 z-40 bg-[#14161F] border border-[#C89B58]/40 rounded-2xl p-1.5 shadow-2xl space-y-1 max-h-60 overflow-y-auto animate-fadeIn backdrop-blur-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {servicesData.map((s) => {
                        const isSelected = editServiceId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setEditServiceId(s.id);
                              setIsEditServiceDropdownOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                              isSelected
                                ? "bg-[#C89B58]/20 border-[#C89B58]/60 text-white shadow-sm"
                                : "hover:bg-white/5 text-[#c4c4cc] hover:text-white border-transparent"
                            }`}
                          >
                            <div className="space-y-0.5 pr-2">
                              <span className="text-xs font-bold text-white block">
                                {s.name}
                              </span>
                              <span className="text-[10px] text-[#9E9EA7] flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-[#C89B58]" /> {s.duration}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#E5C268]">
                              {s.priceFormatted}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Status Selector */}
                <div>
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Estado
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "confirmed", label: "Confirmado", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
                      { id: "completed", label: "Concluído", color: "bg-sky-500/20 text-sky-400 border-sky-500/40" },
                      { id: "cancelled", label: "Cancelado", color: "bg-red-500/20 text-red-400 border-red-500/40" }
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setEditStatus(st.id)}
                        className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all cursor-pointer text-center ${
                          editStatus === st.id
                            ? `${st.color} ring-1 ring-[#C89B58]/50 font-black`
                            : "bg-black/30 border-white/10 text-[#9E9EA7] hover:text-white"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Notas / Observações
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#C89B58]"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleDeleteAppointment(editingAppt.id)}
                  className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Eliminar marcação"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAppt(null)}
                    className="px-4 py-2 text-xs text-[#9E9EA7] hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="btn-pill-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEdit ? "A Guardar..." : "Guardar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BLOQUEAR HORÁRIO / PAUSA / AUSÊNCIA (FASE 3)                     */}
      {/* ========================================================================= */}
      {isBlockModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-fadeIn"
          onClick={() => {
            setIsBlockStartDropdownOpen(false);
            setIsBlockEndDropdownOpen(false);
          }}
        >
          <div 
            className="relative max-w-md w-full bg-[#111319] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-xl font-bold text-white">Bloquear Horário / Pausa</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-[#9E9EA7] hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#9E9EA7] leading-relaxed">
              O período selecionado ficará automaticamente indisponível para marcações públicas e reservado na sua agenda.
            </p>

            <form onSubmit={handleCreateBlock} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Data a Bloquear *
                </label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Hora Início *
                  </label>
                  <select
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-mono font-bold rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    {[
                      "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
                      "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
                      "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
                      "19:00", "19:30", "20:00", "20:30", "21:00"
                    ].map((t) => (
                      <option key={t} value={t} className="bg-[#111319] text-white font-mono">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Hora Fim *
                  </label>
                  <select
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-mono font-bold rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    {[
                      "10:30", "11:00", "11:30", "12:00", "12:30", "13:00",
                      "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
                      "16:30", "17:00", "17:30", "18:00", "18:30", "19:00",
                      "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
                    ].map((t) => (
                      <option key={t} value={t} className="bg-[#111319] text-white font-mono">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Motivo do Bloqueio *
                </label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {[
                    "Pausa de Almoço",
                    "Formação / Curso",
                    "Assuntos Pessoais",
                    "Dia de Folga / Férias"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBlockReason(preset)}
                      className={`p-2 rounded-xl text-[10px] font-bold border transition-all text-left cursor-pointer ${
                        blockReason === preset
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "bg-black/30 border-white/5 text-[#9E9EA7] hover:text-white"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ou escreva um motivo personalizado..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#9E9EA7] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlock}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isSavingBlock ? "A Bloquear..." : "Confirmar Bloqueio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
