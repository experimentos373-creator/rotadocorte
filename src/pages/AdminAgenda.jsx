import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Euro,
  Lock,
  ArrowLeft
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

  // New manual appointment modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualTime, setManualTime] = useState("11:00");
  const [manualServiceId, setManualServiceId] = useState("corte-barba-terapia");

  const loadAppointments = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("appointments")
          .select("*, services(*), barbers(*)")
          .gte("start_time", `${selectedDate}T00:00:00`)
          .lte("start_time", `${selectedDate}T23:59:59`)
          .order("start_time", { ascending: true });

        if (!error && data) {
          const mapped = data.map((d) => ({
            id: d.id,
            customer_name: d.customer_name,
            customer_phone: d.customer_phone,
            customer_email: d.customer_email,
            customer_notes: d.customer_notes,
            service_name: d.services?.name || "Serviço",
            service_price: d.services?.price ? `${d.services.price} €` : "15,00 €",
            service_duration: d.services?.duration_minutes || 30,
            barber_name: d.barbers?.name || "Gabriel Silva",
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

    // Fallback Local
    const local = getLocalAppointments();
    const dayAppointments = local.filter((a) => a.date === selectedDate);
    dayAppointments.sort((a, b) => a.time.localeCompare(b.time));
    setAppointments(dayAppointments);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

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
    if (filterStatus === "all") return true;
    return a.status === filterStatus;
  });

  const formattedPortugueseDate = new Date(selectedDate).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="min-h-screen bg-[#07080A] text-[#FAF8F5] p-4 sm:p-8 selection:bg-[#C89B58] selection:text-black pt-24">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Bar with Return to Website */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#9E9EA7] hover:text-[#E5C268] transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Website</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                Agenda de Marcações
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-[#C89B58]/20 text-[#E5C268] border border-[#C89B58]/30">
                P&D Booking
              </span>
            </div>
            <p className="text-xs text-[#9E9EA7]">
              {shopInfo.name} • Paião • Gabriel Silva
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAppointments}
              className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[#9E9EA7] hover:text-white transition-colors cursor-pointer"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="btn-pill-gold px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#C89B58]/10"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Marcação</span>
            </button>
          </div>
        </div>

        {/* Date Navigator Bar */}
        <div className="p-4 rounded-2xl bg-[#111318] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeDay(-1)}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              className="px-3 py-1.5 rounded-xl border border-[#C89B58]/30 bg-[#C89B58]/10 hover:bg-[#C89B58]/20 text-[#E5C268] text-xs font-bold cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => changeDay(1)}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold capitalize ml-2">
              {formattedPortugueseDate}
            </span>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["all", "confirmed", "completed", "cancelled"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  filterStatus === st
                    ? "bg-[#C89B58] text-black shadow-sm"
                    : "bg-white/5 text-[#9E9EA7] hover:text-white"
                }`}
              >
                {st === "all" ? "Todos" : st === "confirmed" ? "Confirmados" : st === "completed" ? "Concluídos" : "Cancelados"}
              </button>
            ))}
          </div>
        </div>

        {/* Quick KPI Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#111318] border border-white/10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9E9EA7]">Total Marcações</p>
            <p className="text-2xl font-mono font-bold text-white">{appointments.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#111318] border border-white/10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-green-400">Confirmadas</p>
            <p className="text-2xl font-mono font-bold text-green-400">
              {appointments.filter((a) => a.status === "confirmed").length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#111318] border border-white/10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Concluídas</p>
            <p className="text-2xl font-mono font-bold text-blue-400">
              {completedAppointments.length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#111318] border border-[#C89B58]/30 bg-gradient-to-br from-[#111318] to-[#C89B58]/10 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#E5C268]">Faturação Prevista</p>
            <p className="text-2xl font-mono font-bold text-[#E5C268]">{estimatedRevenue.toFixed(2)} €</p>
          </div>
        </div>

        {/* Appointments List / Timeline */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#C89B58] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#9E9EA7]">A carregar marcações...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center space-y-3 rounded-2xl bg-[#111318] border border-white/10">
              <Calendar className="w-10 h-10 text-[#9E9EA7] mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-white">Nenhuma marcação encontrada para este dia</h3>
              <p className="text-xs text-[#9E9EA7] max-w-sm mx-auto">
                Todos os horários estão livres ou nenhum cliente agendou ainda para {formattedPortugueseDate}.
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
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCancelled
                        ? "bg-red-950/10 border-red-500/20 opacity-60"
                        : isCompleted
                          ? "bg-blue-950/10 border-blue-500/20"
                          : "bg-[#111318] border-white/10 hover:border-[#C89B58]/40"
                    }`}
                  >
                    {/* Left: Time & Customer */}
                    <div className="flex items-start gap-4">
                      <div className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-center font-mono shrink-0">
                        <span className="text-base font-bold text-[#E5C268] block">
                          {appt.time}
                        </span>
                        <span className="text-[10px] text-[#9E9EA7]">
                          {appt.service_duration} min
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">
                            {appt.customer_name}
                          </h3>
                          <span
                            className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                              isCancelled
                                ? "bg-red-500/20 text-red-400"
                                : isCompleted
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>

                        <p className="text-xs text-[#C89B58] font-medium">
                          {appt.service_name} • <span className="font-mono">{appt.service_price}</span>
                        </p>

                        <div className="flex items-center gap-3 text-xs text-[#9E9EA7]">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#9E9EA7]" /> {appt.customer_phone}
                          </span>
                          {appt.customer_notes && (
                            <span className="italic text-[#9E9EA7] line-clamp-1">
                              "{appt.customer_notes}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {/* WhatsApp 1-Click Reminder */}
                      {appt.customer_phone && (
                        <a
                          href={`https://wa.me/${appt.customer_phone.replace(/\D/g, "")}?text=${whatsAppClientText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] text-xs font-bold flex items-center gap-1.5 transition-colors"
                          title="Enviar WhatsApp ao Cliente"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      )}

                      {/* Status Buttons */}
                      {!isCompleted && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(appt.id, "completed")}
                          className="px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                      )}

                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                          className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-[#111318] border border-[#C89B58]/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-white">Nova Marcação Manual</h3>
            <form onSubmit={handleCreateManual} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#C89B58]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                  Telemóvel
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+351 9xx xxx xxx"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#C89B58]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#9E9EA7] uppercase tracking-wider block mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
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
                    className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-[#C89B58]"
                  >
                    {servicesData.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.priceFormatted})
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="btn-pill-gold px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
