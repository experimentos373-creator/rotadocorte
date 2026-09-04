import { useState, useEffect } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle2,
  Check,
  ChevronRight,
  ChevronLeft,
  Share2,
  AlertCircle,
  Scissors,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon
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

// Service Icon Component matching the visual avatar in the exemplar
function ServiceAvatar({ serviceId, isSelected, isDark }) {
  if (serviceId === "barba-terapia") {
    return (
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
        isSelected
          ? isDark ? "bg-[#C89B58]/20 border-[#C89B58] text-[#E5C268]" : "bg-[#FAF0E4] border-[#C89B58] text-[#8C601E]"
          : isDark ? "bg-white/5 border-white/10 text-[#9E9EA7]" : "bg-[#F7F5F0] border-[#E8E4DC] text-[#71717A]"
      }`}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3v4a5 5 0 0 0 10 0V3" />
          <path d="M4 11v2a8 8 0 0 0 16 0v-2" />
          <path d="M9 17v2a3 3 0 0 0 6 0v-2" />
        </svg>
      </div>
    );
  }

  if (serviceId === "corte-cabelo") {
    return (
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
        isSelected
          ? isDark ? "bg-[#C89B58]/20 border-[#C89B58] text-[#E5C268]" : "bg-[#FAF0E4] border-[#C89B58] text-[#8C601E]"
          : isDark ? "bg-white/5 border-white/10 text-[#9E9EA7]" : "bg-[#F7F5F0] border-[#E8E4DC] text-[#71717A]"
      }`}>
        <User className="w-4 h-4" />
      </div>
    );
  }

  if (serviceId === "corte-sobrancelha") {
    return (
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
        isSelected
          ? isDark ? "bg-[#C89B58]/20 border-[#C89B58] text-[#E5C268]" : "bg-[#FAF0E4] border-[#C89B58] text-[#8C601E]"
          : isDark ? "bg-white/5 border-white/10 text-[#9E9EA7]" : "bg-[#F7F5F0] border-[#E8E4DC] text-[#71717A]"
      }`}>
        <Sparkles className="w-4 h-4" />
      </div>
    );
  }

  // Default / Corte & Barba Terapia / Combo
  return (
    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
      isSelected
        ? isDark ? "bg-[#C89B58]/20 border-[#C89B58] text-[#E5C268]" : "bg-[#FAF0E4] border-[#C89B58] text-[#8C601E]"
        : isDark ? "bg-white/5 border-white/10 text-[#9E9EA7]" : "bg-[#F7F5F0] border-[#E8E4DC] text-[#71717A]"
    }`}>
      <Scissors className="w-4 h-4" />
    </div>
  );
}

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

  // 🔒 Bulletproof Lock body & html scroll when modal is active
  useEffect(() => {
    if (isOpen) {
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

  // Helper to generate next 31 selectable days (Full Month)
  const getNextDays = () => {
    const days = [];
    const base = new Date();
    for (let i = 0; i < 31; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();
      const isSunday = dayOfWeek === 0;

      const weekdayNames = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
      const monthNames = [
        "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
        "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto overscroll-contain animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative max-w-xl sm:max-w-2xl w-full max-h-[94vh] flex flex-col rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 shadow-2xl my-auto text-left border transition-all overflow-hidden ${
          isDark
            ? "bg-[#111318] border-white/10 text-[#FAF8F5] shadow-black/90"
            : "bg-white border-[#E8E4DC] text-[#18181B] shadow-2xl shadow-black/15"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* TOP BAR: BRAND LOGO + STEP PILL + CLOSE BUTTON                            */}
        {/* ========================================================================= */}
        <div className="mb-2.5 sm:mb-3.5 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Scissors Brand Mark */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[#C89B58]/30 flex items-center justify-center text-[#C89B58]">
                <Scissors className="w-3 h-3 sm:w-3.5 sm:h-3.5 -rotate-45" />
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] sm:text-[11px] font-bold tracking-widest uppercase leading-tight ${
                  isDark ? "text-white" : "text-[#18181B]"
                }`}>
                  Rota Do Corte
                </span>
                <span className="text-[7.5px] font-bold tracking-widest uppercase text-[#C89B58]">
                  • Paião
                </span>
              </div>
            </div>

            {/* Right: Step Indicator Pill + Close Button */}
            <div className="flex items-center gap-2 shrink-0">
              {step < 5 && (
                <span className={`text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border ${
                  isDark
                    ? "text-[#E5C268] bg-[#C89B58]/10 border-[#C89B58]/30"
                    : "text-[#8C601E] bg-[#FAF6F0] border-[#EADFCF]"
                }`}>
                  Passo {step} de 4
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                  isDark
                    ? "bg-white/5 border-white/10 text-[#9E9EA7] hover:text-white hover:bg-white/15"
                    : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-100"
                }`}
                aria-label="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4-Segment Gold Progress Bar */}
          {step < 5 && (
            <div className="w-full grid grid-cols-4 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i <= step
                      ? "bg-[#C89B58]"
                      : isDark
                        ? "bg-white/10"
                        : "bg-[#EAE6DF]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PASSO 1: ESCOLHA O SERVIÇO (COMPACT LIST / 100% VIEWPORT FIT)             */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-2 sm:space-y-3 animate-fadeIn pr-0.5">
            <div>
              <h2 className={`text-base sm:text-xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#18181B]"
              }`}>
                Escolha o Serviço
              </h2>
              <p className={`text-[10.5px] sm:text-xs leading-tight ${
                isDark ? "text-[#9E9EA7]" : "text-[#71717A]"
              }`}>
                Selecione o tratamento pretendido na barbearia de Gabriel Silva no Paião.
              </p>
            </div>

            {/* Compact Service Cards (All 5 fit directly on screen) */}
            <div className="space-y-1 sm:space-y-1.5">
              {servicesData.map((s) => {
                const isSelected = selectedServiceId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(s.id);
                    }}
                    className={`w-full p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-left border transition-all relative overflow-hidden group cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? isDark
                          ? "bg-[#181C26] border-[#C89B58] ring-1 ring-[#C89B58] shadow-sm"
                          : "bg-[#FAF6F0] border-[#C89B58] ring-1 ring-[#C89B58] shadow-xs"
                        : isDark
                          ? "bg-[#14161E] border-white/5 hover:border-white/20 hover:bg-[#181a24]"
                          : "bg-white border-[#E8E4DC] hover:border-[#C89B58]/50 hover:bg-neutral-50/50 shadow-xs"
                    }`}
                  >
                    {/* Left: Avatar + Title & Info */}
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <ServiceAvatar serviceId={s.id} isSelected={isSelected} isDark={isDark} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs sm:text-sm font-bold leading-tight truncate ${
                            isDark ? "text-white" : "text-[#18181B]"
                          }`}>
                            {s.name}
                          </span>
                          {s.badge && (
                            <span className={`text-[7px] sm:text-[7.5px] uppercase tracking-wider px-1.5 py-0.2 rounded-full font-bold border ${
                              isDark
                                ? "bg-[#C89B58]/20 text-[#E5C268] border-[#C89B58]/40"
                                : "bg-[#FAF0E4] text-[#8C601E] border-[#E8D4BE]"
                            }`}>
                              {s.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[9.5px] sm:text-[10.5px] leading-tight truncate ${
                          isDark ? "text-[#9E9EA7]" : "text-[#71717A]"
                        }`}>
                          {s.shortDesc}
                        </p>
                        <div className="flex items-center gap-1 text-[9.5px] text-[#C89B58] font-medium pt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{s.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Selection Check */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className={`font-bold text-xs sm:text-sm font-mono ${
                        isDark ? "text-[#E5C268]" : "text-[#18181B]"
                      }`}>
                        {s.priceFormatted}
                      </span>
                      {isSelected && (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#C89B58] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step 1 Footer */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-black/5 dark:border-white/5 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#9E9EA7]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C89B58]" />
                <span className="text-[10px]">Ambiente seguro e profissional</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto ml-auto bg-[#18181B] hover:bg-black text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md hover:scale-[1.01]"
              >
                <span>Avançar para Data</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 2: SELECIONE O DIA (CALENDÁRIO 7 COLUNAS X 5 SEMANAS)               */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-2.5 sm:space-y-3 animate-fadeIn">
            <div>
              <h2 className={`text-base sm:text-xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#18181B]"
              }`}>
                Selecione o Dia
              </h2>
              <p className={`text-[10.5px] sm:text-xs mt-0.5 leading-tight ${
                isDark ? "text-[#9E9EA7]" : "text-[#71717A]"
              }`}>
                Marcação até 1 mês de adiantamento (Seg. a Sáb. 10:00 - 22:00).
              </p>
            </div>

            {/* 31-Day Month Grid (7 columns x 5 weeks) - High density */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-0.5">
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
                      }
                    }}
                    className={`py-1 sm:py-1.5 px-0.5 rounded-lg sm:rounded-xl text-center border transition-all flex flex-col items-center justify-center cursor-pointer min-h-[38px] sm:min-h-[46px] ${
                      d.isSunday
                        ? isDark
                          ? "opacity-25 cursor-not-allowed bg-black/20 border-white/5 text-[#9E9EA7]"
                          : "opacity-30 cursor-not-allowed bg-neutral-100 border-neutral-200 text-neutral-400"
                        : isSelected
                          ? isDark
                            ? "bg-[#C89B58] text-black font-bold border-[#C89B58] shadow-md scale-[1.02]"
                            : "bg-[#18181B] text-white font-bold border-[#18181B] shadow-md scale-[1.02]"
                          : isDark
                            ? "bg-[#14161E] border-white/5 text-[#FAF8F5] hover:border-[#C89B58]/40 hover:bg-[#1a1d27]"
                            : "bg-white border-[#E8E4DC] text-[#18181B] hover:border-[#C89B58] hover:bg-[#FAF6F0] shadow-sm"
                    }`}
                  >
                    <span className={`text-[7px] sm:text-[7.5px] uppercase tracking-wider font-bold leading-none ${
                      isSelected ? (isDark ? "text-black/80" : "text-neutral-300") : isDark ? "text-[#9E9EA7]" : "text-neutral-500"
                    }`}>
                      {d.weekday}
                    </span>
                    <span className="text-xs sm:text-sm font-bold leading-tight my-0.5">
                      {d.dayNum}
                    </span>
                    <span className={`text-[6.5px] sm:text-[7px] uppercase tracking-wider font-semibold leading-none ${
                      isSelected ? (isDark ? "text-black/80" : "text-neutral-300") : isDark ? "text-[#9E9EA7]" : "text-neutral-400"
                    }`}>
                      {d.month}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Date Sub-bar */}
            <div className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between text-xs ${
              isDark
                ? "bg-white/5 border-white/10 text-[#FAF8F5]"
                : "bg-[#FAF6F0] border-[#EADFCF] text-[#18181B]"
            }`}>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-[#C89B58]" />
                <span className="text-[10px] sm:text-[11px]">
                  Data: <strong className="capitalize">{formattedDatePortuguese}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#71717A] dark:text-[#9E9EA7]">
                <User className="w-3 h-3 text-[#C89B58]" />
                <span>Gabriel Silva</span>
              </div>
            </div>

            {/* Step 2 Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-[#71717A] hover:text-black dark:text-[#9E9EA7] dark:hover:text-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-[#18181B] hover:bg-black text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md hover:scale-[1.01]"
              >
                <span>Ver Horários ({currentService.duration})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 3: ESCOLHA O HORÁRIO (MANHÃ & TARDE/NOITE + OCUPADOS)                */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-2.5 sm:space-y-3 animate-fadeIn">
            <div>
              <h2 className={`text-base sm:text-xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#18181B]"
              }`}>
                Escolha o Horário
              </h2>
              <p className={`text-[10.5px] sm:text-xs mt-0.5 leading-tight capitalize ${
                isDark ? "text-[#9E9EA7]" : "text-[#71717A]"
              }`}>
                {formattedDatePortuguese} • Duração: <span className="text-[#C89B58] font-bold">{currentService.duration}</span>
              </p>
            </div>

            {isLoadingSlots ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-7 h-7 border-2 border-[#C89B58] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className={`text-xs ${isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}`}>
                  A consultar agenda em tempo real...
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className={`py-6 text-center space-y-2.5 p-4 rounded-xl border ${
                isDark ? "bg-white/5 border-white/10" : "bg-white border-[#E8E4DC] shadow-sm"
              }`}>
                <AlertCircle className="w-6 h-6 text-[#C89B58] mx-auto" />
                <h4 className={`text-xs sm:text-sm font-bold ${isDark ? "text-white" : "text-[#18181B]"}`}>
                  Sem vagas para esta data
                </h4>
                <p className={`text-[11px] max-w-sm mx-auto ${isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}`}>
                  A barbearia encontra-se encerrada nesta data. Por favor selecione outro dia.
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#18181B] text-white px-5 py-2 text-xs rounded-full uppercase font-bold cursor-pointer hover:bg-black"
                >
                  Escolher Outra Data
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
                {/* Morning Slots */}
                {availableSlots.some((s) => s.period === "morning") && (
                  <div className="space-y-1.5">
                    <span className={`text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? "text-[#E5C268]" : "text-[#8C601E]"
                    }`}>
                      <Sun className="w-3 h-3 text-[#C89B58]" />
                      <span>MANHÃ (10:00 - 13:00)</span>
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
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
                              className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center min-h-[38px] ${
                                isOccupied
                                  ? isDark
                                    ? "bg-black/30 border-white/5 text-[#666978] cursor-not-allowed opacity-50"
                                    : "bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                  : isSelected
                                    ? isDark
                                      ? "bg-[#C89B58] text-black border-[#C89B58] shadow-md scale-[1.02] cursor-pointer"
                                      : "bg-[#18181B] text-white border-[#18181B] shadow-md scale-[1.02] cursor-pointer"
                                    : isDark
                                      ? "bg-[#14161E] border-white/5 text-[#FAF8F5] hover:border-[#C89B58]/50 hover:bg-[#1a1d27] cursor-pointer"
                                      : "bg-white border-[#E8E4DC] text-[#18181B] hover:border-[#C89B58] hover:bg-[#FAF6F0] shadow-sm cursor-pointer"
                              }`}
                            >
                              <span className={isOccupied ? "line-through text-neutral-400" : ""}>
                                {slot.time}
                              </span>
                              {isOccupied && (
                                <span className="text-[7.5px] font-bold text-red-500 uppercase tracking-tight mt-0.5">
                                  OCUPADO
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Afternoon & Night Slots */}
                {availableSlots.some((s) => s.period === "afternoon" || s.period === "evening") && (
                  <div className="space-y-1.5 pt-0.5">
                    <span className={`text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isDark ? "text-[#E5C268]" : "text-[#8C601E]"
                    }`}>
                      <Moon className="w-3 h-3 text-[#C89B58]" />
                      <span>TARDE & NOITE (14:00 - 22:00)</span>
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
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
                              className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center min-h-[38px] ${
                                isOccupied
                                  ? isDark
                                    ? "bg-black/30 border-white/5 text-[#666978] cursor-not-allowed opacity-50"
                                    : "bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                  : isSelected
                                    ? isDark
                                      ? "bg-[#C89B58] text-black border-[#C89B58] shadow-md scale-[1.02] cursor-pointer"
                                      : "bg-[#18181B] text-white border-[#18181B] shadow-md scale-[1.02] cursor-pointer"
                                    : isDark
                                      ? "bg-[#14161E] border-white/5 text-[#FAF8F5] hover:border-[#C89B58]/50 hover:bg-[#1a1d27] cursor-pointer"
                                      : "bg-white border-[#E8E4DC] text-[#18181B] hover:border-[#C89B58] hover:bg-[#FAF6F0] shadow-sm cursor-pointer"
                              }`}
                            >
                              <span className={isOccupied ? "line-through text-neutral-400" : ""}>
                                {slot.time}
                              </span>
                              {isOccupied && (
                                <span className="text-[7.5px] font-bold text-red-500 uppercase tracking-tight mt-0.5">
                                  OCUPADO
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

            {/* Step 3 Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-[#71717A] hover:text-black dark:text-[#9E9EA7] dark:hover:text-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setStep(4)}
                className="bg-[#18181B] hover:bg-black disabled:opacity-40 text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md hover:scale-[1.01]"
              >
                <span>Avançar para Dados</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 4: OS SEUS DADOS (SUMMARY CARD + CLEAN FORM INPUTS)                 */}
        {/* ========================================================================= */}
        {step === 4 && (
          <form onSubmit={handleBookingSubmit} className="space-y-2.5 sm:space-y-3 animate-fadeIn">
            <div>
              <h2 className={`text-base sm:text-xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#18181B]"
              }`}>
                Os Seus Dados
              </h2>
              <p className={`text-[10.5px] sm:text-xs mt-0.5 leading-tight ${
                isDark ? "text-[#9E9EA7]" : "text-[#71717A]"
              }`}>
                Preencha os seus dados de contacto para confirmarmos o seu horário.
              </p>
            </div>

            {/* Clean Summary Card */}
            <div className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs ${
              isDark
                ? "bg-[#181C26] border-white/10 text-white"
                : "bg-[#FAF6F0] border-[#EADFCF] text-[#18181B]"
            }`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[#C89B58]" />
                  <p className="font-bold text-xs sm:text-sm">
                    {currentService.name}
                  </p>
                </div>
                <p className={`text-[11px] capitalize ${isDark ? "text-[#E5C268]" : "text-[#8C601E]"}`}>
                  {formattedDatePortuguese} às <strong>{selectedTime}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs sm:text-sm">
                  {currentService.priceFormatted}
                </span>
                <p className={`text-[10px] ${isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}`}>
                  {currentService.duration}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isDark
                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px]">{errorMessage}</span>
              </div>
            )}

            {/* Input Fields */}
            <div className="space-y-2">
              {/* Name */}
              <div className="space-y-0.5">
                <label className={`text-[10.5px] font-semibold flex items-center gap-1 ${
                  isDark ? "text-[#9E9EA7]" : "text-[#18181B]"
                }`}>
                  <User className="w-3 h-3 text-[#C89B58]" />
                  <span>O seu nome completo *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={`w-full px-3 py-1.5 sm:py-2 text-xs rounded-lg border focus:outline-none transition-colors ${
                    isDark
                      ? "border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-[#C89B58]"
                      : "border-[#E8E4DC] bg-white text-[#18181B] placeholder-neutral-400 focus:border-[#18181B] shadow-sm"
                  }`}
                />
              </div>

              {/* Phone */}
              <div className="space-y-0.5">
                <label className={`text-[10.5px] font-semibold flex items-center gap-1 ${
                  isDark ? "text-[#9E9EA7]" : "text-[#18181B]"
                }`}>
                  <Phone className="w-3 h-3 text-[#C89B58]" />
                  <span>Telemóvel / WhatsApp *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: +351 912 345 678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className={`w-full px-3 py-1.5 sm:py-2 text-xs rounded-lg border focus:outline-none transition-colors ${
                    isDark
                      ? "border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-[#C89B58]"
                      : "border-[#E8E4DC] bg-white text-[#18181B] placeholder-neutral-400 focus:border-[#18181B] shadow-sm"
                  }`}
                />
              </div>

              {/* Notes */}
              <div className="space-y-0.5">
                <label className={`text-[10.5px] font-semibold flex items-center gap-1 ${
                  isDark ? "text-[#9E9EA7]" : "text-[#18181B]"
                }`}>
                  <FileText className="w-3 h-3 text-[#C89B58]" />
                  <span>Observações (opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pretendo corte à tesoura e barba com toalha aquecida"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className={`w-full px-3 py-1.5 sm:py-2 text-xs rounded-lg border focus:outline-none transition-colors ${
                    isDark
                      ? "border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-[#C89B58]"
                      : "border-[#E8E4DC] bg-white text-[#18181B] placeholder-neutral-400 focus:border-[#18181B] shadow-sm"
                  }`}
                />
              </div>
            </div>

            {/* Step 4 Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-[#71717A] hover:text-black dark:text-[#9E9EA7] dark:hover:text-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#18181B] hover:bg-black disabled:opacity-50 text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>A Confirmar...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
          <div className="space-y-3 text-center py-1 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[#C89B58]/20 border-2 border-[#C89B58] flex items-center justify-center text-[#E5C268] mx-auto shadow-md shadow-[#C89B58]/20">
              <CheckCircle2 className="w-6 h-6 text-[#C89B58]" />
            </div>

            <div className="space-y-0.5">
              <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#18181B]"
              }`}>
                Marcação Confirmada!
              </h2>
              <p className={`text-[11px] ${isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}`}>
                O seu horário foi registado com sucesso na agenda da Rota do Corte.
              </p>
            </div>

            {/* Booking Details Card */}
            <div className={`p-3 rounded-xl border text-left space-y-1.5 text-xs ${
              isDark ? "bg-[#181C26] border-white/10" : "bg-[#FAF6F0] border-[#EADFCF] text-[#18181B] shadow-xs"
            }`}>
              <div className="flex justify-between items-center pb-1.5 border-b border-black/5 dark:border-white/5">
                <span className={isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}>Serviço:</span>
                <span className="font-bold">
                  {currentService.name}
                </span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-black/5 dark:border-white/5">
                <span className={isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}>Barbeiro:</span>
                <span className="font-bold text-[#C89B58]">
                  Gabriel Silva
                </span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-black/5 dark:border-white/5">
                <span className={isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}>Data & Hora:</span>
                <span className="font-bold capitalize">
                  {formattedDatePortuguese} às {selectedTime}
                </span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-black/5 dark:border-white/5">
                <span className={isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}>Valor:</span>
                <span className="font-bold text-[#C89B58]">
                  {currentService.priceFormatted}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}>Localização:</span>
                <span className="text-right font-medium text-[11px]">
                  {shopInfo.addressShort}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5 pt-0.5">
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
                className="w-full py-2.5 sm:py-3 text-xs uppercase tracking-wider font-bold rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-[#25D366]/20 cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>Enviar Confirmação por WhatsApp</span>
              </a>

              {/* Calendar Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <a
                  href={buildGoogleCalendarUrl({
                    serviceName: currentService.name,
                    date: selectedDate,
                    time: selectedTime,
                    durationMinutes: parseInt(currentService.duration, 10) || 30
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-2 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    isDark
                      ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                      : "border-[#E8E4DC] bg-white hover:bg-neutral-50 text-[#18181B] shadow-xs"
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-[#C89B58]" />
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
                  className={`py-2 px-3 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isDark
                      ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                      : "border-[#E8E4DC] bg-white hover:bg-neutral-50 text-[#18181B] shadow-xs"
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 text-[#C89B58]" />
                  <span>Apple / Outlook (.ics)</span>
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className={`text-xs uppercase tracking-wider font-bold cursor-pointer transition-colors ${
                  isDark ? "text-[#9E9EA7] hover:text-white" : "text-[#71717A] hover:text-[#18181B]"
                }`}
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


