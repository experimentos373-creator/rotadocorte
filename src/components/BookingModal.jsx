import { useState, useEffect } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Share2,
  AlertCircle,
  Scissors
} from "lucide-react";
import confetti from "canvas-confetti";
import { WhatsAppIcon } from "./WhatsAppButton";
import { servicesData, shopInfo } from "../data/services";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { getAvailableSlots, createBooking } from "../lib/supabase";
import {
  buildWhatsAppMessage,
  buildGoogleCalendarUrl,
  downloadIcsFile
} from "../lib/bookingEngine";

export default function BookingModal({ isOpen, onClose, preselectedService }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Streamlined 4-step wizard + 5th confirmation: 1=Service, 2=Date, 3=Time (30m slots), 4=Customer Details, 5=Confirmation
  const [step, setStep] = useState(1);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState("corte-barba-terapia");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  // Slots Loading & Status State
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // 🔒 Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (preselectedService) {
      setSelectedServiceId(preselectedService.id);
    }
  }, [preselectedService]);

  useEffect(() => {
    if (isOpen) {
      const d = new Date();
      if (d.getHours() >= 21) {
        d.setDate(d.getDate() + 1);
      }
      const initialDate = d.toISOString().split("T")[0];
      setSelectedDate(initialDate);
      setStep(1);
      setBookingResult(null);
      setErrorMessage("");
    }
  }, [isOpen]);

  // Fetch slots whenever selectedDate or selectedServiceId changes
  useEffect(() => {
    if (!selectedDate || !selectedServiceId) return;

    let isMounted = true;
    setIsLoadingSlots(true);
    setErrorMessage("");

    getAvailableSlots({
      shopSlug: "rotadocorte",
      date: selectedDate,
      serviceId: selectedServiceId
    }).then((res) => {
      if (isMounted) {
        setIsLoadingSlots(false);
        if (res.success) {
          setAvailableSlots(res.slots || []);
        } else {
          setAvailableSlots([]);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedServiceId]);

  if (!isOpen) return null;

  const currentService =
    servicesData.find((s) => s.id === selectedServiceId) || servicesData[3];

  // Helper to generate next 14 selectable days
  const getNextDays = () => {
    const days = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();
      const isSunday = dayOfWeek === 0;

      const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const monthNames = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
      ];

      days.push({
        iso,
        dayNum: d.getDate(),
        weekday: weekdayNames[dayOfWeek],
        month: monthNames[d.getMonth()],
        isSunday,
        isToday: i === 0
      });
    }
    return days;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMessage("Por favor preencha o seu nome e contacto telefónico.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await createBooking({
        shopSlug: "rotadocorte",
        serviceId: selectedServiceId,
        date: selectedDate,
        time: selectedTime,
        customerName: clientName.trim(),
        customerPhone: clientPhone.trim(),
        customerEmail: clientEmail.trim(),
        customerNotes: clientNotes.trim()
      });

      setIsSubmitting(false);

      if (res.success) {
        setBookingResult(res.appointment);
        setStep(5);
        try {
          confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#C89B58", "#E5C268", "#FAF8F5", "#25D366"]
          });
        } catch {}
      } else {
        setErrorMessage(
          res.message || "Este horário acabou de ser reservado. Por favor escolha outro."
        );
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage("Ocorreu um erro na comunicação. Por favor tente novamente.");
    }
  };

  const formattedDatePortuguese = selectedDate
    ? new Date(selectedDate).toLocaleDateString("pt-PT", {
        weekday: "long",
        day: "numeric",
        month: "long"
      })
    : "";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative max-w-2xl w-full rounded-3xl p-6 sm:p-9 shadow-2xl my-auto text-left border transition-all ${
          isDark
            ? "bg-[#0E1015] border-[#C89B58]/35 text-[#FAF8F5] shadow-black/80"
            : "bg-[#FAF8F5] border-[#DED7C8] text-[#1C1A17]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* HEADER: STUDIO BRANDING, STEP INDICATOR & INTEGRATED CLOSE BUTTON        */}
        {/* (Zero Overlap Guaranteed by Inline Flex Layout)                           */}
        {/* ========================================================================= */}
        <div className="mb-6 space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Studio Identity Badge */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C89B58] animate-pulse shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#C89B58] font-bold">
                Rota Do Corte • Paião
              </span>
            </div>

            {/* Right: Step Indicator Pill + Close Button */}
            <div className="flex items-center gap-2.5 shrink-0">
              {step < 5 && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C89B58] bg-[#C89B58]/10 px-3 py-1 rounded-full border border-[#C89B58]/25">
                  Passo {step} de 4
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                  isDark
                    ? "bg-white/5 border-white/10 text-[#9E9EA7] hover:text-white hover:bg-white/15"
                    : "bg-white border-[#DED7C8] text-[#5C554B] hover:text-[#1C1A17]"
                }`}
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Segmented Bar */}
          {step < 5 && (
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s <= step
                      ? "bg-gradient-to-r from-[#C89B58] to-[#E5C268]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PASSO 1: ESCOLHER SERVIÇO                                                 */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Selecione o Serviço
              </h2>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
                Cortes masculinos sob medida e barbaterapia com vapor de ozónio por Gabriel Silva.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {servicesData.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedServiceId(s.id)}
                  className={`w-full p-4 rounded-2xl text-left border transition-all flex items-center justify-between cursor-pointer group ${
                    selectedServiceId === s.id
                      ? isDark
                        ? "bg-[#C89B58]/15 border-[#C89B58] text-[#FAF8F5] shadow-lg shadow-[#C89B58]/10 ring-1 ring-[#C89B58]/40"
                        : "bg-[#1C1A17] border-[#1C1A17] text-white shadow-md"
                      : isDark
                        ? "bg-[#14161E] border-white/5 text-[#9E9EA7] hover:border-white/20 hover:bg-[#181B24]"
                        : "bg-white border-[#DED7C8]/70 text-[#5C554B] hover:border-[#1C1A17]"
                  }`}
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white group-hover:text-[#E5C268] transition-colors">
                        {s.name}
                      </p>
                      {s.badge && (
                        <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold bg-[#C89B58]/25 text-[#E5C268] border border-[#C89B58]/35">
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${
                      selectedServiceId === s.id && !isDark ? "text-white/80" : "text-[#9E9EA7]"
                    }`}>
                      {s.shortDesc}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] opacity-80 pt-0.5 font-mono">
                      <span className="flex items-center gap-1.5 text-[#D4AF37]">
                        <Clock className="w-3.5 h-3.5" /> {s.duration}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-lg font-bold font-mono text-[#E5C268] tracking-tight">
                      {s.priceFormatted}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-pill-gold w-full sm:w-auto px-9 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C89B58]/20 hover:scale-[1.02] transition-transform"
              >
                <span>Escolher Data</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 2: ESCOLHER DATA                                                    */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Selecione o Dia
              </h2>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
                Atendimento de Segunda a Sábado das 10:00 às 22:00. Domingos encerrado.
              </p>
            </div>

            {/* Horizontal Day Carousel */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
              {getNextDays().map((d) => {
                const isSelected = selectedDate === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    disabled={d.isSunday}
                    onClick={() => {
                      if (!d.isSunday) {
                        setSelectedDate(d.iso);
                        setStep(3);
                      }
                    }}
                    className={`p-3 rounded-2xl text-center border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      d.isSunday
                        ? "opacity-25 cursor-not-allowed bg-black/20 border-white/5"
                        : isSelected
                          ? isDark
                            ? "bg-[#C89B58] text-black font-bold border-[#C89B58] shadow-lg shadow-[#C89B58]/30 scale-105"
                            : "bg-[#1C1A17] text-white font-bold border-[#1C1A17] scale-105"
                          : isDark
                            ? "bg-[#14161E] border-white/5 text-[#9E9EA7] hover:border-white/25 hover:bg-[#1a1d27]"
                            : "bg-white border-[#DED7C8] text-[#5C554B] hover:border-[#1C1A17]"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      {d.weekday}
                    </span>
                    <span className="text-lg font-mono font-bold leading-none my-0.5">
                      {d.dayNum}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider opacity-75 font-mono">
                      {d.month}
                    </span>
                    {d.isSunday && (
                      <span className="text-[8px] text-red-400 font-bold mt-0.5">Folga</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Date Details Bar */}
            <div className="p-3.5 rounded-2xl bg-[#C89B58]/10 border border-[#C89B58]/30 flex items-center justify-between text-xs text-[#E5C268]">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 shrink-0 text-[#C89B58]" />
                <span>
                  Data: <strong className="capitalize">{formattedDatePortuguese}</strong>
                </span>
              </div>
              <span className="text-[11px] opacity-80">Gabriel Silva</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#9E9EA7] hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={!selectedDate}
                onClick={() => setStep(3)}
                className="btn-pill-gold px-9 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Ver Horários (30 min)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 3: ESCOLHER HORÁRIO (SLOTS DE 30 EM 30 MINUTOS + OCUPADOS VISÍVEIS) */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Escolha o Horário
              </h2>
              <p className={`text-xs mt-1 leading-relaxed capitalize ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
                {formattedDatePortuguese} • Duração: <strong>{currentService.duration}</strong>
              </p>
            </div>

            {isLoadingSlots ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-9 h-9 border-2 border-[#C89B58] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#9E9EA7] font-mono">A consultar agenda em tempo real...</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="py-10 text-center space-y-3 p-6 rounded-2xl bg-white/5 border border-white/10">
                <AlertCircle className="w-8 h-8 text-[#C89B58] mx-auto" />
                <h4 className="text-sm font-bold text-white">Sem vagas para esta data</h4>
                <p className="text-xs text-[#9E9EA7] max-w-sm mx-auto">
                  A barbearia encontra-se encerrada nesta data. Por favor selecione outro dia.
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-pill-gold px-6 py-2 text-xs rounded-full uppercase font-bold"
                >
                  Escolher Outra Data
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[48vh] overflow-y-auto pr-1">
                {/* Morning Slots */}
                {availableSlots.some((s) => s.period === "morning") && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C89B58] flex items-center gap-1.5">
                      <span>🌅 Manhã</span>
                      <span className="text-[10px] text-[#9E9EA7] font-normal">(10:00 – 13:00)</span>
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots
                        .filter((s) => s.period === "morning")
                        .map((slot) => {
                          const isOccupied = !slot.available;
                          const isSelected = selectedTime === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => {
                                if (!isOccupied) setSelectedTime(slot.time);
                              }}
                              className={`py-3 px-2.5 rounded-xl font-mono text-xs font-bold border transition-all flex flex-col items-center justify-center min-h-[48px] ${
                                isOccupied
                                  ? "bg-black/40 border-white/5 text-[#555866] cursor-not-allowed opacity-45"
                                  : isSelected
                                    ? "bg-[#C89B58] text-black border-[#C89B58] shadow-md shadow-[#C89B58]/30 scale-105 cursor-pointer font-bold"
                                    : "bg-[#14161E] border-white/5 text-[#FAF8F5] hover:border-[#C89B58]/50 hover:bg-[#1a1d27] cursor-pointer"
                              }`}
                            >
                              <span className={isOccupied ? "line-through opacity-70" : ""}>
                                {slot.time}
                              </span>
                              {isOccupied && (
                                <span className="text-[8px] font-sans no-underline font-bold text-red-400/90 uppercase tracking-tight mt-0.5">
                                  Ocupado
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Afternoon & Evening Slots */}
                {availableSlots.some((s) => s.period === "afternoon" || s.period === "evening") && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C89B58] flex items-center gap-1.5">
                      <span>☀️ Tarde & Noite</span>
                      <span className="text-[10px] text-[#9E9EA7] font-normal">(14:00 – 22:00 • Aberto até tarde)</span>
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots
                        .filter((s) => s.period === "afternoon" || s.period === "evening")
                        .map((slot) => {
                          const isOccupied = !slot.available;
                          const isSelected = selectedTime === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => {
                                if (!isOccupied) setSelectedTime(slot.time);
                              }}
                              className={`py-3 px-2.5 rounded-xl font-mono text-xs font-bold border transition-all flex flex-col items-center justify-center min-h-[48px] ${
                                isOccupied
                                  ? "bg-black/40 border-white/5 text-[#555866] cursor-not-allowed opacity-45"
                                  : isSelected
                                    ? "bg-[#C89B58] text-black border-[#C89B58] shadow-md shadow-[#C89B58]/30 scale-105 cursor-pointer font-bold"
                                    : "bg-[#14161E] border-white/5 text-[#FAF8F5] hover:border-[#C89B58]/50 hover:bg-[#1a1d27] cursor-pointer"
                              }`}
                            >
                              <span className={isOccupied ? "line-through opacity-70" : ""}>
                                {slot.time}
                              </span>
                              {isOccupied && (
                                <span className="text-[8px] font-sans no-underline font-bold text-red-400/90 uppercase tracking-tight mt-0.5">
                                  Ocupado
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#9E9EA7] hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setStep(4)}
                className="btn-pill-gold px-9 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Avançar para os Dados</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 4: DADOS DO CLIENTE                                                 */}
        {/* ========================================================================= */}
        {step === 4 && (
          <form onSubmit={handleBookingSubmit} className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Os Seus Dados
              </h2>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
                Preencha os dados de contacto para confirmarmos o seu horário na barbearia.
              </p>
            </div>

            {/* Structured Summary Card */}
            <div className="p-4 rounded-2xl bg-[#14161E] border border-[#C89B58]/30 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-[#C89B58]" />
                  <p className="font-bold text-white text-sm">{currentService.name}</p>
                </div>
                <p className="text-xs text-[#E5C268] capitalize">
                  {formattedDatePortuguese} às <strong>{selectedTime}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-base text-[#E5C268]">
                  {currentService.priceFormatted}
                </span>
                <p className="text-[10px] text-[#9E9EA7]">{currentService.duration}</p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#9E9EA7] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C89B58]" />
                  <span>O Seu Nome Completo *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={`w-full px-4 py-3 text-xs rounded-xl border focus:outline-none transition-colors ${
                    isDark
                      ? "border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-[#C89B58]"
                      : "border-[#DED7C8] bg-white text-[#1C1A17] focus:border-[#1C1A17]"
                  }`}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#9E9EA7] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#C89B58]" />
                  <span>Telemóvel / WhatsApp *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+351 912 345 678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className={`w-full px-4 py-3 text-xs rounded-xl border focus:outline-none transition-colors ${
                    isDark
                      ? "border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-[#C89B58]"
                      : "border-[#DED7C8] bg-white text-[#1C1A17] focus:border-[#1C1A17]"
                  }`}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#9E9EA7] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#C89B58]" />
                  <span>Observações ou Pedidos Especiais (Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pretendo corte à tesoura e barba alinhada com toalha aquecida"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className={`w-full px-4 py-3 text-xs rounded-xl border focus:outline-none transition-colors ${
                    isDark
                      ? "border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-[#C89B58]"
                      : "border-[#DED7C8] bg-white text-[#1C1A17] focus:border-[#1C1A17]"
                  }`}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#9E9EA7] hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-pill-gold px-9 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#C89B58]/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>A Confirmar...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Agendamento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* PASSO 5: SUCESSO & CONFIRMAÇÃO IMEDIATA                                   */}
        {/* ========================================================================= */}
        {step === 5 && (
          <div className="space-y-5 text-center py-2 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#C89B58]/20 border-2 border-[#C89B58] flex items-center justify-center text-[#E5C268] mx-auto shadow-xl shadow-[#C89B58]/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-[#E5C268]" />
            </div>

            <div className="space-y-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Marcação Confirmada!
              </h2>
              <p className="text-xs text-[#9E9EA7]">
                O seu horário foi registado com sucesso na agenda da Rota do Corte.
              </p>
            </div>

            {/* Booking Details Card */}
            <div className="p-5 rounded-2xl bg-[#14161E] border border-white/10 text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                <span className="text-[#9E9EA7]">Serviço:</span>
                <span className="font-bold text-white text-sm">{currentService.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                <span className="text-[#9E9EA7]">Barbeiro:</span>
                <span className="font-bold text-[#E5C268]">Gabriel Silva</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                <span className="text-[#9E9EA7]">Data & Hora:</span>
                <span className="font-bold text-white capitalize">
                  {formattedDatePortuguese} às {selectedTime}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                <span className="text-[#9E9EA7]">Valor:</span>
                <span className="font-bold font-mono text-sm text-[#E5C268]">
                  {currentService.priceFormatted}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9E9EA7]">Localização:</span>
                <span className="text-white text-right">
                  {shopInfo.addressShort}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              {/* WhatsApp 1-Click Confirmation */}
              <a
                href={`https://wa.me/351935190491?text=${buildWhatsAppMessage({
                  serviceName: currentService.name,
                  servicePrice: currentService.priceFormatted,
                  dateFormatted: formattedDatePortuguese,
                  time: selectedTime,
                  clientName,
                  phone: clientPhone,
                  notes: clientNotes
                })}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 text-xs uppercase tracking-wider font-bold rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/25 cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>Enviar Confirmação por WhatsApp</span>
              </a>

              {/* Calendar Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={buildGoogleCalendarUrl({
                    serviceName: currentService.name,
                    date: selectedDate,
                    time: selectedTime,
                    durationMinutes: parseInt(currentService.duration, 10) || 30
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <CalendarIcon className="w-4 h-4 text-[#C89B58]" />
                  <span>Google Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={() =>
                    downloadIcsFile({
                      serviceName: currentService.name,
                      date: selectedDate,
                      time: selectedTime,
                      durationMinutes: parseInt(currentService.duration, 10) || 30,
                      clientName
                    })
                  }
                  className="py-3 px-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-[#C89B58]" />
                  <span>Apple / Outlook (.ics)</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs uppercase tracking-wider text-[#9E9EA7] hover:text-white font-bold cursor-pointer transition-colors"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
