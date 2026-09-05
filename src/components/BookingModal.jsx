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
  Crown,
  Layers
} from "lucide-react";
import confetti from "canvas-confetti";
import { WhatsAppIcon } from "./WhatsAppButton";
import { servicesData, shopInfo } from "../data/services";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { getAvailableSlots, createBooking } from "../lib/supabase";
import BarberBackgroundWatermark from "./BarberWatermarks";
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

  // Form State - Best-seller pre-selected by default to eliminate CTA friction
  const [selectedServiceId, setSelectedServiceId] = useState(
    preselectedService?.id || "corte-barba-terapia"
  );
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
    if (preselectedService?.id) {
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
      setSelectedServiceId(preselectedService?.id || "corte-barba-terapia");
    }
  }, [isOpen, preselectedService]);

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
    servicesData.find((s) => s.id === selectedServiceId) || servicesData[0];

  // Helper to generate next 31 selectable days (Full Month) with elegant natural casing
  const getNextDays = () => {
    const days = [];
    const base = new Date();
    for (let i = 0; i < 31; i++) {
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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-hidden animate-fadeIn"
      onClick={onClose}
    >
      {/* Dynamic Modal Container: Step 1 is 96vw, Steps 2-5 are responsive */}
      <div
        className={`relative ${
          step === 1
            ? "w-[96vw] max-w-5xl max-h-[92vh]"
            : "w-[95vw] sm:w-[85vw] md:w-[75vw] max-w-3xl lg:max-w-4xl max-h-[90vh]"
        } flex flex-col rounded-[22px] sm:rounded-[30px] p-3.5 sm:p-6 md:p-7 shadow-2xl justify-between border transition-all duration-300 overflow-hidden ${
          isDark
            ? "bg-[#171310] border-[#2D251F] text-[#FAF6F0] shadow-black/95"
            : "bg-white border-[#E8E4DC] text-[#18181B] shadow-2xl shadow-black/15"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Vintage Barber Tools Background Vector Watermarks */}
        <BarberBackgroundWatermark isDark={isDark} />

        {/* ========================================================================= */}
        {/* TOP BAR: BRAND LOGO + CLOSE BUTTON                                        */}
        {/* ========================================================================= */}
        <div className="relative z-10 space-y-2.5 shrink-0 pb-1.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Scissors Brand Mark */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#C6924B]/40 bg-[#C6924B]/10 flex items-center justify-center text-[#C6924B] shrink-0">
                <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 -rotate-45" />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs sm:text-sm font-bold font-sans leading-tight ${
                  isDark ? "text-[#FAF6F0]" : "text-[#18181B]"
                }`}>
                  Rota do Corte
                </span>
                <span className="text-[9px] sm:text-[10px] font-medium text-[#C6924B] leading-tight">
                  Paião
                </span>
              </div>
            </div>

            {/* Right: Close Button */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                  isDark
                    ? "bg-white/5 border-white/10 text-[#A39B92] hover:text-white hover:bg-white/15"
                    : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-100"
                }`}
                aria-label="Fechar"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                      ? "bg-[#C6924B]"
                      : isDark
                        ? "bg-[#2D251F]"
                        : "bg-[#EAE6DF]"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PASSO 1: ESCOLHA O SERVIÇO (ZERO-SCROLL ERGONOMIC COMPACT LIST/GRID)      */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between pt-1 animate-fadeIn">
            {/* Title & Subtitle with Fraunces Personality */}
            <div className="shrink-0 pb-2">
              <h2 className={`font-display text-lg sm:text-2xl font-bold tracking-tight ${
                isDark ? "text-[#FAF6F0]" : "text-[#18181B]"
              }`}>
                Escolha o serviço
              </h2>
              <p className={`text-[11px] sm:text-xs mt-0.5 leading-normal ${
                isDark ? "text-[#A39B92]" : "text-[#71717A]"
              }`}>
                Selecione o tratamento pretendido na barbearia de Gabriel Silva.
              </p>
            </div>

            {/* Zero-Scroll Compact Grid: Clear hierarchy with generous spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5 my-auto flex-1 min-h-0 overflow-y-auto py-1 pr-0.5">
              {servicesData.map((s, idx) => {
                const isSelected = selectedServiceId === s.id;
                const isTopSeller = s.id === "corte-barba-terapia";
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      idx === 4 ? "sm:col-span-2 lg:col-span-1" : ""
                    } ${
                      isSelected
                        ? isDark
                          ? "bg-[#241D17]/95 border-[#C6924B] ring-1 ring-[#C6924B] shadow-md shadow-[#C6924B]/15 backdrop-blur-xs"
                          : "bg-[#FAF6F0] border-[#C6924B] ring-1 ring-[#C6924B] shadow-xs"
                        : isTopSeller
                          ? isDark
                            ? "bg-[#1F1914]/95 border-[#C6924B]/60 hover:border-[#C6924B] shadow-xs backdrop-blur-xs"
                            : "bg-[#FAF8F5] border-[#C6924B]/50 hover:border-[#C6924B] shadow-xs"
                          : isDark
                            ? "bg-[#181411]/90 border-[#2D251F] hover:border-[#3F342B] hover:bg-[#1E1915]/95 backdrop-blur-xs"
                            : "bg-white border-[#E8E4DC] hover:border-[#C6924B]/40 hover:bg-neutral-50 shadow-xs"
                    }`}
                  >
                    {/* Top Section: Title & Info + Selected Indicator */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs sm:text-[13px] font-bold leading-tight truncate ${
                            isDark ? "text-[#FAF6F0]" : "text-[#18181B]"
                          }`}>
                            {s.name}
                          </span>
                          {s.badge && (
                            <span className={`text-[7.5px] sm:text-[8px] px-1.5 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${
                              s.id === "combo-premium"
                                ? isDark
                                  ? "border border-[#C6924B]/35 text-[#C6924B] bg-transparent"
                                  : "border border-[#C6924B]/40 text-[#8C601E] bg-transparent"
                                : isDark
                                  ? "bg-[#C6924B]/20 text-[#D8A763] border border-[#C6924B]/40"
                                  : "bg-[#FAF0E4] text-[#8C601E] border-[#E8D4BE]"
                            }`}>
                              {s.id === "combo-premium" && <Layers className="w-2.5 h-2.5 shrink-0" />}
                              <span>{s.badge}</span>
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] sm:text-[11px] mt-0.5 leading-tight line-clamp-1 sm:line-clamp-2 ${
                          isDark ? "text-[#A39B92]" : "text-[#71717A]"
                        }`}>
                          {s.shortDesc}
                        </p>
                      </div>

                      {/* Subtle selection check */}
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#C6924B] text-[#171310] flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Duration + Price */}
                    <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/5 dark:border-white/5">
                      <div className="flex items-center gap-1 text-[11px] text-[#A39B92] font-medium">
                        <Clock className="w-3 h-3 text-[#C6924B]" />
                        <span>{s.duration}</span>
                      </div>
                      <span className={`font-mono font-bold text-xs sm:text-[13px] ${
                        isDark ? "text-[#D8A763]" : "text-[#18181B]"
                      }`}>
                        {s.priceFormatted}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 1 Footer */}
            <div className="pt-2.5 sm:pt-3 mt-1.5 flex items-center justify-between gap-3 border-t border-[#2D251F] dark:border-[#2D251F] shrink-0 z-20">
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#71717A] dark:text-[#A39B92] shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C6924B] shrink-0" />
                <span className="text-xs whitespace-nowrap">{t.bookingModal.safeBadge || "Atendimento exclusivo • Gabriel Silva"}</span>
              </div>
              <button
                type="button"
                disabled={!selectedServiceId}
                onClick={() => {
                  if (selectedServiceId) setStep(2);
                }}
                className={`w-full sm:w-auto ml-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs font-extrabold tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 whitespace-nowrap ${
                  selectedServiceId
                    ? "bg-[#C6924B] hover:bg-[#B5823C] text-[#171310] shadow-[#C6924B]/20 hover:scale-[1.02] cursor-pointer"
                    : "bg-white/10 text-white/40 border border-white/10 cursor-not-allowed"
                }`}
              >
                <span className="whitespace-nowrap">{selectedServiceId ? "Continuar para data" : "Selecione um serviço"}</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 2: SELECIONE O DIA (CALENDÁRIO 7 COLUNAS X 5 SEMANAS)               */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between pt-1 animate-fadeIn">
            <div className="shrink-0 pb-2">
              <h2 className={`font-display text-lg sm:text-2xl font-bold tracking-tight ${
                isDark ? "text-[#FAF6F0]" : "text-[#18181B]"
              }`}>
                Selecione o dia
              </h2>
              <p className={`text-[11px] sm:text-xs mt-0.5 leading-normal ${
                isDark ? "text-[#A39B92]" : "text-[#71717A]"
              }`}>
                Marcação com até 1 mês de antecedência (Segunda a Sábado, 10:00 – 22:00).
              </p>
            </div>

            {/* 31-Day Month Grid (7 columns x 5 weeks) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 my-auto flex-1 min-h-0 overflow-y-auto py-1 pr-0.5">
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
                    className={`py-1.5 px-0.5 rounded-xl text-center border transition-all flex flex-col items-center justify-center cursor-pointer min-h-[44px] sm:min-h-[48px] ${
                      d.isSunday
                        ? isDark
                          ? "opacity-25 cursor-not-allowed bg-black/30 border-[#2D251F]/40 text-[#6B635A]"
                          : "opacity-30 cursor-not-allowed bg-neutral-100 border-neutral-200 text-neutral-400"
                        : isSelected
                          ? isDark
                            ? "bg-[#C6924B] text-[#171310] font-bold border-[#C6924B] shadow-md scale-[1.02]"
                            : "bg-[#18181B] text-white font-bold border-[#18181B] shadow-md scale-[1.02]"
                          : isDark
                            ? "bg-[#1B1613] border-[#2D251F] text-[#FAF6F0] hover:border-[#C6924B]/40 hover:bg-[#201A15]"
                            : "bg-white border-[#E8E4DC] text-[#18181B] hover:border-[#C6924B] hover:bg-[#FAF6F0] shadow-xs"
                    }`}
                  >
                    <span className={`text-[8px] sm:text-[9px] font-semibold leading-none ${
                      isSelected ? (isDark ? "text-[#171310]" : "text-neutral-300") : isDark ? "text-[#A39B92]" : "text-neutral-500"
                    }`}>
                      {d.weekday}
                    </span>
                    <span className="text-xs sm:text-sm font-bold leading-tight my-0.5">
                      {d.dayNum}
                    </span>
                    <span className={`text-[7.5px] sm:text-[8px] font-medium leading-none ${
                      isSelected ? (isDark ? "text-[#171310]" : "text-neutral-300") : isDark ? "text-[#A39B92]" : "text-neutral-400"
                    }`}>
                      {d.month}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Date Sub-bar */}
            <div className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm shrink-0 my-1.5 ${
              isDark
                ? "bg-[#1E1915] border-[#2D251F] text-[#FAF6F0]"
                : "bg-[#FAF6F0] border-[#EADFCF] text-[#18181B]"
            }`}>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-[#C6924B]" />
                <span>
                  Data: <strong className="capitalize text-[#C6924B]">{formattedDatePortuguese}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A39B92]">
                <User className="w-3.5 h-3.5 text-[#C6924B]" />
                <span>Gabriel Silva</span>
              </div>
            </div>

            {/* Step 2 Footer */}
            <div className="pt-2.5 sm:pt-3 mt-1.5 flex items-center justify-between gap-3 border-t border-[#2D251F] dark:border-[#2D251F] shrink-0 z-20">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 text-[#71717A] hover:text-black dark:text-[#A39B92] dark:hover:text-white cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-[#C6924B] hover:bg-[#B5823C] text-[#171310] font-extrabold px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs tracking-wide flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-[#C6924B]/20 hover:scale-[1.02] shrink-0 whitespace-nowrap"
              >
                <span className="whitespace-nowrap">Ver horários ({currentService.duration})</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 3: ESCOLHA O HORÁRIO (MANHÃ & TARDE/NOITE + OCUPADOS)                */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between pt-1 animate-fadeIn">
            <div className="shrink-0 pb-2">
              <h2 className={`font-display text-lg sm:text-2xl font-bold tracking-tight ${
                isDark ? "text-[#FAF6F0]" : "text-[#18181B]"
              }`}>
                Escolha o horário
              </h2>
              <p className={`text-[11px] sm:text-xs mt-0.5 leading-normal capitalize ${
                isDark ? "text-[#A39B92]" : "text-[#71717A]"
              }`}>
                {formattedDatePortuguese} • Duração: <span className="text-[#C6924B] font-bold">{currentService.duration}</span>
              </p>
            </div>

            {isLoadingSlots ? (
              <div className="py-12 text-center space-y-3 my-auto">
                <div className="w-8 h-8 border-2 border-[#C6924B] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className={`text-xs ${isDark ? "text-[#A39B92]" : "text-[#71717A]"}`}>
                  A consultar agenda em tempo real no Supabase...
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className={`py-8 text-center space-y-3 p-6 rounded-2xl border my-auto ${
                isDark ? "bg-[#1E1915] border-[#2D251F]" : "bg-white border-[#E8E4DC] shadow-sm"
              }`}>
                <AlertCircle className="w-8 h-8 text-[#C6924B] mx-auto" />
                <h4 className={`text-sm sm:text-base font-bold ${isDark ? "text-[#FAF6F0]" : "text-[#18181B]"}`}>
                  Sem vagas para esta data
                </h4>
                <p className={`text-xs max-w-md mx-auto ${isDark ? "text-[#A39B92]" : "text-[#71717A]"}`}>
                  A barbearia encontra-se encerrada ou com vagas esgotadas nesta data. Por favor selecione outro dia.
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-[#C6924B] text-[#171310] font-bold px-6 py-2.5 text-xs rounded-full cursor-pointer hover:bg-[#B5823C]"
                >
                  Escolher Outra Data
                </button>
              </div>
            ) : (
              <div className="space-y-3 my-auto flex-1 min-h-0 overflow-y-auto pr-0.5 py-1">
                {/* Morning Slots */}
                {availableSlots.some((s) => s.period === "morning") && (
                  <div className="space-y-1.5">
                    <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                      isDark ? "text-[#D8A763]" : "text-[#8C601E]"
                    }`}>
                      <Sun className="w-3.5 h-3.5 text-[#C6924B]" />
                      <span>Manhã (10:00 – 13:00)</span>
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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
                              className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center min-h-[42px] ${
                                isOccupied
                                  ? isDark
                                    ? "bg-black/30 border-[#2D251F]/40 text-[#6B635A] cursor-not-allowed opacity-50"
                                    : "bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                  : isSelected
                                    ? isDark
                                      ? "bg-[#C6924B] text-[#171310] border-[#C6924B] shadow-md scale-[1.02] cursor-pointer"
                                      : "bg-[#18181B] text-white border-[#18181B] shadow-md scale-[1.02] cursor-pointer"
                                    : isDark
                                      ? "bg-[#1B1613] border-[#2D251F] text-[#FAF6F0] hover:border-[#C6924B]/50 hover:bg-[#201A15] cursor-pointer"
                                      : "bg-white border-[#E8E4DC] text-[#18181B] hover:border-[#C6924B] hover:bg-[#FAF6F0] shadow-xs cursor-pointer"
                              }`}
                            >
                              <span className={isOccupied ? "line-through text-neutral-500" : ""}>
                                {slot.time}
                              </span>
                              {isOccupied && (
                                <span className="text-[7.5px] font-semibold text-red-400 mt-0.5">
                                  Ocupado
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
                    <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                      isDark ? "text-[#D8A763]" : "text-[#8C601E]"
                    }`}>
                      <Moon className="w-3.5 h-3.5 text-[#C6924B]" />
                      <span>Tarde & Noite (14:00 – 22:00)</span>
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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
                              className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center min-h-[42px] ${
                                isOccupied
                                  ? isDark
                                    ? "bg-black/30 border-[#2D251F]/40 text-[#6B635A] cursor-not-allowed opacity-50"
                                    : "bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                  : isSelected
                                    ? isDark
                                      ? "bg-[#C6924B] text-[#171310] border-[#C6924B] shadow-md scale-[1.02] cursor-pointer"
                                      : "bg-[#18181B] text-white border-[#18181B] shadow-md scale-[1.02] cursor-pointer"
                                    : isDark
                                      ? "bg-[#1B1613] border-[#2D251F] text-[#FAF6F0] hover:border-[#C6924B]/50 hover:bg-[#201A15] cursor-pointer"
                                      : "bg-white border-[#E8E4DC] text-[#18181B] hover:border-[#C6924B] hover:bg-[#FAF6F0] shadow-xs cursor-pointer"
                              }`}
                            >
                              <span className={isOccupied ? "line-through text-neutral-500" : ""}>
                                {slot.time}
                              </span>
                              {isOccupied && (
                                <span className="text-[7.5px] font-semibold text-red-400 mt-0.5">
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

            {/* Selected Time Sub-bar */}
            {selectedTime && (
              <div className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm shrink-0 my-1.5 animate-fadeIn ${
                isDark
                  ? "bg-[#C6924B]/10 border-[#C6924B]/30 text-[#D8A763]"
                  : "bg-[#FAF6F0] border-[#EADFCF] text-[#8C601E]"
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#C6924B]" />
                  <span>
                    Horário escolhido: <strong>{selectedTime}</strong> ({currentService.duration})
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#C6924B]">Selecionado</span>
              </div>
            )}

            {/* Step 3 Footer */}
            <div className="pt-2.5 sm:pt-3 mt-1.5 flex items-center justify-between gap-3 border-t border-[#2D251F] dark:border-[#2D251F] shrink-0 z-20">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 text-[#71717A] hover:text-black dark:text-[#A39B92] dark:hover:text-white cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setStep(4)}
                className="bg-[#C6924B] hover:bg-[#B5823C] disabled:opacity-40 text-[#171310] font-extrabold px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs tracking-wide flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-[#C6924B]/20 hover:scale-[1.02] shrink-0 whitespace-nowrap"
              >
                <span className="whitespace-nowrap">Avançar para dados</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 4: OS SEUS DADOS (GENEROUS SPACING, PREMIUM INPUTS)                */}
        {/* ========================================================================= */}
        {step === 4 && (
          <form onSubmit={handleBookingSubmit} className="relative z-10 flex-1 min-h-0 flex flex-col justify-between pt-1 animate-fadeIn">
            <div className="shrink-0 pb-2">
              <h2 className={`font-display text-lg sm:text-2xl font-bold tracking-tight ${
                isDark ? "text-[#FAF6F0]" : "text-[#18181B]"
              }`}>
                Os seus dados
              </h2>
              <p className={`text-[11px] sm:text-xs mt-0.5 leading-normal ${
                isDark ? "text-[#A39B92]" : "text-[#71717A]"
              }`}>
                Preencha os dados de contacto para confirmarmos o seu horário na barbearia.
              </p>
            </div>

            {/* Clean Summary Card */}
            <div className={`p-3 sm:p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm shrink-0 mb-2.5 ${
              isDark
                ? "bg-[#1E1915] border-[#2D251F] text-[#FAF6F0]"
                : "bg-[#FAF6F0] border-[#EADFCF] text-[#18181B]"
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C6924B]" />
                  <p className="font-bold text-xs sm:text-sm md:text-base">
                    {currentService.name}
                  </p>
                </div>
                <p className={`text-[11px] sm:text-xs capitalize font-medium ${isDark ? "text-[#D8A763]" : "text-[#8C601E]"}`}>
                  {formattedDatePortuguese} às <strong>{selectedTime}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm sm:text-lg font-mono text-[#C6924B]">
                  {currentService.priceFormatted}
                </span>
                <p className={`text-[11px] sm:text-xs ${isDark ? "text-[#A39B92]" : "text-[#71717A]"}`}>
                  {currentService.duration}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 shrink-0 mb-2 ${
                isDark
                  ? "bg-red-500/20 border-red-500/40 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 my-auto py-1">
              {/* Name */}
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isDark ? "text-[#A39B92]" : "text-[#18181B]"
                }`}>
                  <User className="w-3.5 h-3.5 text-[#C6924B]" />
                  <span>O seu nome completo *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border focus:outline-none transition-colors ${
                    isDark
                      ? "border-[#2D251F] bg-[#120F0D] text-[#FAF6F0] placeholder-[#6B635A] focus:border-[#C6924B]"
                      : "border-[#E8E4DC] bg-white text-[#18181B] placeholder-neutral-400 focus:border-[#18181B] shadow-xs"
                  }`}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isDark ? "text-[#A39B92]" : "text-[#18181B]"
                }`}>
                  <Phone className="w-3.5 h-3.5 text-[#C6924B]" />
                  <span>Telemóvel / WhatsApp *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: +351 912 345 678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className={`w-full px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border focus:outline-none transition-colors ${
                    isDark
                      ? "border-[#2D251F] bg-[#120F0D] text-[#FAF6F0] placeholder-[#6B635A] focus:border-[#C6924B]"
                      : "border-[#E8E4DC] bg-white text-[#18181B] placeholder-neutral-400 focus:border-[#18181B] shadow-xs"
                  }`}
                />
              </div>

              {/* Notes (Span 2 cols on md) */}
              <div className="space-y-1.5 md:col-span-2">
                <label className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isDark ? "text-[#A39B92]" : "text-[#18181B]"
                }`}>
                  <FileText className="w-3.5 h-3.5 text-[#C6924B]" />
                  <span>Observações (opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pretendo corte à tesoura e barba com toalha aquecida"
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className={`w-full px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border focus:outline-none transition-colors ${
                    isDark
                      ? "border-[#2D251F] bg-[#120F0D] text-[#FAF6F0] placeholder-[#6B635A] focus:border-[#C6924B]"
                      : "border-[#E8E4DC] bg-white text-[#18181B] placeholder-neutral-400 focus:border-[#18181B] shadow-xs"
                  }`}
                />
              </div>
            </div>

            {/* Step 4 Footer */}
            <div className="pt-2.5 sm:pt-3 mt-1.5 flex items-center justify-between gap-3 border-t border-[#2D251F] dark:border-[#2D251F] shrink-0 z-20">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 text-[#71717A] hover:text-black dark:text-[#A39B92] dark:hover:text-white cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Voltar</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#C6924B] hover:bg-[#B5823C] disabled:opacity-50 text-[#171310] font-extrabold px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs tracking-wide flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-[#C6924B]/20 hover:scale-[1.02] shrink-0 whitespace-nowrap"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#171310] border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="whitespace-nowrap">A confirmar...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                    <span className="whitespace-nowrap">Confirmar agendamento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* PASSO 5: SUCESSO & CONFIRMAÇÃO IMEDIATA (SPACIOUS & DELIGHTFUL)           */}
        {/* ========================================================================= */}
        {step === 5 && (
          <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between items-center text-center py-2 sm:py-3 animate-fadeIn max-w-2xl mx-auto w-full">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#C6924B]/20 border-2 border-[#C6924B] flex items-center justify-center text-[#D8A763] mx-auto shadow-lg shadow-[#C6924B]/20 shrink-0 mb-1.5">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#C6924B]" />
            </div>

            <div className="space-y-1 shrink-0">
              <h2 className={`font-display text-lg sm:text-2xl font-bold tracking-tight ${
                isDark ? "text-[#FAF6F0]" : "text-[#18181B]"
              }`}>
                Marcação confirmada!
              </h2>
              <p className={`text-xs ${isDark ? "text-[#A39B92]" : "text-[#71717A]"}`}>
                O seu horário foi registado com sucesso na agenda da Rota do Corte.
              </p>
            </div>

            {/* Booking Details Card */}
            <div className={`p-4 sm:p-5 rounded-xl border text-left space-y-2.5 text-xs sm:text-sm shrink-0 w-full my-3 ${
              isDark ? "bg-[#1E1915] border-[#2D251F] text-[#FAF6F0]" : "bg-[#FAF6F0] border-[#EADFCF] text-[#18181B] shadow-xs"
            }`}>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className={isDark ? "text-[#A39B92]" : "text-[#71717A]"}>Serviço:</span>
                <span className="font-bold">
                  {currentService.name}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className={isDark ? "text-[#A39B92]" : "text-[#71717A]"}>Barbeiro:</span>
                <span className="font-bold text-[#C6924B]">
                  Gabriel Silva
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className={isDark ? "text-[#A39B92]" : "text-[#71717A]"}>Data & Hora:</span>
                <span className="font-bold capitalize">
                  {formattedDatePortuguese} às {selectedTime}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className={isDark ? "text-[#A39B92]" : "text-[#71717A]"}>Valor:</span>
                <span className="font-bold text-[#C6924B]">
                  {currentService.priceFormatted}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDark ? "text-[#A39B92]" : "text-[#71717A]"}>Localização:</span>
                <span className="text-right font-medium">
                  {shopInfo.addressShort}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-0.5 shrink-0 w-full">
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
                className="w-full py-3 sm:py-3.5 text-xs sm:text-sm font-bold rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-[#25D366]/20 cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>Enviar confirmação por WhatsApp</span>
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
                  className={`py-2.5 px-3 rounded-full border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    isDark
                      ? "border-[#2D251F] bg-[#1B1613] hover:bg-[#221C17] text-[#FAF6F0]"
                      : "border-[#E8E4DC] bg-white hover:bg-neutral-50 text-[#18181B] shadow-xs"
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-[#C6924B]" />
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
                  className={`py-2.5 px-3 rounded-full border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isDark
                      ? "border-[#2D251F] bg-[#1B1613] hover:bg-[#221C17] text-[#FAF6F0]"
                      : "border-[#E8E4DC] bg-white hover:bg-neutral-50 text-[#18181B] shadow-xs"
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 text-[#C6924B]" />
                  <span>Apple / Outlook (.ics)</span>
                </button>
              </div>
            </div>

            <div className="pt-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className={`text-xs font-semibold cursor-pointer transition-colors ${
                  isDark ? "text-[#A39B92] hover:text-white" : "text-[#71717A] hover:text-[#18181B]"
                }`}
              >
                Concluir e fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
