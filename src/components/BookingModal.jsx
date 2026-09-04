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
  Moon,
  Crown
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

// Precise Line-Art Icon Component matching the exemplar design
function ServiceAvatar({ serviceId, isSelected, isDark }) {
  if (serviceId === "barba-terapia") {
    return (
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
          isSelected
            ? isDark
              ? "bg-[#C89B58]/20 border-[#C89B58] text-[#E5C268]"
              : "bg-[#FAF0E4] border-[#C89B58] text-[#8C601E]"
            : isDark
              ? "bg-white/5 border-white/10 text-[#C89B58]"
              : "bg-[#F7F5F0] border-[#E8E4DC] text-[#C89B58]"
        }`}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-[#C89B58]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 6v2a5 5 0 0 0 10 0V6" />
          <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
          <path d="M8 15a4 4 0 0 0 8 0" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </svg>
      </div>
    );
  }

  if (serviceId === "corte-cabelo") {
    return (
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
          isSelected
            ? isDark
              ? "bg-[#C89B58]/20 border-[#C89B58] text-[#E5C268]"
              : "bg-[#FAF0E4] border-[#C89B58] text-[#8C601E]"
            : isDark
              ? "bg-white/5 border-white/10 text-[#C89B58]"
              : "bg-[#F7F5F0] border-[#E8E4DC] text-[#C89B58]"
        }`}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-[#C89B58]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 11c0-4.5 2.5-7 5-7s5 2.5 5 7" />
          <path d="M7 11c-.5 0-1 .5-1 1.5s.5 2 1.5 2" />
          <path d="M17 11c.5 0 1 .5 1 1.5s-.5 2-1.5 2" />
          <path d="M7.5 14.5c.5 3 2 5.5 4.5 5.5s4-2.5 4.5-5.5" />
          <path d="M9 4.5c1.5 1.5 4.5 1.5 6 0" />
        </svg>
      </div>
    );
  }

  if (serviceId === "corte-sobrancelha") {
    return (
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
          isSelected
            ? isDark
              ? "bg-[#C89B58]/20 border-[#C89B58] text-[#E5C268]"
              : "bg-[#FAF0E4] border-[#C89B58] text-[#8C601E]"
            : isDark
              ? "bg-white/5 border-white/10 text-[#C89B58]"
              : "bg-[#F7F5F0] border-[#E8E4DC] text-[#C89B58]"
        }`}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-[#C89B58]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8l2 2M6 18l2-2m8-8l2-2" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
    );
  }

  if (serviceId === "combo-premium") {
    return (
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
          isSelected
            ? isDark
              ? "bg-[#C89B58]/20 border-[#C89B58] text-[#E5C268]"
              : "bg-[#FAF0E4] border-[#C89B58] text-[#8C601E]"
            : isDark
              ? "bg-white/5 border-white/10 text-[#C89B58]"
              : "bg-[#F7F5F0] border-[#E8E4DC] text-[#C89B58]"
        }`}
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-[#C89B58]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
      </div>
    );
  }

  // Default / Corte & Barba Terapia (Scissors Icon)
  return (
    <div
      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
        isSelected
          ? isDark
            ? "bg-[#C89B58]/20 border-[#C89B58] text-[#E5C268]"
            : "bg-[#FAF0E4] border-[#C89B58] text-[#8C601E]"
          : isDark
            ? "bg-white/5 border-white/10 text-[#C89B58]"
            : "bg-[#F7F5F0] border-[#E8E4DC] text-[#C89B58]"
      }`}
    >
      <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-[#C89B58] -rotate-45" />
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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fadeIn"
      onClick={onClose}
    >
      {/* 90% Screen Width AND 90% Screen Height Modal Container */}
      <div
        className={`relative w-[90vw] h-[90vh] max-w-6xl flex flex-col rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 md:p-7 shadow-2xl justify-between border transition-all overflow-hidden ${
          isDark
            ? "bg-[#0B0D13] border-white/10 text-[#FAF8F5] shadow-black/95"
            : "bg-white border-[#E8E4DC] text-[#18181B] shadow-2xl shadow-black/15"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* TOP BAR: BRAND LOGO + STEP PILL + CLOSE BUTTON                            */}
        {/* ========================================================================= */}
        <div className="space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Scissors Brand Mark */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#C89B58]/40 flex items-center justify-center text-[#C89B58] shrink-0">
                <Scissors className="w-4 h-4 -rotate-45" />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs sm:text-sm font-bold tracking-widest uppercase font-sans leading-tight ${
                  isDark ? "text-white" : "text-[#18181B]"
                }`}>
                  ROTA DO CORTE
                </span>
                <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#C89B58] leading-tight">
                  PAIÃO
                </span>
              </div>
            </div>

            {/* Right: Step Indicator Pill + Close Button */}
            <div className="flex items-center gap-2.5 shrink-0">
              {step < 5 && (
                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                  isDark
                    ? "border-white/15 bg-white/5 text-white/90"
                    : "border-neutral-300 bg-neutral-100 text-neutral-800"
                }`}>
                  PASSO {step} DE 4
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                  isDark
                    ? "bg-white/5 border-white/10 text-[#9E9EA7] hover:text-white hover:bg-white/15"
                    : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-100"
                }`}
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4-Segment Progress Bar */}
          {step < 5 && (
            <div className="w-full grid grid-cols-4 gap-2 sm:gap-3 pt-0.5">
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
        {/* PASSO 1: ESCOLHA O SERVIÇO (EXACT DESIGN IN 90% VIEWPORT CANVAS)          */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="flex-1 min-h-0 flex flex-col justify-between py-2 animate-fadeIn">
            {/* Title & Subtitle */}
            <div className="shrink-0 pb-1">
              <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#18181B]"
              }`}>
                Escolha o Serviço
              </h2>
              <p className={`text-xs sm:text-sm mt-0.5 leading-tight ${
                isDark ? "text-[#9E9EA7]" : "text-[#71717A]"
              }`}>
                Selecione o tratamento pretendido na barbearia de Gabriel Silva no Paião.
              </p>
            </div>

            {/* Services Grid (Filling the 90vh space evenly and beautifully) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 my-auto flex-1 min-h-0 py-1">
              {servicesData.map((s, idx) => {
                const isSelected = selectedServiceId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`relative p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      idx === 4 ? "sm:col-span-2 lg:col-span-1" : ""
                    } ${
                      isSelected
                        ? isDark
                          ? "bg-[#11141C] border-[#C89B58] ring-1 ring-[#C89B58] shadow-md shadow-[#C89B58]/10"
                          : "bg-[#FAF6F0] border-[#C89B58] ring-1 ring-[#C89B58] shadow-xs"
                        : isDark
                          ? "bg-[#10131A] border-white/10 hover:border-white/20 hover:bg-[#141722]"
                          : "bg-white border-[#E8E4DC] hover:border-[#C89B58]/40 hover:bg-neutral-50 shadow-xs"
                    }`}
                  >
                    {/* Top Section: Avatar + Title & Info + Selected Check */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <ServiceAvatar serviceId={s.id} isSelected={isSelected} isDark={isDark} />

                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs sm:text-sm md:text-base font-bold leading-tight truncate ${
                              isDark ? "text-white" : "text-[#18181B]"
                            }`}>
                              {s.name}
                            </span>
                            {s.badge && (
                              <span className={`text-[8px] sm:text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border ${
                                isDark
                                  ? "bg-[#C89B58]/15 text-[#E5C268] border-[#C89B58]/35"
                                  : "bg-[#FAF0E4] text-[#8C601E] border-[#E8D4BE]"
                              }`}>
                                {s.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] sm:text-xs leading-relaxed line-clamp-2 mt-1 ${
                            isDark ? "text-[#9E9EA7]" : "text-[#71717A]"
                          }`}>
                            {s.shortDesc}
                          </p>
                        </div>
                      </div>

                      {/* Right Checkmark badge when selected */}
                      {isSelected && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#C89B58] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Duration + Price */}
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/5 dark:border-white/5">
                      <div className="flex items-center gap-1.5 text-xs text-[#C89B58] font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#C89B58]" />
                        <span>{s.duration}</span>
                      </div>
                      <span className={`font-mono font-bold text-xs sm:text-sm md:text-base ${
                        isDark ? "text-[#E5C268]" : "text-[#18181B]"
                      }`}>
                        {s.priceFormatted}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 1 Footer */}
            <div className="pt-2 sm:pt-3 flex items-center justify-between gap-3 border-t border-black/5 dark:border-white/5 shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#71717A] dark:text-[#9E9EA7]">
                <ShieldCheck className="w-4 h-4 text-[#C89B58]" />
                <span className="text-xs">Ambiente seguro, higienizado e profissional</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto ml-auto bg-[#18181B] hover:bg-black text-white px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md hover:scale-[1.01]"
              >
                <span>Avançar para Data</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 2: SELECIONE O DIA (CALENDÁRIO 7 COLUNAS X 5 SEMANAS)               */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="flex-1 min-h-0 flex flex-col justify-between py-2 animate-fadeIn">
            <div className="shrink-0 pb-1">
              <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#18181B]"
              }`}>
                Selecione o Dia
              </h2>
              <p className={`text-xs sm:text-sm mt-0.5 leading-tight ${
                isDark ? "text-[#9E9EA7]" : "text-[#71717A]"
              }`}>
                Marcação até 1 mês de adiantamento (Segunda a Sábado, 10:00 – 22:00).
              </p>
            </div>

            {/* 31-Day Month Grid (7 columns x 5 weeks) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 my-auto flex-1 min-h-0 py-2">
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
                    className={`py-1.5 sm:py-2 px-1 rounded-xl text-center border transition-all flex flex-col items-center justify-center cursor-pointer ${
                      d.isSunday
                        ? isDark
                          ? "opacity-25 cursor-not-allowed bg-black/20 border-white/5 text-[#9E9EA7]"
                          : "opacity-30 cursor-not-allowed bg-neutral-100 border-neutral-200 text-neutral-400"
                        : isSelected
                          ? isDark
                            ? "bg-[#C89B58] text-black font-bold border-[#C89B58] shadow-md scale-[1.02]"
                            : "bg-[#18181B] text-white font-bold border-[#18181B] shadow-md scale-[1.02]"
                          : isDark
                            ? "bg-[#10131A] border-white/10 text-[#FAF8F5] hover:border-[#C89B58]/40 hover:bg-[#141722]"
                            : "bg-white border-[#E8E4DC] text-[#18181B] hover:border-[#C89B58] hover:bg-[#FAF6F0] shadow-sm"
                    }`}
                  >
                    <span className={`text-[8px] sm:text-[9px] uppercase tracking-wider font-bold leading-none ${
                      isSelected ? (isDark ? "text-black/80" : "text-neutral-300") : isDark ? "text-[#9E9EA7]" : "text-neutral-500"
                    }`}>
                      {d.weekday}
                    </span>
                    <span className="text-sm sm:text-base font-bold leading-tight my-0.5">
                      {d.dayNum}
                    </span>
                    <span className={`text-[7px] sm:text-[8px] uppercase tracking-wider font-semibold leading-none ${
                      isSelected ? (isDark ? "text-black/80" : "text-neutral-300") : isDark ? "text-[#9E9EA7]" : "text-neutral-400"
                    }`}>
                      {d.month}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Date Sub-bar */}
            <div className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between text-xs sm:text-sm shrink-0 mb-2 ${
              isDark
                ? "bg-white/5 border-white/10 text-[#FAF8F5]"
                : "bg-[#FAF6F0] border-[#EADFCF] text-[#18181B]"
            }`}>
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 shrink-0 text-[#C89B58]" />
                <span>
                  Data: <strong className="capitalize text-[#C89B58]">{formattedDatePortuguese}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#9E9EA7]">
                <User className="w-3.5 h-3.5 text-[#C89B58]" />
                <span>Gabriel Silva</span>
              </div>
            </div>

            {/* Step 2 Footer */}
            <div className="pt-2 sm:pt-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#71717A] hover:text-black dark:text-[#9E9EA7] dark:hover:text-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-[#18181B] hover:bg-black text-white px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md hover:scale-[1.01]"
              >
                <span>Ver Horários ({currentService.duration})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 3: ESCOLHA O HORÁRIO (MANHÃ & TARDE/NOITE + OCUPADOS)                */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="flex-1 min-h-0 flex flex-col justify-between py-2 animate-fadeIn">
            <div className="shrink-0 pb-1">
              <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#18181B]"
              }`}>
                Escolha o Horário
              </h2>
              <p className={`text-xs sm:text-sm mt-0.5 leading-tight capitalize ${
                isDark ? "text-[#9E9EA7]" : "text-[#71717A]"
              }`}>
                {formattedDatePortuguese} • Duração: <span className="text-[#C89B58] font-bold">{currentService.duration}</span>
              </p>
            </div>

            {isLoadingSlots ? (
              <div className="py-12 text-center space-y-3 my-auto">
                <div className="w-9 h-9 border-2 border-[#C89B58] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className={`text-xs sm:text-sm ${isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}`}>
                  A consultar agenda em tempo real no Supabase...
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className={`py-8 text-center space-y-3 p-6 rounded-2xl border my-auto ${
                isDark ? "bg-white/5 border-white/10" : "bg-white border-[#E8E4DC] shadow-sm"
              }`}>
                <AlertCircle className="w-8 h-8 text-[#C89B58] mx-auto" />
                <h4 className={`text-sm sm:text-base font-bold ${isDark ? "text-white" : "text-[#18181B]"}`}>
                  Sem vagas para esta data
                </h4>
                <p className={`text-xs max-w-md mx-auto ${isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}`}>
                  A barbearia encontra-se encerrada ou com vagas esgotadas nesta data. Por favor selecione outro dia.
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#18181B] text-white px-6 py-2.5 text-xs rounded-full uppercase font-bold cursor-pointer hover:bg-black"
                >
                  Escolher Outra Data
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 my-auto flex-1 min-h-0 overflow-y-auto pr-1 py-1">
                {/* Morning Slots */}
                {availableSlots.some((s) => s.period === "morning") && (
                  <div className="space-y-1.5">
                    <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isDark ? "text-[#E5C268]" : "text-[#8C601E]"
                    }`}>
                      <Sun className="w-4 h-4 text-[#C89B58]" />
                      <span>MANHÃ (10:00 - 13:00)</span>
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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
                              className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center min-h-[40px] ${
                                isOccupied
                                  ? isDark
                                    ? "bg-black/30 border-white/5 text-[#666978] cursor-not-allowed opacity-50"
                                    : "bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                  : isSelected
                                    ? isDark
                                      ? "bg-[#C89B58] text-black border-[#C89B58] shadow-md scale-[1.02] cursor-pointer"
                                      : "bg-[#18181B] text-white border-[#18181B] shadow-md scale-[1.02] cursor-pointer"
                                    : isDark
                                      ? "bg-[#10131A] border-white/10 text-[#FAF8F5] hover:border-[#C89B58]/50 hover:bg-[#141722] cursor-pointer"
                                      : "bg-white border-[#E8E4DC] text-[#18181B] hover:border-[#C89B58] hover:bg-[#FAF6F0] shadow-sm cursor-pointer"
                              }`}
                            >
                              <span className={isOccupied ? "line-through text-neutral-400" : ""}>
                                {slot.time}
                              </span>
                              {isOccupied && (
                                <span className="text-[7.5px] font-bold text-red-500 uppercase tracking-tight">
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
                  <div className="space-y-1.5 pt-1">
                    <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isDark ? "text-[#E5C268]" : "text-[#8C601E]"
                    }`}>
                      <Moon className="w-4 h-4 text-[#C89B58]" />
                      <span>TARDE & NOITE (14:00 - 22:00)</span>
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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
                              className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center min-h-[40px] ${
                                isOccupied
                                  ? isDark
                                    ? "bg-black/30 border-white/5 text-[#666978] cursor-not-allowed opacity-50"
                                    : "bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                  : isSelected
                                    ? isDark
                                      ? "bg-[#C89B58] text-black border-[#C89B58] shadow-md scale-[1.02] cursor-pointer"
                                      : "bg-[#18181B] text-white border-[#18181B] shadow-md scale-[1.02] cursor-pointer"
                                    : isDark
                                      ? "bg-[#10131A] border-white/10 text-[#FAF8F5] hover:border-[#C89B58]/50 hover:bg-[#141722] cursor-pointer"
                                      : "bg-white border-[#E8E4DC] text-[#18181B] hover:border-[#C89B58] hover:bg-[#FAF6F0] shadow-sm cursor-pointer"
                              }`}
                            >
                              <span className={isOccupied ? "line-through text-neutral-400" : ""}>
                                {slot.time}
                              </span>
                              {isOccupied && (
                                <span className="text-[7.5px] font-bold text-red-500 uppercase tracking-tight">
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

            {/* Selected Time Sub-bar */}
            {selectedTime && (
              <div className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between text-xs sm:text-sm shrink-0 mb-2 animate-fadeIn ${
                isDark
                  ? "bg-[#C89B58]/10 border-[#C89B58]/30 text-[#E5C268]"
                  : "bg-[#FAF6F0] border-[#EADFCF] text-[#8C601E]"
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C89B58]" />
                  <span>
                    Horário escolhido: <strong>{selectedTime}</strong> ({currentService.duration})
                  </span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C89B58]">Selecionado</span>
              </div>
            )}

            {/* Step 3 Footer */}
            <div className="pt-2 sm:pt-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#71717A] hover:text-black dark:text-[#9E9EA7] dark:hover:text-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setStep(4)}
                className="bg-[#18181B] hover:bg-black disabled:opacity-40 text-white px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md hover:scale-[1.01]"
              >
                <span>Avançar para Dados</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 4: OS SEUS DADOS (SUMMARY CARD + CLEAN FORM INPUTS)                 */}
        {/* ========================================================================= */}
        {step === 4 && (
          <form onSubmit={handleBookingSubmit} className="flex-1 min-h-0 flex flex-col justify-between py-2 animate-fadeIn">
            <div className="shrink-0 pb-1">
              <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#18181B]"
              }`}>
                Os Seus Dados
              </h2>
              <p className={`text-xs sm:text-sm mt-0.5 leading-tight ${
                isDark ? "text-[#9E9EA7]" : "text-[#71717A]"
              }`}>
                Preencha os dados de contacto para confirmarmos o seu horário na barbearia.
              </p>
            </div>

            {/* Clean Summary Card */}
            <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm shrink-0 ${
              isDark
                ? "bg-[#11141C] border-white/10 text-white"
                : "bg-[#FAF6F0] border-[#EADFCF] text-[#18181B]"
            }`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#C89B58]" />
                  <p className="font-bold text-sm sm:text-base">
                    {currentService.name}
                  </p>
                </div>
                <p className={`text-xs capitalize ${isDark ? "text-[#E5C268]" : "text-[#8C601E]"}`}>
                  {formattedDatePortuguese} às <strong>{selectedTime}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-base sm:text-lg font-mono text-[#C89B58]">
                  {currentService.priceFormatted}
                </span>
                <p className={`text-xs ${isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}`}>
                  {currentService.duration}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 shrink-0 ${
                isDark
                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Input Fields (2 columns on md) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-auto py-1">
              {/* Name */}
              <div className="space-y-1">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isDark ? "text-[#9E9EA7]" : "text-[#18181B]"
                }`}>
                  <User className="w-3.5 h-3.5 text-[#C89B58]" />
                  <span>O seu nome completo *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={`w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border focus:outline-none transition-colors ${
                    isDark
                      ? "border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-[#C89B58]"
                      : "border-[#E8E4DC] bg-white text-[#18181B] placeholder-neutral-400 focus:border-[#18181B] shadow-sm"
                  }`}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isDark ? "text-[#9E9EA7]" : "text-[#18181B]"
                }`}>
                  <Phone className="w-3.5 h-3.5 text-[#C89B58]" />
                  <span>Telemóvel / WhatsApp *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: +351 912 345 678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className={`w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border focus:outline-none transition-colors ${
                    isDark
                      ? "border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-[#C89B58]"
                      : "border-[#E8E4DC] bg-white text-[#18181B] placeholder-neutral-400 focus:border-[#18181B] shadow-sm"
                  }`}
                />
              </div>

              {/* Notes (Span 2 cols on md) */}
              <div className="space-y-1 md:col-span-2">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isDark ? "text-[#9E9EA7]" : "text-[#18181B]"
                }`}>
                  <FileText className="w-3.5 h-3.5 text-[#C89B58]" />
                  <span>Observações (opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pretendo corte à tesoura e barba com toalha aquecida"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className={`w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border focus:outline-none transition-colors ${
                    isDark
                      ? "border-white/10 bg-black/40 text-white placeholder-white/30 focus:border-[#C89B58]"
                      : "border-[#E8E4DC] bg-white text-[#18181B] placeholder-neutral-400 focus:border-[#18181B] shadow-sm"
                  }`}
                />
              </div>
            </div>

            {/* Step 4 Footer */}
            <div className="pt-2 sm:pt-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#71717A] hover:text-black dark:text-[#9E9EA7] dark:hover:text-white cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#18181B] hover:bg-black disabled:opacity-50 text-white px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          <div className="flex-1 min-h-0 flex flex-col justify-between items-center text-center py-2 animate-fadeIn max-w-2xl mx-auto w-full">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#C89B58]/20 border-2 border-[#C89B58] flex items-center justify-center text-[#E5C268] mx-auto shadow-lg shadow-[#C89B58]/20 shrink-0">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#C89B58]" />
            </div>

            <div className="space-y-1 shrink-0">
              <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#18181B]"
              }`}>
                Marcação Confirmada!
              </h2>
              <p className={`text-xs sm:text-sm ${isDark ? "text-[#9E9EA7]" : "text-[#71717A]"}`}>
                O seu horário foi registado com sucesso na agenda da Rota do Corte.
              </p>
            </div>

            {/* Booking Details Card */}
            <div className={`p-4 sm:p-5 rounded-2xl border text-left space-y-2 text-xs sm:text-sm shrink-0 w-full ${
              isDark ? "bg-[#11141C] border-white/10" : "bg-[#FAF6F0] border-[#EADFCF] text-[#18181B] shadow-xs"
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
                <span className="text-right font-medium">
                  {shopInfo.addressShort}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1 shrink-0 w-full">
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
                className="w-full py-3 sm:py-3.5 text-xs sm:text-sm uppercase tracking-wider font-bold rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2.5 transition-all shadow-md shadow-[#25D366]/20 cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                <span>Enviar Confirmação por WhatsApp</span>
              </a>

              {/* Calendar Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={buildGoogleCalendarUrl({
                    serviceName: currentService.name,
                    date: selectedDate,
                    time: selectedTime,
                    durationMinutes: parseInt(currentService.duration, 10) || 30
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-2 px-3 sm:px-4 rounded-full border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                    isDark
                      ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                      : "border-[#E8E4DC] bg-white hover:bg-neutral-50 text-[#18181B] shadow-xs"
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C89B58]" />
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
                  className={`py-2 px-3 sm:px-4 rounded-full border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isDark
                      ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                      : "border-[#E8E4DC] bg-white hover:bg-neutral-50 text-[#18181B] shadow-xs"
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C89B58]" />
                  <span>Apple / Outlook (.ics)</span>
                </button>
              </div>
            </div>

            <div className="pt-1 shrink-0">
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
