import { useState, useEffect } from "react";
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
  Trash2
} from "lucide-react";
import { WhatsAppIcon } from "../components/WhatsAppButton";
import {
  getLocalAppointments,
  saveLocalAppointments,
  updateAppointment,
  deleteAppointment,
  isSupabaseConfigured,
  supabase
} from "../lib/supabase";
import { servicesData, shopInfo } from "../data/services";

export default function AdminAgenda() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("timeline"); // 'timeline' or 'table'

  // New manual appointment modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualTime, setManualTime] = useState("11:00");
  const [manualServiceId, setManualServiceId] = useState("corte-barba-terapia");
  const [manualNotes, setManualNotes] = useState("");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);

  // Edit appointment modal state
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
  const [editFeedback, setEditFeedback] = useState("");

  // Block slot modal
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockStart, setBlockStart] = useState("13:00");
  const [blockEnd, setBlockEnd] = useState("14:30");
  const [blockReason, setBlockReason] = useState("Pausa / Formação");

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
    setEditFeedback("");
    setIsEditTimeDropdownOpen(false);
    setIsEditServiceDropdownOpen(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAppt) return;
    setIsSavingEdit(true);
    setEditFeedback("");

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
    } else {
      setEditFeedback("Erro ao guardar alterações. Por favor tente novamente.");
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm("Deseja eliminar esta marcação permanentemente?")) {
      await deleteAppointment(id);
      setEditingAppt(null);
      await loadAppointments();
    }
  };

  const loadAppointments = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("appointments")
          .select("*, services(*)")
          .gte("start_time", `${selectedDate}T00:00:00`)
          .lte("start_time", `${selectedDate}T23:59:59`)
          .order("start_time", { ascending: true });

        if (!error && data) {
          const mapped = data.map((d) => ({
            id: d.id,
            customer_name: d.customer_name,
            customer_phone: d.customer_phone,
            customer_email: d.customer_email,
            customer_notes: d.notes || d.customer_notes,
            service_name: d.services?.name || "Serviço",
            service_price: d.services?.price ? `${d.services.price} €` : "15,00 €",
            service_duration: d.services?.duration_minutes || 30,
            barber_name: "Gabriel Silva",
            date: selectedDate,
            time: new Date(d.start_time).toLocaleTimeString("pt-PT", {
              hour: "2-digit",
              minute: "2-digit"
            }),
            status: d.status
          }));
          setAppointments(mapped);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Error fetching Supabase appointments, using local storage:", err);
      }
    }

    // Local Persistence
    const local = getLocalAppointments();
    const dayAppointments = local.filter((a) => a.date === selectedDate);
    dayAppointments.sort((a, b) => a.time.localeCompare(b.time));
    setAppointments(dayAppointments);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  // 🔒 Lock body & html scroll when admin modal or edit modal is open
  useEffect(() => {
    if (isNewModalOpen || editingAppt) {
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
  }, [isNewModalOpen, editingAppt]);

  const changeDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("appointments")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", id);
      } catch (err) {
        console.error(err);
      }
    }

    const all = getLocalAppointments();
    const idx = all.findIndex((a) => a.id === id);
    if (idx !== -1) {
      all[idx].status = newStatus;
      saveLocalAppointments(all);
    }
    loadAppointments();
  };

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

  // Price Parser Helper
  const parsePrice = (price) => {
    if (typeof price === "number") return price;
    if (!price) return 0;
    const cleaned = String(price)
      .replace(/[^\d.,]/g, "")
      .replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Metrics
  const activeAppointments = appointments.filter((a) => a.status !== "cancelled");
  const confirmedAppointments = appointments.filter((a) => a.status === "confirmed");
  const completedAppointments = appointments.filter((a) => a.status === "completed");

  // 1. Faturação Concluída (Total Realizada - soma dos serviços com estado 'completed')
  const completedRevenue = completedAppointments.reduce((acc, curr) => {
    return acc + parsePrice(curr.service_price);
  }, 0);

  // 2. Faturação Prevista (Soma de todos os agendamentos ativos do dia)
  const estimatedRevenue = activeAppointments.reduce((acc, curr) => {
    return acc + parsePrice(curr.service_price);
  }, 0);

  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = filterStatus === "all" || a.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      a.customer_name?.toLowerCase().includes(query) ||
      a.customer_phone?.includes(query) ||
      a.service_name?.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  const formattedPortugueseDate = new Date(selectedDate).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#FAF8F5] p-4 sm:p-8 selection:bg-[#C89B58] selection:text-black pt-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Studio System Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
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
                {isSupabaseConfigured ? "Supabase Live Sync" : "Sistema Local Ativo"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadAppointments}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[#9E9EA7] hover:text-white transition-colors cursor-pointer"
              title="Atualizar Agenda"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

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

        {/* Date Navigator & Filter Control Bar */}
        <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
          {/* Day Stepper */}
          <div className="flex items-center gap-2">
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
            <span className="text-sm font-bold capitalize ml-2 text-white font-serif">
              {formattedPortugueseDate}
            </span>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9EA7]" />
              <input
                type="text"
                placeholder="Pesquisar cliente ou corte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#C89B58] w-full sm:w-48"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 overflow-x-auto p-0.5 bg-black/30 rounded-xl border border-white/5">
              {["all", "confirmed", "completed", "cancelled"].map((st) => (
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
                  {st === "all" ? "Todos" : st === "confirmed" ? "Confirmados" : st === "completed" ? "Concluídos" : "Cancelados"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Studio Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Marcações */}
          <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9E9EA7]">Total Marcações</p>
            <p className="text-2xl font-mono font-bold text-white">{appointments.length}</p>
          </div>

          {/* Confirmadas */}
          <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Confirmadas</p>
            <p className="text-2xl font-mono font-bold text-emerald-400">
              {confirmedAppointments.length}
            </p>
          </div>

          {/* Concluídas */}
          <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Concluídas</p>
            <p className="text-2xl font-mono font-bold text-sky-400">
              {completedAppointments.length}
            </p>
          </div>

          {/* Faturação Concluída (Total Realizada) */}
          <div className="p-4 rounded-2xl bg-[#111319] border border-sky-500/30 bg-gradient-to-br from-[#111319] to-sky-500/10 space-y-1 shadow-lg shadow-sky-500/5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Faturação Concluída</p>
            <p className="text-2xl font-mono font-bold text-sky-300">
              {completedRevenue.toFixed(2)} €
            </p>
          </div>

          {/* Faturação Prevista Total */}
          <div className="p-4 rounded-2xl bg-[#111319] border border-[#C89B58]/40 bg-gradient-to-br from-[#111319] to-[#C89B58]/15 space-y-1 shadow-lg shadow-[#C89B58]/10 col-span-2 sm:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#E5C268]">Faturação Prevista</p>
            <p className="text-2xl font-mono font-bold text-[#E5C268]">{estimatedRevenue.toFixed(2)} €</p>
          </div>
        </div>

        {/* Timeline List of Appointments */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-20 text-center space-y-3 bg-[#111319] rounded-2xl border border-white/10">
              <div className="w-9 h-9 border-2 border-[#C89B58] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#9E9EA7] font-mono">A carregar agendamentos do dia...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-14 text-center space-y-3 rounded-2xl bg-[#111319] border border-white/10">
              <CalendarIcon className="w-10 h-10 text-[#9E9EA7] mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-white">Nenhuma marcação encontrada</h3>
              <p className="text-xs text-[#9E9EA7] max-w-sm mx-auto">
                {searchQuery
                  ? "Nenhum resultado corresponde à sua pesquisa."
                  : `Não existem marcações registadas para ${formattedPortugueseDate}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appt) => {
                const isCancelled = appt.status === "cancelled";
                const isCompleted = appt.status === "completed";

                const whatsAppClientText = encodeURIComponent(
                  `Olá *${appt.customer_name}*! Confirmamos o seu agendamento na *Rota Do Corte* para *${formattedPortugueseDate}* às *${appt.time}* (${appt.service_name}). Até já! 💈✂️`
                );

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
                      {/* Time Badge */}
                      <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-center font-mono shrink-0 shadow-inner">
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
                      {appt.customer_phone && (
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
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                      )}

                      {/* Cancel */}
                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                          className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Manual Appointment Modal */}
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
                {/* Custom Time Selector Dropdown (30 min intervals) */}
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
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#C89B58] px-1 block mb-1.5">
                          🌅 Manhã (10:00 - 13:00)
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"].map((t) => {
                            const isSelected = manualTime === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setManualTime(t);
                                  setIsTimeDropdownOpen(false);
                                }}
                                className={`py-1.5 px-2 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer text-center ${
                                  isSelected
                                    ? "bg-[#C89B58] text-black shadow-md shadow-[#C89B58]/25 font-black scale-105"
                                    : "bg-white/5 hover:bg-white/15 text-[#FAF8F5] hover:text-[#E5C268]"
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-white/5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#C89B58] px-1 block mb-1.5">
                          ☀️ Tarde & Noite (14:00 - 22:00)
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                            "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
                            "20:00", "20:30", "21:00", "21:30"
                          ].map((t) => {
                            const isSelected = manualTime === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setManualTime(t);
                                  setIsTimeDropdownOpen(false);
                                }}
                                className={`py-1.5 px-2 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer text-center ${
                                  isSelected
                                    ? "bg-[#C89B58] text-black shadow-md shadow-[#C89B58]/25 font-black scale-105"
                                    : "bg-white/5 hover:bg-white/15 text-[#FAF8F5] hover:text-[#E5C268]"
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Service Selector Dropdown */}
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
                        {servicesData.find((s) => s.id === manualServiceId)?.name || "Selecionar Serviço"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[#E5C268] font-bold font-mono text-[11px]">
                        {servicesData.find((s) => s.id === manualServiceId)?.priceFormatted}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#9E9EA7] transition-transform duration-200 ${
                          isServiceDropdownOpen ? "rotate-180 text-[#C89B58]" : ""
                        }`}
                      />
                    </div>
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-white leading-tight">
                                  {s.name}
                                </span>
                                {s.badge && (
                                  <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold bg-[#C89B58]/25 text-[#E5C268] border border-[#C89B58]/35">
                                    {s.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#9E9EA7] flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-[#C89B58]" /> {s.duration}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs font-mono font-bold text-[#E5C268]">
                                {s.priceFormatted}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#E5C268]" />}
                            </div>
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
                  placeholder="Ex: Corte clássico / Barba alinhada"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#C89B58]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false);
                    setIsTimeDropdownOpen(false);
                    setIsServiceDropdownOpen(false);
                  }}
                  className="px-4 py-2 text-xs text-[#9E9EA7] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-pill-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Guardar Marcação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {editingAppt && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-fadeIn"
          onClick={() => {
            setIsEditTimeDropdownOpen(false);
            setIsEditServiceDropdownOpen(false);
          }}
        >
          <div 
            className="relative max-w-lg w-full bg-[#111319] border border-[#C89B58]/40 rounded-3xl p-6 shadow-2xl space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#C89B58]" />
                <h3 className="font-serif text-xl font-bold text-white">
                  Editar Marcação
                </h3>
              </div>
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

            {editFeedback && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFeedback}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
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

                {/* Phone */}
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Data da Marcação *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#C89B58] [color-scheme:dark]"
                  />
                </div>

                {/* Time with Custom 30-min Slot Selector */}
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
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#C89B58] px-1 block mb-1.5">
                          🌅 Manhã (10:00 - 13:00)
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"].map((t) => {
                            const isSelected = editTime === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setEditTime(t);
                                  setIsEditTimeDropdownOpen(false);
                                }}
                                className={`py-1.5 px-2 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer text-center ${
                                  isSelected
                                    ? "bg-[#C89B58] text-black shadow-md shadow-[#C89B58]/25 font-black scale-105"
                                    : "bg-white/5 hover:bg-white/15 text-[#FAF8F5] hover:text-[#E5C268]"
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-white/5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#C89B58] px-1 block mb-1.5">
                          ☀️ Tarde & Noite (14:00 - 22:00)
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                            "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
                            "20:00", "20:30", "21:00", "21:30"
                          ].map((t) => {
                            const isSelected = editTime === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setEditTime(t);
                                  setIsEditTimeDropdownOpen(false);
                                }}
                                className={`py-1.5 px-2 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer text-center ${
                                  isSelected
                                    ? "bg-[#C89B58] text-black shadow-md shadow-[#C89B58]/25 font-black scale-105"
                                    : "bg-white/5 hover:bg-white/15 text-[#FAF8F5] hover:text-[#E5C268]"
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[#E5C268] font-bold font-mono text-[11px]">
                        {servicesData.find((s) => s.id === editServiceId)?.priceFormatted}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#9E9EA7] transition-transform duration-200 ${
                          isEditServiceDropdownOpen ? "rotate-180 text-[#C89B58]" : ""
                        }`}
                      />
                    </div>
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-white leading-tight">
                                  {s.name}
                                </span>
                                {s.badge && (
                                  <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold bg-[#C89B58]/25 text-[#E5C268] border border-[#C89B58]/35">
                                    {s.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#9E9EA7] flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-[#C89B58]" /> {s.duration}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs font-mono font-bold text-[#E5C268]">
                                {s.priceFormatted}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#E5C268]" />}
                            </div>
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

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Notas / Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Corte clássico / Barba alinhada"
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
                    onClick={() => {
                      setEditingAppt(null);
                      setIsEditTimeDropdownOpen(false);
                      setIsEditServiceDropdownOpen(false);
                    }}
                    className="px-4 py-2 text-xs text-[#9E9EA7] hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="btn-pill-gold px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEdit ? "A Guardar..." : "Guardar Alterações"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
