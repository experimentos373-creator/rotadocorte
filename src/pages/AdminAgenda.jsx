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
  ExternalLink
} from "lucide-react";
import { WhatsAppIcon } from "../components/WhatsAppButton";
import {
  getLocalAppointments,
  saveLocalAppointments,
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

  // Block slot modal
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockStart, setBlockStart] = useState("13:00");
  const [blockEnd, setBlockEnd] = useState("14:30");
  const [blockReason, setBlockReason] = useState("Pausa / Formação");

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

  // 🔒 Lock body & html scroll when admin modal is open
  useEffect(() => {
    if (isNewModalOpen) {
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
  }, [isNewModalOpen]);

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

  // Metrics
  const activeAppointments = appointments.filter((a) => a.status !== "cancelled");
  const completedAppointments = appointments.filter((a) => a.status === "completed");
  const estimatedRevenue = activeAppointments.reduce((acc, curr) => {
    const val = parseFloat((curr.service_price || "").replace("€", "").replace(",", ".")) || 15;
    return acc + val;
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9E9EA7]">Total Marcações</p>
            <p className="text-2xl font-mono font-bold text-white">{appointments.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Confirmadas</p>
            <p className="text-2xl font-mono font-bold text-emerald-400">
              {appointments.filter((a) => a.status === "confirmed").length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#111319] border border-white/10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Concluídas</p>
            <p className="text-2xl font-mono font-bold text-sky-400">
              {completedAppointments.length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#111319] border border-[#C89B58]/30 bg-gradient-to-br from-[#111319] to-[#C89B58]/10 space-y-1">
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
                    <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="relative max-w-md w-full bg-[#111319] border border-[#C89B58]/40 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
            <h3 className="font-serif text-xl font-bold text-white">Marcar Novo Cliente</h3>
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#C89B58]"
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#C89B58]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Horário (30 min)
                  </label>
                  <input
                    type="time"
                    required
                    step="1800"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#C89B58]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Serviço
                  </label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-[#181B24] border border-white/10 text-white focus:outline-none focus:border-[#C89B58]"
                  >
                    {servicesData.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.priceFormatted})
                      </option>
                    ))}
                  </select>
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
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#C89B58]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#9E9EA7] hover:text-white"
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
    </div>
  );
}
