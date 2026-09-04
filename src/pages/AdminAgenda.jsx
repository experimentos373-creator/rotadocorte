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
  ShieldCheck,
  Activity,
  Timer,
  Zap,
  Target,
  TrendingDown,
  ArrowRight,
  LayoutDashboard,
  CalendarRange,
  FileSpreadsheet,
  Download,
  Bell,
  Menu,
  X,
  UserCheck
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
  subscribeToAppointments,
  createBooking,
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

  // Selected Date for Agenda View
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Global & Day Appointments
  const [allAppointments, setAllAppointments] = useState([]);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Scope in Agenda View: 'all' (Todas as Marcações) | 'day' (Agenda do Dia Selecionado)
  const [agendaScope, setAgendaScope] = useState("day");

  // Sorting Mode: 'newest' | 'oldest' | 'price_desc' | 'price_asc'
  const [sortBy, setSortBy] = useState("newest");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [crmSearchQuery, setCrmSearchQuery] = useState("");

  // Stats Period Selector: 'today' | 'week' | 'month' | '30days' | 'all'
  const [statsPeriod, setStatsPeriod] = useState("month");
  const [hoveredService, setHoveredService] = useState(null);
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);

  // Modal: New Manual Appointment
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualTime, setManualTime] = useState("11:00");
  const [manualServiceId, setManualServiceId] = useState("corte-barba-terapia");
  const [manualNotes, setManualNotes] = useState("");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
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
  const [isEditTimeDropdownOpen, setIsEditTimeDropdownOpen] = useState(false);
  const [isEditServiceDropdownOpen, setIsEditServiceDropdownOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal: Block Slot (Time Off / Pausa / Ausência)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split("T")[0]);
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
    if (!isAuthenticated || !currentAdminPin) return;
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
    if (isAuthenticated && currentAdminPin) {
      loadAppointments();

      // Realtime live sync whenever any new booking is made
      const unsubscribe = subscribeToAppointments(() => {
        loadAppointments();
      });

      // Background auto-refresh polling interval (every 10s)
      const pollInterval = setInterval(() => {
        loadAppointments();
      }, 10000);

      return () => {
        unsubscribe();
        clearInterval(pollInterval);
      };
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
    await updateAppointment(id, { status: newStatus }, currentAdminPin);
    await loadAppointments();
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAppt) return;
    setIsSavingEdit(true);

    const res = await updateAppointment(
      editingAppt.id,
      {
        customer_name: editName.trim(),
        customer_phone: editPhone.trim(),
        date: editDate,
        time: editTime,
        service_id: editServiceId,
        status: editStatus,
        customer_notes: editNotes.trim()
      },
      currentAdminPin
    );

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
      await deleteAppointment(id, currentAdminPin);
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

  // Create Manual Appointment (Saved directly to central database)
  const handleCreateManual = async (e) => {
    e.preventDefault();
    setIsSavingManual(true);
    await createBooking({
      shopSlug: "rotadocorte",
      serviceId: manualServiceId,
      date: selectedDate,
      time: manualTime,
      customerName: manualName.trim(),
      customerPhone: manualPhone.trim(),
      customerNotes: manualNotes.trim()
    });
    setIsSavingManual(false);
    setIsNewModalOpen(false);
    setManualName("");
    setManualPhone("");
    setManualNotes("");
    await loadAppointments();
  };

  // Create Block Slot (Time Off)
  const handleCreateBlock = async (e) => {
    e.preventDefault();
    setIsSavingBlock(true);
    await createBlockSlot({
      date: blockDate,
      startTime: blockStartTime,
      endTime: blockEndTime,
      reason: blockReason,
      pin: currentAdminPin
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

  // Filtered & Sorted Appointments List for Agenda View
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
        const timeA = new Date(a.start_time || `${a.date || "2000-01-01"}T${a.time || "00:00"}:00`).getTime() || 0;
        const timeB = new Date(b.start_time || `${b.date || "2000-01-01"}T${b.time || "00:00"}:00`).getTime() || 0;
        return timeB - timeA;
      }
      if (sortBy === "oldest") {
        const timeA = new Date(a.start_time || `${a.date || "2000-01-01"}T${a.time || "00:00"}:00`).getTime() || 0;
        const timeB = new Date(b.start_time || `${b.date || "2000-01-01"}T${b.time || "00:00"}:00`).getTime() || 0;
        return timeA - timeB;
      }
      if (sortBy === "price_desc") {
        return parsePrice(b.service_price) - parsePrice(a.service_price);
      }
      if (sortBy === "price_asc") {
        return parsePrice(a.service_price) - parsePrice(b.service_price);
      }
      return 0;
    });
  }, [agendaScope, dayAppointments, allAppointments, filterStatus, searchQuery, sortBy]);

  // =========================================================================
  // MULTI-PERIOD STATS CALCULATIONS (DASHBOARD & METRICS)
  // =========================================================================
  const statsData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Start of Current Week (Monday)
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    // Filter appointments by period
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

    // Client Retention / Repeat Rate (%)
    const clientVisitCounts = {};
    allAppointments.forEach((a) => {
      if (a.status === "blocked") return;
      const key = (a.customer_phone || a.customer_name || "").trim();
      if (!key || key === "---") return;
      clientVisitCounts[key] = (clientVisitCounts[key] || 0) + 1;
    });
    const totalUniqueAllTime = Object.keys(clientVisitCounts).length;
    const repeatClientsCount = Object.values(clientVisitCounts).filter((c) => c > 1).length;
    const repeatRate = totalUniqueAllTime > 0 ? Math.round((repeatClientsCount / totalUniqueAllTime) * 100) : 0;

    // Days of Week Breakdown (Seg a Sáb)
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const daysActivityMap = {
      1: { label: "Seg", name: "Segunda", count: 0, revenue: 0 },
      2: { label: "Ter", name: "Terça", count: 0, revenue: 0 },
      3: { label: "Qua", name: "Quarta", count: 0, revenue: 0 },
      4: { label: "Qui", name: "Quinta", count: 0, revenue: 0 },
      5: { label: "Sex", name: "Sexta", count: 0, revenue: 0 },
      6: { label: "Sáb", name: "Sábado", count: 0, revenue: 0 }
    };

    active.forEach((a) => {
      if (!a.date) return;
      const dow = new Date(a.date).getDay();
      if (daysActivityMap[dow]) {
        daysActivityMap[dow].count += 1;
        daysActivityMap[dow].revenue += parsePrice(a.service_price);
      }
    });

    const daysActivity = Object.values(daysActivityMap);
    const maxDayCount = Math.max(...daysActivity.map((d) => d.count), 1);
    const peakDay = daysActivity.reduce((max, curr) => (curr.count > max.count ? curr : max), daysActivity[0]);

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

    const rawServiceRanking = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

    const PALETTE = [
      { stroke: "#C89B58", text: "#C89B58", bg: "bg-[#C89B58]/10 text-[#C89B58] border-[#C89B58]/30", hex: "#C89B58" },
      { stroke: "#38BDF8", text: "#38BDF8", bg: "bg-sky-500/10 text-sky-400 border-sky-500/30", hex: "#38BDF8" },
      { stroke: "#34D399", text: "#34D399", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", hex: "#34D399" },
      { stroke: "#FB923C", text: "#FB923C", bg: "bg-orange-500/10 text-orange-400 border-orange-500/30", hex: "#FB923C" },
      { stroke: "#A3E635", text: "#A3E635", bg: "bg-lime-500/10 text-lime-400 border-lime-500/30", hex: "#A3E635" },
      { stroke: "#94A3B8", text: "#94A3B8", bg: "bg-slate-500/10 text-slate-400 border-slate-500/30", hex: "#94A3B8" }
    ];

    let accumulatedAngle = 0;
    const perimeter = 2 * Math.PI * 65;

    const serviceRanking = rawServiceRanking.map((s, idx) => {
      const colorScheme = PALETTE[idx % PALETTE.length];
      const percent = estimatedRev > 0 ? (s.revenue / estimatedRev) * 100 : 0;
      const dashLength = Math.max((percent / 100) * perimeter, percent > 0 ? 3 : 0);
      const dashOffset = -(accumulatedAngle / 100) * perimeter;
      accumulatedAngle += percent;

      const matched = servicesData.find(
        (sd) => sd.name?.toLowerCase() === s.name?.toLowerCase() || sd.id === s.id
      );
      const durationMin = matched ? parseInt(matched.duration, 10) || 30 : 30;
      const avgPrice = s.count > 0 ? s.revenue / s.count : 0;
      const hourlyYield = durationMin > 0 ? (avgPrice / (durationMin / 60)) : 0;

      return {
        ...s,
        percent: Math.round(percent),
        exactPercent: percent,
        color: colorScheme.stroke,
        textColor: colorScheme.text,
        bgClass: colorScheme.bg,
        hex: colorScheme.hex,
        dashLength,
        dashOffset,
        durationMin,
        avgPrice,
        hourlyYield
      };
    });

    // Timeline Trend for Smooth Bezier Curve
    const dateMap = {};
    active.forEach((a) => {
      const dStr = a.date;
      if (!dStr) return;
      if (!dateMap[dStr]) {
        const dObj = new Date(dStr);
        dateMap[dStr] = {
          date: dStr,
          label: dayNames[dObj.getDay()] || dStr.slice(5),
          fullLabel: dObj.toLocaleDateString("pt-PT", { day: "numeric", month: "short" }),
          count: 0,
          revenue: 0
        };
      }
      dateMap[dStr].count += 1;
      dateMap[dStr].revenue += parsePrice(a.service_price);
    });

    const timelineData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    const maxTimelineRevenue = Math.max(...timelineData.map((d) => d.revenue), 20);

    // High-Resolution Smooth Spline Generator
    let chartSvgPath = "";
    let chartAreaPath = "";
    let chartPoints = [];
    const chartW = 600;
    const chartH = 180;
    const padL = 45;
    const padR = 20;
    const padT = 20;
    const padB = 30;

    if (timelineData.length > 0) {
      chartPoints = timelineData.map((d, i) => {
        const x = timelineData.length === 1
          ? chartW / 2
          : padL + (i / (timelineData.length - 1)) * (chartW - padL - padR);
        const y = chartH - padB - (d.revenue / maxTimelineRevenue) * (chartH - padT - padB);
        return { ...d, x, y };
      });

      if (chartPoints.length === 1) {
        chartSvgPath = `M ${chartPoints[0].x - 20} ${chartPoints[0].y} L ${chartPoints[0].x + 20} ${chartPoints[0].y}`;
        chartAreaPath = `M ${chartPoints[0].x - 20} ${chartPoints[0].y} L ${chartPoints[0].x + 20} ${chartPoints[0].y} L ${chartPoints[0].x + 20} ${chartH - padB} L ${chartPoints[0].x - 20} ${chartH - padB} Z`;
      } else if (chartPoints.length === 2) {
        chartSvgPath = `M ${chartPoints[0].x.toFixed(1)} ${chartPoints[0].y.toFixed(1)} L ${chartPoints[1].x.toFixed(1)} ${chartPoints[1].y.toFixed(1)}`;
        chartAreaPath = `${chartSvgPath} L ${chartPoints[1].x.toFixed(1)} ${chartH - padB} L ${chartPoints[0].x.toFixed(1)} ${chartH - padB} Z`;
      } else {
        // Cubic Bezier Spline
        let d = `M ${chartPoints[0].x.toFixed(1)} ${chartPoints[0].y.toFixed(1)}`;
        for (let i = 0; i < chartPoints.length - 1; i++) {
          const p0 = chartPoints[Math.max(i - 1, 0)];
          const p1 = chartPoints[i];
          const p2 = chartPoints[i + 1];
          const p3 = chartPoints[Math.min(i + 2, chartPoints.length - 1)];

          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;

          d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }
        chartSvgPath = d;
        chartAreaPath = `${d} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${chartH - padB} L ${chartPoints[0].x.toFixed(1)} ${chartH - padB} Z`;
      }
    }

    // Grid line values
    const gridLevels = [
      { pct: 1.0, val: maxTimelineRevenue, y: padT },
      { pct: 0.66, val: maxTimelineRevenue * 0.66, y: padT + (chartH - padT - padB) * 0.33 },
      { pct: 0.33, val: maxTimelineRevenue * 0.33, y: padT + (chartH - padT - padB) * 0.66 },
      { pct: 0.0, val: 0, y: chartH - padB }
    ];

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
      repeatRate,
      daysActivity,
      maxDayCount,
      peakDay,
      serviceRanking,
      timelineData,
      maxTimelineRevenue,
      chartSvgPath,
      chartAreaPath,
      chartPoints,
      gridLevels,
      chartW,
      chartH,
      padL,
      padR,
      padT,
      padB,
      perimeter
    };
  }, [allAppointments, statsPeriod]);

  // =========================================================================
  // MINI-CRM AGGREGATION
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
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 font-sans transition-colors ${
        isLight ? "bg-[#F3F4F6] text-[#111827]" : "bg-[#090A0E] text-[#FAF8F5]"
      }`}>
        <div className={`w-full max-w-sm rounded-3xl p-7 shadow-2xl space-y-6 border transition-all ${
          isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
        }`}>
          {/* Header */}
          <div className="text-center space-y-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border ${
              isLight ? "bg-neutral-100 border-neutral-200 text-[#C89B58]" : "bg-white/5 border-white/10 text-[#C89B58]"
            }`}>
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Acesso ao Painel
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Introduza o PIN de administrador para aceder ao sistema de gestão da Rota Do Corte.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
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
                  className={`w-full border rounded-2xl px-4 py-3.5 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#C89B58] transition-all ${
                    isLight
                      ? "bg-neutral-50 border-neutral-200 text-neutral-900"
                      : "bg-black/40 border-white/10 text-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-500">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifyingPin}
              className="w-full py-3.5 rounded-2xl bg-[#C89B58] hover:bg-[#D4A966] text-black font-bold text-sm tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifyingPin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>A validar...</span>
                </>
              ) : (
                <span>Entrar no Painel</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-neutral-200 dark:border-white/5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao website público</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 🎛️ FULL DASHBOARD SHELL LAYOUT
  return (
    <div className={`min-h-screen font-sans flex transition-colors ${
      isLight ? "bg-[#F4F5F7] text-[#111827]" : "bg-[#0A0B0E] text-[#FAF8F5]"
    }`}>

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION (INSPIRATION IMAGE 1)                           */}
      {/* ========================================================================= */}
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col justify-between p-4 border-r transition-all duration-300 lg:static lg:translate-x-0 ${
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${
        isLight
          ? "bg-white border-neutral-200 shadow-sm"
          : "bg-[#111319] border-white/10"
      }`}>
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-[#C89B58] flex items-center justify-center text-black font-black text-base shadow-md group-hover:scale-105 transition-transform">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm leading-tight font-serif tracking-tight">
                  Rota Do Corte
                </h2>
                <span className="text-[11px] text-neutral-400 font-sans block">
                  Studio Dashboard
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation Links */}
          <nav className="space-y-1.5">
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
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? isLight
                        ? "bg-[#C89B58] text-black font-bold shadow-sm"
                        : "bg-[#C89B58] text-black font-bold shadow-md"
                      : isLight
                        ? "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-black/20 text-black"
                        : isLight
                          ? "bg-neutral-200 text-neutral-700"
                          : "bg-white/10 text-neutral-300"
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
        <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-white/10">
          {/* User Profile & Logout */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#C89B58]/20 border border-[#C89B58]/40 text-[#C89B58] flex items-center justify-center font-bold text-xs shrink-0">
                G
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Gabriel Silva</p>
                <p className="text-[10px] text-neutral-400 truncate">Paião, PT</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-neutral-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN APP CANVAS CONTAINER                                              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Top Header App Bar */}
        <header className={`sticky top-0 z-30 px-4 sm:px-8 py-4 border-b flex items-center justify-between gap-4 backdrop-blur-md transition-colors ${
          isLight
            ? "bg-white/80 border-neutral-200"
            : "bg-[#0A0B0E]/80 border-white/10"
        }`}>
          {/* Left: Mobile Menu Toggle + Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-neutral-200 dark:border-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Pesquisar cliente, contacto ou serviço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                  isLight
                    ? "bg-neutral-100 border-neutral-200 text-neutral-900 placeholder-neutral-400"
                    : "bg-[#111319] border-white/10 text-white placeholder-neutral-500"
                }`}
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle (Light / Dark Mode) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2.5 rounded-2xl border transition-colors cursor-pointer ${
                isLight
                  ? "bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200"
                  : "bg-[#111319] border-white/10 text-neutral-300 hover:bg-white/10"
              }`}
              title={isLight ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#C89B58]" />}
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadAppointments}
              className={`p-2.5 rounded-2xl border transition-colors cursor-pointer ${
                isLight
                  ? "bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200"
                  : "bg-[#111319] border-white/10 text-neutral-300 hover:bg-white/10"
              }`}
              title="Atualizar Dados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* Block Slot Button */}
            <button
              type="button"
              onClick={() => {
                setBlockDate(selectedDate);
                setIsBlockModalOpen(true);
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-colors ${
                isLight
                  ? "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                  : "bg-[#111319] border-white/10 text-neutral-200 hover:bg-white/5"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#C89B58]" />
              <span>Bloquear Horário</span>
            </button>

            {/* New Manual Booking Button */}
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#C89B58] hover:bg-[#D4A966] text-black text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Marcar Cliente</span>
            </button>
          </div>
        </header>

        {/* Main Content View Switcher */}
        <main className="p-4 sm:p-8 space-y-6 flex-1">

          {/* ========================================================================= */}
          {/* TAB: AGENDA & MARCAÇÕES (TIMELINE + CONTROLS)                             */}
          {/* ========================================================================= */}
          {activeTab === "agenda" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Agenda Scope, Stepper & Filters */}
              <div className={`p-5 rounded-3xl border shadow-xs space-y-4 ${
                isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
              }`}>
                {/* Row 1: Scope & Stepper */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-white/5">
                  <div className={`flex items-center gap-1.5 p-1 rounded-2xl border w-fit ${
                    isLight ? "bg-neutral-100 border-neutral-200" : "bg-black/40 border-white/10"
                  }`}>
                    <button
                      type="button"
                      onClick={() => setAgendaScope("day")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        agendaScope === "day"
                          ? "bg-[#C89B58] text-black shadow-xs font-bold"
                          : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Agenda do Dia</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/20 text-black font-bold">
                        {dayAppointments.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAgendaScope("all")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        agendaScope === "all"
                          ? "bg-[#C89B58] text-black shadow-xs font-bold"
                          : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Todas as Marcações</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/10 text-neutral-300">
                        {allAppointments.length}
                      </span>
                    </button>
                  </div>

                  {/* Day Stepper */}
                  {agendaScope === "day" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => changeDay(-1)}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          isLight ? "bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                        className="px-3.5 py-2 rounded-xl bg-[#C89B58]/15 border border-[#C89B58]/30 text-[#C89B58] text-xs font-bold cursor-pointer font-mono"
                      >
                        Hoje
                      </button>
                      <button
                        type="button"
                        onClick={() => changeDay(1)}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          isLight ? "bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold capitalize ml-1 font-serif">
                        {formattedPortugueseDate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Row 2: Status Filter & Sorting */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className={`flex items-center gap-1 overflow-x-auto p-1 rounded-2xl border ${
                    isLight ? "bg-neutral-100 border-neutral-200" : "bg-black/30 border-white/5"
                  }`}>
                    {["all", "confirmed", "completed", "cancelled", "blocked"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFilterStatus(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          filterStatus === st
                            ? "bg-[#C89B58] text-black shadow-xs font-bold"
                            : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
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

                  {/* Sorting Mode Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className={`px-4 py-2 rounded-2xl border text-xs font-medium flex items-center justify-between gap-2.5 cursor-pointer ${
                        isLight ? "bg-white border-neutral-200" : "bg-black/40 border-white/10"
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#C89B58]" />
                      <span className="text-neutral-400">Ordenar:</span>
                      <span className="font-bold text-[#C89B58]">
                        {sortBy === "newest"
                          ? "Mais Recentes"
                          : sortBy === "oldest"
                            ? "Mais Antigos"
                            : sortBy === "price_desc"
                              ? "Preço: Maior"
                              : "Preço: Menor"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                    </button>

                    {isSortDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsSortDropdownOpen(false)} />
                        <div className={`absolute right-0 top-full mt-1.5 w-52 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 border ${
                          isLight ? "bg-white border-neutral-200" : "bg-[#14161F] border-white/15"
                        }`}>
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
                              className={`w-full px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                                sortBy === opt.id ? "bg-[#C89B58] text-black font-bold" : "hover:bg-neutral-100 dark:hover:bg-white/5"
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

              {/* Appointments List */}
              {isLoading ? (
                <div className={`py-20 text-center space-y-3 rounded-3xl border ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <div className="w-8 h-8 border-2 border-[#C89B58] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-neutral-400 font-mono">A carregar agendamentos...</p>
                </div>
              ) : sortedAndFilteredAppointments.length === 0 ? (
                <div className={`p-14 text-center space-y-3 rounded-3xl border ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <CalendarIcon className="w-10 h-10 text-neutral-400 mx-auto opacity-40" />
                  <h3 className="text-sm font-bold">Nenhuma marcação encontrada</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
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

                    if (isBlocked) {
                      return (
                        <div
                          key={appt.id}
                          className="p-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="px-3.5 py-2 rounded-2xl bg-amber-500/20 text-amber-500 font-mono font-bold text-sm flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              <span>{appt.time}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-500">
                                  {appt.customer_name}
                                </span>
                                <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                                  Horário Bloqueado
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Duração: {appt.service_duration} min • Indisponível no agendamento público
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(appt.id, true)}
                            className="px-3 py-1.5 rounded-xl bg-red-500/15 text-red-500 hover:bg-red-500/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
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
                        className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isCancelled
                            ? "opacity-50 bg-red-500/5 border-red-500/20"
                            : isCompleted
                              ? isLight ? "bg-emerald-50/50 border-emerald-200" : "bg-emerald-950/10 border-emerald-500/20"
                              : isLight ? "bg-white border-neutral-200 hover:border-[#C89B58]" : "bg-[#111319] border-white/10 hover:border-[#C89B58]"
                        }`}
                      >
                        {/* Time & Details */}
                        <div className="flex items-start gap-4">
                          <div className={`px-4 py-3 rounded-2xl border text-center font-mono shrink-0 shadow-inner min-w-[76px] ${
                            isLight ? "bg-neutral-50 border-neutral-200" : "bg-black/40 border-white/10"
                          }`}>
                            {appt.date && (
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block border-b border-neutral-200 dark:border-white/5 pb-0.5 mb-1">
                                {apptFormattedDate}
                              </span>
                            )}
                            <span className="text-base font-bold text-[#C89B58] block">
                              {appt.time}
                            </span>
                            <span className="text-[10px] text-neutral-400 block mt-0.5">
                              {appt.service_duration} min
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="font-bold text-sm font-serif">
                                {appt.customer_name}
                              </h3>
                              <span
                                className={`text-[9px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                                  isCancelled
                                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                    : isCompleted
                                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                      : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                }`}
                              >
                                {appt.status}
                              </span>
                            </div>

                            <p className="text-xs text-[#C89B58] font-medium flex items-center gap-2">
                              <Scissors className="w-3.5 h-3.5 shrink-0" />
                              <span>{appt.service_name}</span>
                              <span>•</span>
                              <span className="font-mono font-bold">{appt.service_price}</span>
                            </p>

                            <div className="flex items-center gap-3 text-xs text-neutral-400 pt-0.5">
                              <a
                                href={`tel:${appt.customer_phone?.replace(/\s/g, "")}`}
                                className="flex items-center gap-1 hover:text-[#C89B58] transition-colors"
                              >
                                <Phone className="w-3 h-3 text-[#C89B58]" /> {appt.customer_phone}
                              </a>
                              {appt.customer_notes && (
                                <span className="italic line-clamp-1">
                                  "{appt.customer_notes}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Controls */}
                        <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-200 dark:border-white/5 flex-wrap">
                          {appt.customer_phone && appt.customer_phone !== "---" && (
                            <a
                              href={`https://wa.me/${appt.customer_phone.replace(/\D/g, "")}?text=${whatsAppClientText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(appt)}
                            className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          {!isCompleted && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(appt.id, "completed")}
                              className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Concluir</span>
                            </button>
                          )}

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(appt.id, "confirmed")}
                              className="px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Reabrir</span>
                            </button>
                          )}

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                              className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-red-500/15 border border-neutral-200 dark:border-white/10 hover:border-red-500/30 text-neutral-400 hover:text-red-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancelar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(appt.id)}
                            className="p-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-red-500/20 border border-neutral-200 dark:border-white/10 hover:border-red-500/30 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Eliminar"
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
          )}

          {/* ========================================================================= */}
          {/* TAB: FATURAÇÃO & MÉTRICAS (EXECUTIVE ANALYTICS & REVENUE)                 */}
          {/* ========================================================================= */}
          {activeTab === "stats" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header & Period Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Faturação & Métricas</h1>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Análise financeira, rentabilidade por serviço e comportamento de clientes.
                  </p>
                </div>

                {/* Period Pills */}
                <div className={`flex items-center gap-1 p-1 rounded-2xl border overflow-x-auto ${
                  isLight ? "bg-white border-neutral-200 shadow-xs" : "bg-[#111319] border-white/10"
                }`}>
                  {[
                    { id: "today", label: "Hoje" },
                    { id: "week", label: "Esta Semana" },
                    { id: "month", label: "Este Mês" },
                    { id: "30days", label: "Últimos 30 Dias" },
                    { id: "all", label: "Total Histórico" }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setStatsPeriod(p.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        statsPeriod === p.id
                          ? "bg-[#C89B58] text-black shadow-xs font-bold"
                          : "text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Top KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Faturação Concluída */}
                <div className={`p-5 rounded-3xl border transition-all shadow-xs space-y-3 ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">Faturação Real</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{statsData.completedCount} cortes</span>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#C89B58]">
                      {statsData.completedRevenue.toFixed(2)} €
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Previsto com agendamentos: <strong className="text-neutral-300 font-mono">{statsData.estimatedRevenue.toFixed(2)} €</strong>
                    </p>
                  </div>
                </div>

                {/* 2. Total de Atendimentos */}
                <div className={`p-5 rounded-3xl border transition-all shadow-xs space-y-3 ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">Total Marcações</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {statsData.uniqueClientsCount} clientes
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">
                      {statsData.total}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {statsData.confirmedCount} confirmados em carteira
                    </p>
                  </div>
                </div>

                {/* 3. Ticket Médio */}
                <div className={`p-5 rounded-3xl border transition-all shadow-xs space-y-3 ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">Ticket Médio / Cliente</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Média
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">
                      {statsData.avgTicket.toFixed(2)} €
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Rendimento médio por marcação
                    </p>
                  </div>
                </div>

                {/* 4. Taxa de Comparência */}
                <div className={`p-5 rounded-3xl border transition-all shadow-xs space-y-3 ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">Taxa de Comparência</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {statsData.completionRate}%
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">
                      {statsData.completionRate}%
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {statsData.cancelledCount} cancelamentos registados
                    </p>
                  </div>
                </div>
              </div>

              {/* Middle Section Grid: Revenue Chart (8 cols) & Side Widgets (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Large Chart Card (8 cols) */}
                <div className={`lg:col-span-8 p-6 rounded-3xl border shadow-xs space-y-5 flex flex-col justify-between ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">Evolução de Faturação</h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#C89B58]/15 text-[#C89B58] border border-[#C89B58]/30">
                          {statsPeriod === "today" ? "Hoje" : statsPeriod === "week" ? "Semanal" : statsPeriod === "month" ? "Mensal" : statsPeriod === "30days" ? "30 Dias" : "Geral"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Receita diária acumulada ao longo do período selecionado.
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-neutral-400 block">Total no Período</span>
                      <span className="text-lg font-mono font-bold text-[#C89B58]">
                        {statsData.completedRevenue.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* High-Resolution SVG Chart with Bezier curve, horizontal grid lines & Y-Axis labels */}
                  {statsData.timelineData.length === 0 ? (
                    <div className="py-20 text-center text-xs text-neutral-400">
                      Sem dados suficientes de faturação para este período.
                    </div>
                  ) : (
                    <div className="space-y-3 relative">
                      {/* Floating Tooltip when hovering any point */}
                      {hoveredChartPoint && (
                        <div
                          className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-black/90 border border-white/20 text-white shadow-2xl backdrop-blur-md text-[11px] whitespace-nowrap transition-all"
                          style={{
                            left: `${(hoveredChartPoint.x / statsData.chartW) * 100}%`,
                            top: `${(hoveredChartPoint.y / statsData.chartH) * 100}%`
                          }}
                        >
                          <p className="font-bold text-neutral-300">{hoveredChartPoint.fullLabel || hoveredChartPoint.date}</p>
                          <p className="font-mono font-bold text-[#C89B58] text-xs">
                            {hoveredChartPoint.revenue.toFixed(2)} €
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            {hoveredChartPoint.count} {hoveredChartPoint.count === 1 ? "marcação" : "marcações"}
                          </p>
                        </div>
                      )}

                      <div className="w-full relative">
                        <svg
                          className="w-full h-52 overflow-visible"
                          viewBox={`0 0 ${statsData.chartW} ${statsData.chartH}`}
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="execRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#C89B58" stopOpacity="0.45" />
                              <stop offset="50%" stopColor="#C89B58" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#C89B58" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Grid Lines & Y-Axis Ticks */}
                          {statsData.gridLevels.map((lvl, idx) => (
                            <g key={idx}>
                              <line
                                x1={statsData.padL}
                                y1={lvl.y}
                                x2={statsData.chartW - statsData.padR}
                                y2={lvl.y}
                                stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)"}
                                strokeDasharray="3 3"
                                strokeWidth="1"
                              />
                              <text
                                x={statsData.padL - 8}
                                y={lvl.y + 3.5}
                                textAnchor="end"
                                fontSize="9"
                                fill={isLight ? "#9CA3AF" : "#6B7280"}
                                fontFamily="monospace"
                              >
                                {lvl.val.toFixed(0)}€
                              </text>
                            </g>
                          ))}

                          {/* Area Fill */}
                          {statsData.chartAreaPath && (
                            <path d={statsData.chartAreaPath} fill="url(#execRevenueGrad)" />
                          )}

                          {/* Spline Stroke Line */}
                          {statsData.chartSvgPath && (
                            <path
                              d={statsData.chartSvgPath}
                              fill="none"
                              stroke="#C89B58"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}

                          {/* Data Points on Curve with Hover Effects */}
                          {statsData.chartPoints.map((pt, i) => (
                            <g
                              key={i}
                              className="cursor-pointer group"
                              onMouseEnter={() => setHoveredChartPoint(pt)}
                              onMouseLeave={() => setHoveredChartPoint(null)}
                            >
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="4.5"
                                fill="#C89B58"
                                stroke={isLight ? "#FFFFFF" : "#111319"}
                                strokeWidth="2"
                                className="transition-transform group-hover:scale-150"
                              />
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="12"
                                fill="transparent"
                              />
                            </g>
                          ))}
                        </svg>
                      </div>

                      {/* X-Axis Date Labels */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-2 border-t border-neutral-100 dark:border-white/5 pl-10 pr-4">
                        {statsData.timelineData.length <= 8 ? (
                          statsData.timelineData.map((d) => (
                            <span key={d.date}>{d.label || d.date}</span>
                          ))
                        ) : (
                          <>
                            <span>{statsData.timelineData[0]?.label}</span>
                            <span>{statsData.timelineData[Math.floor(statsData.timelineData.length / 3)]?.label}</span>
                            <span>{statsData.timelineData[Math.floor((statsData.timelineData.length * 2) / 3)]?.label}</span>
                            <span>{statsData.timelineData[statsData.timelineData.length - 1]?.label}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Service Composition Segment Bar */}
                  {statsData.serviceRanking.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-neutral-100 dark:border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400 font-medium">Distribuição por Tipo de Serviço</span>
                        <span className="text-[11px] font-mono font-bold text-[#C89B58]">
                          {statsData.serviceRanking.length} categorias
                        </span>
                      </div>

                      {/* Proportional horizontal bar */}
                      <div className="h-3 w-full rounded-full bg-neutral-100 dark:bg-white/5 flex overflow-hidden p-0.5 gap-0.5">
                        {statsData.serviceRanking.map((s) => (
                          <div
                            key={s.name}
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(s.percent, 3)}%`,
                              backgroundColor: s.hex || s.color
                            }}
                            title={`${s.name}: ${s.revenue.toFixed(2)} € (${s.percent}%)`}
                          />
                        ))}
                      </div>

                      {/* Chips */}
                      <div className="flex items-center gap-3 flex-wrap pt-1 text-[11px]">
                        {statsData.serviceRanking.slice(0, 4).map((s) => (
                          <div key={s.name} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.hex || s.color }} />
                            <span className="text-neutral-300 font-medium truncate">{s.name}:</span>
                            <span className="font-mono font-bold text-neutral-400">{s.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Side Column Widgets (4 cols) */}
                <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
                  {/* Widget 1: Dias Mais Ativos (Bar Chart) */}
                  <div className={`p-6 rounded-3xl border shadow-xs space-y-4 ${
                    isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">Dias Mais Ativos</h4>
                      <span className="text-[10px] font-bold text-[#C89B58] uppercase">Seg - Sáb</span>
                    </div>

                    <div className="grid grid-cols-6 gap-2 items-end h-32 pt-2">
                      {statsData.daysActivity.map((d) => {
                        const isPeak = d.count === statsData.maxDayCount && d.count > 0;
                        const heightPct = statsData.maxDayCount > 0
                          ? Math.max((d.count / statsData.maxDayCount) * 100, d.count > 0 ? 22 : 10)
                          : 10;

                        return (
                          <div key={d.label} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                            {/* Value badge over peak */}
                            {isPeak && (
                              <span className="text-[9px] font-mono font-bold text-[#C89B58] bg-[#C89B58]/15 px-1 py-0.2 rounded-md">
                                {d.count}
                              </span>
                            )}
                            <div className="w-full rounded-xl bg-neutral-100 dark:bg-white/5 relative flex items-end justify-center h-full overflow-hidden">
                              <div
                                className={`w-full rounded-xl transition-all duration-500 ${
                                  isPeak
                                    ? "bg-[#C89B58] shadow-md shadow-[#C89B58]/30"
                                    : d.count > 0
                                      ? "bg-[#C89B58]/40 hover:bg-[#C89B58]/60"
                                      : "bg-neutral-200 dark:bg-white/10"
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-bold ${isPeak ? "text-[#C89B58]" : "text-neutral-400"}`}>
                              {d.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className={`p-3 rounded-2xl border text-center text-xs ${
                      isLight ? "bg-neutral-50 border-neutral-200" : "bg-black/30 border-white/5"
                    }`}>
                      <p className="text-neutral-400">
                        Pico de movimento: <strong className="text-[#C89B58] font-bold">{statsData.peakDay?.name || "Sábado"}</strong>
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {statsData.peakDay?.count || 0} cortes • {(statsData.peakDay?.revenue || 0).toFixed(2)} €
                      </p>
                    </div>
                  </div>

                  {/* Widget 2: Taxa de Retenção de Clientes (Radial Gauge) */}
                  <div className={`p-6 rounded-3xl border shadow-xs space-y-3 text-center ${
                    isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                  }`}>
                    <div className="flex items-center justify-between text-left">
                      <h4 className="font-bold text-sm">Fidelização de Clientes</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                        Recorrentes
                      </span>
                    </div>

                    {/* Semi-circular Speedometer Arc */}
                    <div className="relative w-36 h-20 mx-auto mt-2 flex items-center justify-center">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 55">
                        {/* Background track arc */}
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke={isLight ? "#E5E7EB" : "rgba(255,255,255,0.08)"}
                          strokeWidth="10"
                          strokeLinecap="round"
                        />
                        {/* Foreground value arc */}
                        <path
                          d="M 10 50 A 40 40 0 0 1 90 50"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="10"
                          strokeDasharray={`${(statsData.repeatRate / 100) * 125.6} 125.6`}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 text-center">
                        <span className="text-2xl font-mono font-bold text-emerald-500 leading-none">
                          {statsData.repeatRate}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-400">
                      Clientes que agendam 2 ou mais vezes na barbearia.
                    </p>

                    <button
                      type="button"
                      onClick={() => setActiveTab("crm")}
                      className={`w-full py-2.5 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                        isLight
                          ? "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      }`}
                    >
                      Ver Base de Clientes (CRM)
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Row Grid: Service Ranking Table (7 cols) & Donut Mix (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Ranking de Rentabilidade de Serviços (7 cols - Inspired by Image 1) */}
                <div className={`lg:col-span-7 p-6 rounded-3xl border shadow-xs space-y-4 ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base">Ranking de Rentabilidade por Serviço</h3>
                      <p className="text-xs text-neutral-400">
                        Volume, receita gerada e rendimento por cada 60 minutos de cadeira.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#C89B58]">
                      {statsData.serviceRanking.length} Serviços
                    </span>
                  </div>

                  {statsData.serviceRanking.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400">
                      Sem marcações no período selecionado.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {statsData.serviceRanking.map((s, idx) => (
                        <div
                          key={s.name}
                          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                            isLight ? "bg-neutral-50 hover:bg-white border-neutral-200" : "bg-black/30 hover:bg-white/5 border-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="w-7 h-7 rounded-xl bg-[#C89B58]/20 text-[#C89B58] text-xs font-bold font-mono flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate">{s.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                                <span>{s.count} {s.count === 1 ? "marcação" : "marcações"}</span>
                                <span>•</span>
                                <span>{s.durationMin} min</span>
                                <span>•</span>
                                <span className="font-mono text-[#C89B58]">{s.percent}% total</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-sm text-[#C89B58] block">
                              {s.revenue.toFixed(2)} €
                            </span>
                            <span className="text-[10px] font-mono text-emerald-500 font-bold">
                              {s.hourlyYield.toFixed(0)} € / hora
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Donut Mix (5 cols) */}
                <div className={`lg:col-span-5 p-6 rounded-3xl border shadow-xs space-y-4 flex flex-col justify-between ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base">Mix de Faturação</h3>
                      <p className="text-xs text-neutral-400">Distribuição percentual por serviço.</p>
                    </div>
                    <PieChart className="w-4 h-4 text-[#C89B58]" />
                  </div>

                  {statsData.serviceRanking.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400">
                      Sem dados no período.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Donut graphic */}
                      <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                          <circle
                            cx="80"
                            cy="80"
                            r="60"
                            className={isLight ? "stroke-neutral-100" : "stroke-white/5"}
                            strokeWidth="16"
                            fill="transparent"
                          />
                          {statsData.serviceRanking.map((s) => {
                            const isHovered = hoveredService === s.name;
                            const r = 60;
                            const circ = 2 * Math.PI * r;
                            const dashL = Math.max((s.exactPercent / 100) * circ, s.exactPercent > 0 ? 3 : 0);
                            const dashOff = -(s.dashOffset / statsData.perimeter) * circ;

                            return (
                              <circle
                                key={s.name}
                                cx="80"
                                cy="80"
                                r="60"
                                fill="transparent"
                                stroke={s.color}
                                strokeWidth={isHovered ? "20" : "16"}
                                strokeDasharray={`${dashL} ${circ}`}
                                strokeDashoffset={dashOff}
                                strokeLinecap="round"
                                className="transition-all duration-300 cursor-pointer"
                                onMouseEnter={() => setHoveredService(s.name)}
                                onMouseLeave={() => setHoveredService(null)}
                              />
                            );
                          })}
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-3">
                          <span className="text-[10px] uppercase font-bold text-neutral-400">
                            Faturado Real
                          </span>
                          <span className="text-lg font-mono font-bold mt-0.5 text-[#C89B58]">
                            {statsData.completedRevenue.toFixed(2)} €
                          </span>
                        </div>
                      </div>

                      {/* Legend List */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {statsData.serviceRanking.map((s) => (
                          <div
                            key={s.name}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              isLight ? "bg-neutral-50 border-neutral-200" : "bg-black/30 border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                              <span className="font-bold truncate">{s.name}</span>
                            </div>
                            <span className="font-mono font-bold text-[#C89B58] shrink-0">
                              {s.percent}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: BASE DE CLIENTES (CRM)                                               */}
          {/* ========================================================================= */}
          {activeTab === "crm" && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
              }`}>
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#C89B58]" />
                    <span>Base de Clientes & Fidelização</span>
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Histórico de atendimentos, ticket médio e fidelidade.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome ou telemóvel..."
                    value={crmSearchQuery}
                    onChange={(e) => setCrmSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                      isLight ? "bg-neutral-100 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                    }`}
                  />
                </div>
              </div>

              {crmClients.length === 0 ? (
                <div className={`p-14 text-center rounded-3xl border space-y-2 ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <Users className="w-10 h-10 text-neutral-400 mx-auto opacity-40" />
                  <h3 className="text-sm font-bold">Nenhum cliente encontrado</h3>
                  <p className="text-xs text-neutral-400">
                    {crmSearchQuery ? "Nenhum resultado corresponde à pesquisa." : "Ainda não existem clientes registados."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {crmClients.map((client) => {
                    const whatsAppChatUrl = client.phone && client.phone !== "---"
                      ? `https://wa.me/${client.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Olá ${client.name}! Daqui é o Gabriel Silva da Rota Do Corte.`
                        )}`
                      : null;

                    return (
                      <div
                        key={client.key}
                        className={`p-5 rounded-3xl border transition-all space-y-3.5 shadow-xs flex flex-col justify-between ${
                          isLight ? "bg-white border-neutral-200 hover:border-[#C89B58]" : "bg-[#111319] border-white/10 hover:border-[#C89B58]"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-2xl bg-[#C89B58]/20 text-[#C89B58] font-bold text-xs flex items-center justify-center">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm leading-tight">{client.name}</h4>
                                {client.phone && client.phone !== "---" && (
                                  <span className="text-[11px] font-mono text-neutral-400">
                                    {client.phone}
                                  </span>
                                )}
                              </div>
                            </div>

                            {client.isVip && (
                              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#C89B58]/20 text-[#C89B58] flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-[#C89B58]" />
                                <span>VIP</span>
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                            <div className={`p-2 rounded-xl border ${isLight ? "bg-neutral-50 border-neutral-200" : "bg-black/30 border-white/5"}`}>
                              <span className="text-[9px] uppercase text-neutral-400 block">Visitas</span>
                              <span className="text-xs font-mono font-bold">{client.totalBookings}</span>
                            </div>
                            <div className={`p-2 rounded-xl border ${isLight ? "bg-neutral-50 border-neutral-200" : "bg-black/30 border-white/5"}`}>
                              <span className="text-[9px] uppercase text-neutral-400 block">Total</span>
                              <span className="text-xs font-mono font-bold text-[#C89B58]">{client.totalSpent.toFixed(0)} €</span>
                            </div>
                            <div className={`p-2 rounded-xl border ${isLight ? "bg-neutral-50 border-neutral-200" : "bg-black/30 border-white/5"}`}>
                              <span className="text-[9px] uppercase text-neutral-400 block">Ticket</span>
                              <span className="text-xs font-mono font-bold">{client.avgTicket.toFixed(0)} €</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-neutral-400 space-y-1">
                            <p className="flex items-center gap-1.5">
                              <Scissors className="w-3 h-3 text-[#C89B58]" />
                              <span>Favorito: <strong>{client.favService}</strong></span>
                            </p>
                            {client.lastVisit && (
                              <p className="flex items-center gap-1.5 text-[10px]">
                                <Clock className="w-3 h-3" />
                                <span>Última visita: {new Date(client.lastVisit).toLocaleDateString("pt-PT")}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {whatsAppChatUrl && (
                          <a
                            href={whatsAppChatUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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

          {/* ========================================================================= */}
          {/* TAB: PAUSAS & BLOQUEIOS                                                   */}
          {/* ========================================================================= */}
          {activeTab === "blocks" && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-6 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
              }`}>
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#C89B58]" />
                    <span>Gestão de Pausas & Bloqueios</span>
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Defina horários de almoço, folgas e períodos indisponíveis para o público.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-[#C89B58] text-black text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Bloqueio</span>
                </button>
              </div>

              {allAppointments.filter((a) => a.status === "blocked").length === 0 ? (
                <div className={`p-14 text-center rounded-3xl border space-y-2 ${
                  isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
                }`}>
                  <Lock className="w-10 h-10 text-neutral-400 mx-auto opacity-40" />
                  <h3 className="text-sm font-bold">Sem bloqueios ativos</h3>
                  <p className="text-xs text-neutral-400">
                    Todos os horários comerciais estão abertos ao público.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allAppointments
                    .filter((a) => a.status === "blocked")
                    .map((block) => (
                      <div
                        key={block.id}
                        className="p-5 rounded-3xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-2 rounded-2xl bg-amber-500/20 text-amber-500 font-mono font-bold text-xs">
                            {block.time}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-amber-500">{block.customer_name}</h4>
                            <p className="text-[10px] text-neutral-400">{block.date} • {block.service_duration} min</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAppointment(block.id, true)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/15 text-red-500 hover:bg-red-500/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Desbloquear</span>
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
      {/* MODAL 1: MARCAR CLIENTE (MANUAL BOOKING)                                   */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            setIsTimeDropdownOpen(false);
            setIsServiceDropdownOpen(false);
          }}
        >
          <div
            className={`relative max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 my-auto border ${
              isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Marcar Cliente Manualmente</h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Telemóvel / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+351 9xx xxx xxx"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                      isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                    Serviço *
                  </label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-medium rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                      isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-[#111319] border-white/10 text-white"
                    }`}
                  >
                    {servicesData.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#111319] text-white">
                        {s.name} ({s.priceFormatted})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Notas / Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Corte à tesoura e barba desenhada"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-2xl bg-[#C89B58] hover:bg-[#D4A966] text-black cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSavingManual ? "A Guardar..." : "Confirmar Marcação"}
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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            setIsEditTimeDropdownOpen(false);
            setIsEditServiceDropdownOpen(false);
          }}
        >
          <div
            className={`relative max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 my-auto border ${
              isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Editar Marcação</h3>
              <button
                type="button"
                onClick={() => setEditingAppt(null)}
                className="w-8 h-8 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Telemóvel / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                      isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                      isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                    Serviço *
                  </label>
                  <select
                    value={editServiceId}
                    onChange={(e) => setEditServiceId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-medium rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                      isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-[#111319] border-white/10 text-white"
                    }`}
                  >
                    {servicesData.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#111319] text-white">
                        {s.name} ({s.priceFormatted})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                    Estado *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-medium rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                      isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-[#111319] border-white/10 text-white"
                    }`}
                  >
                    <option value="confirmed">Confirmado</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Notas / Observações
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#C89B58] ${
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-neutral-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => handleDeleteAppointment(editingAppt.id)}
                  className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAppt(null)}
                    className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-2xl bg-[#C89B58] hover:bg-[#D4A966] text-black cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSavingEdit ? "A Guardar..." : "Guardar Alterações"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BLOQUEAR HORÁRIO / PAUSA                                         */}
      {/* ========================================================================= */}
      {isBlockModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsBlockModalOpen(false)}
        >
          <div
            className={`relative max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 my-auto border ${
              isLight ? "bg-white border-neutral-200" : "bg-[#111319] border-white/10"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <h3 className="font-serif text-lg font-bold">Bloquear Horário / Pausa</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="w-8 h-8 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              O horário selecionado ficará indisponível para marcações de clientes.
            </p>

            <form onSubmit={handleCreateBlock} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Data a Bloquear *
                </label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                    Hora Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                    Hora Fim *
                  </label>
                  <input
                    type="time"
                    required
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 uppercase block mb-1">
                  Motivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pausa de Almoço / Formação / Assuntos Pessoais"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isLight ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-black/40 border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlock}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-50"
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
