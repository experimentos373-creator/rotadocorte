import { useState, useEffect, useMemo } from "react";
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
  Sun,
  Moon,
  Layers,
  Plus,
  Minus,
  Users
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
  downloadIcsFile,
  sendAdminWhatsAppNotification
} from "../lib/bookingEngine";

export default function BookingModal({ isOpen, onClose, preselectedService }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Streamlined 4-step wizard + 5th confirmation:
  // 1 = Serviços, 2 = Data, 3 = Horário (slots 30m), 4 = Detalhes, 5 = Confirmação
  const [step, setStep] = useState(1);

  // Multi-service quantity map: { [serviceId]: quantity }
  const [selectedServices, setSelectedServices] = useState({
    [preselectedService?.id || "corte-barba-terapia"]: 1
  });
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

  const MAX_PERSONS = 4;

  // Computed list of selected services
  const selectedItemsList = useMemo(() => {
    return Object.entries(selectedServices)
      .filter(([_, qty]) => qty > 0)
      .map(([sId, qty]) => {
        const s = servicesData.find((item) => item.id === sId);
        return {
          id: sId,
          name: s?.name || sId,
          price: s?.price || 0,
          priceFormatted: s?.priceFormatted || `${s?.price} €`,
          duration: s?.duration || "30 min",
          quantity: qty,
          subtotal: (s?.price || 0) * qty,
          itemData: s
        };
      });
  }, [selectedServices]);

  const totalQuantity = useMemo(() => {
    return selectedItemsList.reduce((acc, item) => acc + item.quantity, 0);
  }, [selectedItemsList]);

  const totalPriceNumber = useMemo(() => {
    return selectedItemsList.reduce((acc, item) => acc + item.subtotal, 0);
  }, [selectedItemsList]);

  const totalPriceFormatted = `${totalPriceNumber.toFixed(2).replace(".", ",")} €`;

  const primaryServiceId = selectedItemsList[0]?.id || "corte-barba-terapia";
  const primaryService = servicesData.find((s) => s.id === primaryServiceId) || servicesData[0];

  const servicesSummaryText = selectedItemsList.length > 0
    ? selectedItemsList.map((item) => `${item.quantity}x ${item.name}`).join(" + ")
    : primaryService.name;

  const calculateEndTime = (startTimeStr, quantity) => {
    if (!startTimeStr) return "";
    const [h, m] = startTimeStr.split(":").map(Number);
    const totalMinutes = (h || 0) * 60 + (m || 0) + (quantity || 1) * 30;
    const endH = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const endM = String(totalMinutes % 60).padStart(2, "0");
    return `${endH}:${endM}`;
  };

  const selectedEndTime = calculateEndTime(selectedTime, totalQuantity);

  const formattedTimeRange = selectedTime
    ? totalQuantity > 1
      ? `${selectedTime} – ${selectedEndTime} (${totalQuantity * 30} min • ${totalQuantity} pessoas)`
      : `${selectedTime} (30 min)`
    : "";

  const handleSelectOrToggle = (serviceId) => {
    setSelectedServices((prev) => {
      const currentTotal = Object.values(prev).reduce((acc, q) => acc + q, 0);
      const current = prev[serviceId] || 0;
      if (current === 0) {
        if (currentTotal >= MAX_PERSONS) return prev;
        return { ...prev, [serviceId]: 1 };
      }
      return prev;
    });
  };

  const handleIncrement = (serviceId, e) => {
    e?.stopPropagation();
    setSelectedServices((prev) => {
      const currentTotal = Object.values(prev).reduce((acc, q) => acc + q, 0);
      if (currentTotal >= MAX_PERSONS) return prev;
      const current = prev[serviceId] || 0;
      return { ...prev, [serviceId]: current + 1 };
    });
  };

  const handleDecrement = (serviceId, e) => {
    e?.stopPropagation();
    setSelectedServices((prev) => {
      const current = prev[serviceId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[serviceId];
        return next;
      }
      return { ...prev, [serviceId]: current - 1 };
    });
  };

  // Consecutive Slot Availability for multi-person bookings
  const evaluatedSlots = useMemo(() => {
    if (!availableSlots || availableSlots.length === 0) return [];
    if (totalQuantity <= 1) return availableSlots;

    return availableSlots.map((slot, idx) => {
      if (!slot.available) return slot;

      const [sh, sm] = slot.time.split(":").map(Number);
      const startMin = (sh || 0) * 60 + (sm || 0);
      let isViable = true;

      for (let k = 1; k < totalQuantity; k++) {
        const nextSlot = availableSlots[idx + k];
        const expectedMin = startMin + k * 30;
        if (!nextSlot || !nextSlot.available) {
          isViable = false;
          break;
        }
        const [nh, nm] = nextSlot.time.split(":").map(Number);
        if ((nh || 0) * 60 + (nm || 0) !== expectedMin) {
          isViable = false;
          break;
        }
      }

      if (!isViable) {
        return {
          ...slot,
          available: false,
          reason: "insufficient_duration",
          reasonLabel: `Requer ${totalQuantity * 30} min`
        };
      }

      return slot;
    });
  }, [availableSlots, totalQuantity]);

  // Lock scroll
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
      setSelectedServices({ [preselectedService.id]: 1 });
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
      setSelectedServices({
        [preselectedService?.id || "corte-barba-terapia"]: 1
      });
    }
  }, [isOpen, preselectedService]);

  // Fetch slots
  useEffect(() => {
    if (!selectedDate || !primaryServiceId) return;

    let isMounted = true;
    setIsLoadingSlots(true);
    setErrorMessage("");

    getAvailableSlots({
      shopSlug: "rotadocorte",
      date: selectedDate,
      serviceId: primaryServiceId
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
  }, [selectedDate, primaryServiceId]);

  if (!isOpen) return null;

  const currentService = primaryService;

  // Next 31 selectable days
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
        serviceId: primaryServiceId,
        selectedServices: selectedItemsList,
        totalPrice: totalPriceFormatted,
        totalQuantity: totalQuantity,
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

        sendAdminWhatsAppNotification({
          serviceName: servicesSummaryText || primaryService?.name,
          servicePrice: totalPriceFormatted,
          dateFormatted: formattedDatePortuguese,
          time: formattedTimeRange || selectedTime,
          clientName: clientName.trim(),
          phone: clientPhone.trim(),
          notes: clientNotes.trim()
        }).catch((err) => {
          console.warn("Falha no envio de notificação WhatsApp (não-bloqueante):", err);
        });

        try {
          confetti({
            particleCount: 65,
            spread: 55,
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

  const stepsList = [
    { number: 1, label: "Serviços" },
    { number: 2, label: "Data" },
    { number: 3, label: "Horário" },
    { number: 4, label: "Detalhes" }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fadeIn"
      onClick={onClose}
    >
      {/* shadcn Dialog Block Card */}
      <div
        className={`relative ${
          step === 1
            ? "w-full max-w-4xl max-h-[92vh]"
            : "w-full max-w-2xl max-h-[90vh]"
        } flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xl ${
          isDark
            ? "bg-zinc-950 border-zinc-800 text-zinc-100"
            : "bg-white border-zinc-200 text-zinc-900 shadow-zinc-950/10"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Watermark for Barber Identity */}
        <BarberBackgroundWatermark isDark={isDark} />

        {/* ========================================================================= */}
        {/* SHADCN DIALOG HEADER & STEPPER                                            */}
        {/* ========================================================================= */}
        <div className={`relative z-10 px-4 sm:px-6 pt-5 pb-4 border-b ${
          isDark ? "border-zinc-800/80 bg-zinc-950/90" : "border-zinc-200/80 bg-white/90"
        } backdrop-blur-md shrink-0`}>
          <div className="flex items-center justify-between gap-4">
            {/* Brand Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#C6924B]/15 border border-[#C6924B]/30 flex items-center justify-center text-[#C6924B] shrink-0">
                <Scissors className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm tracking-tight truncate">
                    Rota do Corte
                  </h3>
                  <span className="text-[10px] font-medium font-mono px-1.5 py-0.2 rounded-md bg-[#C6924B]/10 text-[#C6924B] border border-[#C6924B]/20">
                    Paião
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">
                  Agendamento Online de Gabriel Silva
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? "border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80"
                  : "border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* shadcn Stepper Indicator */}
          {step < 5 && (
            <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {stepsList.map((s, idx) => {
                  const isCurrent = step === s.number;
                  const isDone = step > s.number;
                  return (
                    <div key={s.number} className="flex items-center gap-1.5 sm:gap-2">
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
                          isCurrent
                            ? "bg-zinc-100 text-zinc-950 font-semibold shadow-xs"
                            : isDone
                              ? isDark
                                ? "bg-zinc-900 text-zinc-300 font-medium"
                                : "bg-zinc-100 text-zinc-700 font-medium"
                              : isDark
                                ? "text-zinc-500"
                                : "text-zinc-400"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isCurrent
                              ? "bg-zinc-950 text-zinc-100"
                              : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {isDone ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : s.number}
                        </span>
                        <span className="hidden sm:inline text-xs">{s.label}</span>
                      </div>
                      {idx < stepsList.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step counter badge on small mobile */}
              <div className="sm:hidden text-[11px] font-mono text-zinc-400 font-medium">
                Passo {step}/4
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PASSO 1: ESCOLHA OS SERVIÇOS (SHADCN CARDS GRID)                          */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-fadeIn">
            {/* Section Header */}
            <div className="pb-3 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100">
                Selecione os serviços
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Escolha um ou mais serviços pretendidos para o seu atendimento.
              </p>
            </div>

            {/* Helper Banner for Multi-Bookings */}
            <div className={`px-3 py-2.5 rounded-lg border flex items-center gap-2.5 text-xs mb-3 shrink-0 ${
              isDark
                ? "bg-zinc-900/60 border-zinc-800 text-zinc-300"
                : "bg-zinc-50 border-zinc-200 text-zinc-700"
            }`}>
              <Users className="w-4 h-4 text-[#C6924B] shrink-0" />
              <div className="leading-tight">
                <strong>Marcação em grupo ou família?</strong> Use o botão <strong>[+]</strong> para agendar até <strong>4 pessoas</strong> (reserva slots de 30 min consecutivos no calendário).
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 flex-1 min-h-0 overflow-y-auto pr-1 py-1">
              {servicesData.map((s) => {
                const qty = selectedServices[s.id] || 0;
                const isSelected = qty > 0;
                const isTopSeller = s.id === "corte-barba-terapia";
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectOrToggle(s.id)}
                    className={`relative rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? isDark
                          ? "bg-zinc-900/90 border-[#C6924B] ring-1 ring-[#C6924B]/40 shadow-xs"
                          : "bg-zinc-50 border-[#C6924B] ring-1 ring-[#C6924B]/30 shadow-xs"
                        : isDark
                          ? "bg-zinc-900/40 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/70"
                          : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/70"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-[13px] font-semibold tracking-tight text-zinc-100">
                            {s.name}
                          </span>
                          {s.badge && (
                            <span className="text-[9px] font-medium font-mono px-1.5 py-0.2 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {s.badge}
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#C6924B] text-zinc-950 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {s.shortDesc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{s.duration}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs sm:text-sm text-zinc-100">
                          {s.priceFormatted}
                        </span>

                        {isSelected ? (
                          <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={(e) => handleDecrement(s.id, e)}
                              className="w-5 h-5 rounded-md hover:bg-zinc-700 text-zinc-200 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                              title="Diminuir quantidade"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="font-mono font-semibold text-xs text-zinc-100 min-w-[14px] text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              disabled={totalQuantity >= MAX_PERSONS}
                              onClick={(e) => handleIncrement(s.id, e)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                                totalQuantity >= MAX_PERSONS
                                  ? "text-zinc-600 cursor-not-allowed"
                                  : "bg-zinc-100 text-zinc-950 hover:bg-white cursor-pointer"
                              }`}
                              title={totalQuantity >= MAX_PERSONS ? "Limite de 4 atingido" : "Adicionar mais um"}
                            >
                              <Plus className="w-2.5 h-2.5 stroke-[3]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={totalQuantity >= MAX_PERSONS}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOrToggle(s.id);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                              totalQuantity >= MAX_PERSONS
                                ? "border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                                : "border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-200 cursor-pointer"
                            }`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Adicionar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 1 Footer */}
            <div className={`pt-4 mt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
              isDark ? "border-zinc-800" : "border-zinc-200"
            }`}>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-[#C6924B] shrink-0" />
                <span>
                  {totalQuantity > 0 ? (
                    <>
                      Selecionado: <strong className="text-zinc-100 font-mono font-semibold">{totalQuantity} {totalQuantity === 1 ? "serviço" : "serviços"}</strong> ({totalPriceFormatted})
                      {totalQuantity > 1 && ` • ${totalQuantity * 30} min`}
                    </>
                  ) : (
                    "Selecione pelo menos um serviço"
                  )}
                </span>
              </div>

              <button
                type="button"
                disabled={totalQuantity === 0}
                onClick={() => {
                  if (totalQuantity > 0) setStep(2);
                }}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold tracking-tight flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  totalQuantity > 0
                    ? "bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
                }`}
              >
                <span>Continuar para data</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 2: SELECIONE A DATA (SHADCN CALENDAR GRID BLOCK)                     */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-fadeIn">
            <div className="pb-3 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100">
                Selecione o dia
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Segunda (13h – 22h) • Terça a Sexta (10h – 22h) • Sábado (10h – 18h). Encerrado ao Domingo.
              </p>
            </div>

            {/* 31-Day Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1 min-h-0 overflow-y-auto pr-1 py-1">
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
                    className={`py-2 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[46px] ${
                      d.isSunday
                        ? isDark
                          ? "opacity-25 cursor-not-allowed bg-zinc-900/30 border-zinc-800/40 text-zinc-600"
                          : "opacity-30 cursor-not-allowed bg-zinc-100 border-zinc-200 text-zinc-400"
                        : isSelected
                          ? "bg-zinc-100 text-zinc-950 font-bold border-zinc-100 shadow-sm"
                          : isDark
                            ? "bg-zinc-900/50 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800"
                            : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <span className={`text-[9px] font-medium leading-none ${
                      isSelected ? "text-zinc-900" : "text-zinc-400"
                    }`}>
                      {d.weekday}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold font-mono leading-tight my-0.5">
                      {d.dayNum}
                    </span>
                    <span className={`text-[8px] font-medium leading-none ${
                      isSelected ? "text-zinc-800" : "text-zinc-500"
                    }`}>
                      {d.month}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selection Status Sub-bar */}
            <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs shrink-0 my-2 ${
              isDark ? "bg-zinc-900/60 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"
            }`}>
              <div className="flex items-center gap-2 truncate">
                <CalendarIcon className="w-3.5 h-3.5 text-[#C6924B] shrink-0" />
                <span className="truncate">
                  Data selecionada: <strong className="capitalize text-zinc-100">{formattedDatePortuguese}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] shrink-0">
                <User className="w-3 h-3 text-[#C6924B]" />
                <span>Gabriel Silva</span>
              </div>
            </div>

            {/* Step 2 Footer */}
            <div className={`pt-4 mt-2 border-t flex items-center justify-between gap-3 shrink-0 ${
              isDark ? "border-zinc-800" : "border-zinc-200"
            }`}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-semibold tracking-tight flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <span>Ver horários</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 3: ESCOLHA O HORÁRIO (SHADCN TIME PICKER BLOCK)                      */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-fadeIn">
            <div className="pb-3 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100">
                Escolha o horário
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 capitalize">
                {formattedDatePortuguese} • Total: <strong className="text-zinc-100 font-mono">{totalPriceFormatted}</strong>
                {totalQuantity > 1 && (
                  <span className="block sm:inline text-[#C6924B] sm:ml-2">
                    ({totalQuantity * 30} min consecutivos requeridos)
                  </span>
                )}
              </p>
            </div>

            {isLoadingSlots ? (
              <div className="py-16 text-center space-y-3 my-auto">
                <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-zinc-400 font-mono">A verificar disponibilidade em tempo real...</p>
              </div>
            ) : evaluatedSlots.length === 0 ? (
              <div className={`p-8 text-center space-y-3 rounded-xl border my-auto ${
                isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-zinc-50 border-zinc-200"
              }`}>
                <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto" />
                <h4 className="text-sm font-semibold text-zinc-200">
                  Sem horários disponíveis para este dia
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  A barbearia encontra-se encerrada ou com vagas esgotadas para a data selecionada.
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold cursor-pointer hover:bg-white"
                >
                  Escolher outra data
                </button>
              </div>
            ) : (
              <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1 py-1">
                {/* Morning Slots */}
                {evaluatedSlots.some((s) => s.period === "morning") && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold flex items-center gap-1.5 text-zinc-300">
                      <Sun className="w-3.5 h-3.5 text-[#C6924B]" />
                      <span>Manhã (10:00 – 13:00)</span>
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {evaluatedSlots
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
                              className={`py-2 px-1.5 rounded-lg text-xs font-mono font-medium border transition-all flex flex-col items-center justify-center min-h-[42px] ${
                                isOccupied
                                  ? isDark
                                    ? "bg-zinc-950/60 border-zinc-900 text-zinc-600 cursor-not-allowed opacity-50"
                                    : "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-50"
                                  : isSelected
                                    ? "bg-zinc-100 text-zinc-950 font-bold border-zinc-100 shadow-sm cursor-pointer"
                                    : isDark
                                      ? "bg-zinc-900/60 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 cursor-pointer"
                                      : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer"
                              }`}
                            >
                              <span className={isOccupied ? "line-through text-zinc-600" : ""}>
                                {slot.time}
                              </span>
                              {isOccupied && (
                                <span className="text-[7.5px] font-sans font-medium text-red-400 leading-tight">
                                  {slot.reasonLabel || "Ocupado"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Afternoon & Night Slots */}
                {evaluatedSlots.some((s) => s.period === "afternoon" || s.period === "evening") && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold flex items-center gap-1.5 text-zinc-300">
                      <Moon className="w-3.5 h-3.5 text-[#C6924B]" />
                      <span>
                        {selectedDate && new Date(`${selectedDate}T12:00:00`).getDay() === 6
                          ? "Tarde (14:00 – 18:00)"
                          : "Tarde & Noite (14:00 – 22:00)"}
                      </span>
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {evaluatedSlots
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
                              className={`py-2 px-1.5 rounded-lg text-xs font-mono font-medium border transition-all flex flex-col items-center justify-center min-h-[42px] ${
                                isOccupied
                                  ? isDark
                                    ? "bg-zinc-950/60 border-zinc-900 text-zinc-600 cursor-not-allowed opacity-50"
                                    : "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed opacity-50"
                                  : isSelected
                                    ? "bg-zinc-100 text-zinc-950 font-bold border-zinc-100 shadow-sm cursor-pointer"
                                    : isDark
                                      ? "bg-zinc-900/60 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 cursor-pointer"
                                      : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer"
                              }`}
                            >
                              <span className={isOccupied ? "line-through text-zinc-600" : ""}>
                                {slot.time}
                              </span>
                              {isOccupied && (
                                <span className="text-[7.5px] font-sans font-medium text-red-400 leading-tight">
                                  {slot.reasonLabel || "Ocupado"}
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

            {/* Selected slot feedback pill */}
            {selectedTime && (
              <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs shrink-0 my-2 ${
                isDark ? "bg-zinc-900/80 border-zinc-800 text-zinc-200" : "bg-zinc-100 border-zinc-200 text-zinc-800"
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#C6924B]" />
                  <span>
                    Horário escolhido: <strong className="font-mono text-zinc-100">{formattedTimeRange || selectedTime}</strong>
                  </span>
                </div>
                <span className="text-[11px] font-medium text-emerald-400">Selecionado</span>
              </div>
            )}

            {/* Step 3 Footer */}
            <div className={`pt-4 mt-2 border-t flex items-center justify-between gap-3 shrink-0 ${
              isDark ? "border-zinc-800" : "border-zinc-200"
            }`}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setStep(4)}
                className={`px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold tracking-tight flex items-center gap-2 transition-all cursor-pointer ${
                  selectedTime
                    ? "bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
                }`}
              >
                <span>Avançar para dados</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASSO 4: OS SEUS DADOS (SHADCN FORM BLOCK)                                 */}
        {/* ========================================================================= */}
        {step === 4 && (
          <form onSubmit={handleBookingSubmit} className="relative z-10 flex-1 min-h-0 flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-fadeIn">
            <div className="pb-3 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100">
                Os seus dados
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Preencha os dados de contacto para confirmarmos o seu horário na barbearia.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs shrink-0 mb-3 ${
              isDark ? "bg-zinc-900/60 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"
            }`}>
              <div className="space-y-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-[#C6924B] shrink-0" />
                  <span className="font-semibold text-zinc-100 text-xs sm:text-sm truncate">
                    {servicesSummaryText || currentService.name}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 capitalize">
                  {formattedDatePortuguese} às <strong className="text-zinc-200 font-mono">{formattedTimeRange || selectedTime}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-sm sm:text-base text-zinc-100 block">
                  {totalPriceFormatted}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {totalQuantity} {totalQuantity === 1 ? "serviço" : "serviços"}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3.5 flex-1 min-h-0 overflow-y-auto pr-1 py-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Nome completo *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                      isDark
                        ? "bg-zinc-900/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                        : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                    }`}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Telemóvel / WhatsApp *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 912 345 678"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                      isDark
                        ? "bg-zinc-900/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                        : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                    }`}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Observações (opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder={
                    totalQuantity > 1
                      ? "Ex: 1 corte para o pai (André) e 1 para o filho (Martim)"
                      : "Ex: Corte à tesoura e barba alinhada"
                  }
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                    isDark
                      ? "bg-zinc-900/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
                      : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                  }`}
                />
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
                Os seus dados serão utilizados exclusivamente para a gestão e confirmação deste agendamento na Rota do Corte.
              </p>
            </div>

            {/* Step 4 Footer */}
            <div className={`pt-4 mt-2 border-t flex items-center justify-between gap-3 shrink-0 ${
              isDark ? "border-zinc-800" : "border-zinc-200"
            }`}>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-semibold tracking-tight flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>A confirmar...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Confirmar agendamento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* PASSO 5: CONFIRMAÇÃO IMEDIATA (SHADCN SUCCESS RECEIPT BLOCK)              */}
        {/* ========================================================================= */}
        {step === 5 && (
          <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-between items-center text-center p-5 sm:p-7 overflow-y-auto animate-fadeIn max-w-lg mx-auto w-full">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shrink-0 mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1 shrink-0 mb-4">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
                Marcação Confirmada
              </h2>
              <p className="text-xs text-zinc-400">
                O seu horário foi registado na agenda da Rota do Corte.
              </p>
            </div>

            {/* Receipt Card */}
            <div className={`w-full p-4 rounded-xl border text-left space-y-2 text-xs shrink-0 mb-4 ${
              isDark ? "bg-zinc-900/60 border-zinc-800 text-zinc-200" : "bg-zinc-50 border-zinc-200 text-zinc-800"
            }`}>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Serviço:</span>
                <span className="font-semibold text-right text-zinc-100">
                  {servicesSummaryText || currentService.name}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Barbeiro:</span>
                <span className="font-semibold text-zinc-100">Gabriel Silva</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Data & Hora:</span>
                <span className="font-semibold capitalize text-zinc-100">
                  {formattedDatePortuguese} às {formattedTimeRange || selectedTime}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
                <span className="text-zinc-400">Valor Total:</span>
                <span className="font-mono font-bold text-zinc-100">
                  {totalPriceFormatted}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Localização:</span>
                <span className="font-medium text-zinc-300 text-right">
                  {shopInfo.addressShort}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-2.5 shrink-0">
              {/* WhatsApp 1-Click Confirmation */}
              <a
                href={`https://wa.me/351935190491?text=${buildWhatsAppMessage({
                  serviceName: servicesSummaryText || currentService.name,
                  servicePrice: totalPriceFormatted,
                  dateFormatted: formattedDatePortuguese,
                  time: formattedTimeRange || selectedTime,
                  clientName,
                  phone: clientPhone,
                  notes: clientNotes
                })}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>Enviar confirmação no WhatsApp</span>
              </a>

              {/* Calendar Export Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={buildGoogleCalendarUrl({
                    serviceName: currentService.name,
                    date: selectedDate,
                    time: selectedTime,
                    durationMinutes: (totalQuantity || 1) * 30
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    isDark
                      ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800"
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Google Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={() =>
                    downloadIcsFile({
                      serviceName: currentService.name,
                      date: selectedDate,
                      time: selectedTime,
                      durationMinutes: (totalQuantity || 1) * 30,
                      clientName
                    })
                  }
                  className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isDark
                      ? "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800"
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Apple / .ics</span>
                </button>
              </div>
            </div>

            <div className="pt-4 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
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
