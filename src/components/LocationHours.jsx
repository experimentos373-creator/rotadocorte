import { useState } from "react";
import { MapPin, Phone, Navigation, Copy, Check, ArrowUpRight } from "lucide-react";
import { shopInfo } from "../data/services";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export default function LocationHours() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(shopInfo.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="localizacao" className={`py-20 sm:py-28 border-b transition-colors duration-300 ${
      isDark ? "bg-[#090A0E] border-white/5" : "bg-[#F6F4EE] border-[#DED7C8]"
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${
            isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
          }`}>
            Localização & Contacto
          </h2>

          <p className={`text-sm sm:text-base ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
            Visite-nos no centro do Paião, Figueira da Foz.
          </p>
        </div>

        {/* 2-Column Clean Layout: Exact Info Requested */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Info Card: ONLY Morada + GPS + Telefone */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className={`p-6 sm:p-8 rounded-3xl space-y-6 shadow-lg text-left border transition-all ${
              isDark
                ? "bg-[#111318] border-[#C89B58]/30 text-[#FAF8F5]"
                : "bg-white border-[#DED7C8] text-[#1C1A17]"
            }`}>
              
              {/* Morada */}
              <div className="space-y-2">
                <span className={`text-xs font-bold uppercase tracking-wider block ${
                  isDark ? "text-[#C89B58]" : "text-[#8C8275]"
                }`}>
                  Morada:
                </span>
                <p className="text-lg sm:text-xl font-bold leading-snug">
                  {shopInfo.address}
                </p>
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                      isDark
                        ? "border-white/10 text-[#C5BDB0] hover:text-white hover:bg-white/5"
                        : "border-[#DED7C8] text-[#5C554B] hover:text-[#1C1A17] hover:bg-[#F6F4EE]"
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#C89B58]" />}
                    <span>{copied ? "Morada Copiada" : "Copiar Morada"}</span>
                  </button>

                  <a
                    href={shopInfo.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isDark
                        ? "btn-pill-gold"
                        : "bg-[#1C1A17] text-white hover:bg-[#2F2B26]"
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Ver no GPS</span>
                  </a>
                </div>
              </div>

              {/* Telefone */}
              <div className={`pt-6 border-t space-y-1.5 ${isDark ? "border-white/5" : "border-[#DED7C8]/60"}`}>
                <span className={`text-xs font-bold uppercase tracking-wider block ${
                  isDark ? "text-[#C89B58]" : "text-[#8C8275]"
                }`}>
                  Telefone:
                </span>
                <a
                  href={`tel:${shopInfo.phoneClean}`}
                  className={`text-2xl sm:text-3xl font-bold transition-colors block ${
                    isDark ? "text-[#FAF8F5] hover:text-[#E5C268]" : "text-[#1C1A17] hover:text-[#9A7743]"
                  }`}
                >
                  {shopInfo.phone}
                </a>
              </div>

              {/* Horário de Funcionamento */}
              <div className={`pt-6 border-t space-y-2.5 ${isDark ? "border-white/5" : "border-[#DED7C8]/60"}`}>
                <span className={`text-xs font-bold uppercase tracking-wider block ${
                  isDark ? "text-[#C89B58]" : "text-[#8C8275]"
                }`}>
                  Horário de Funcionamento:
                </span>
                <div className="space-y-1.5 text-sm font-medium">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Segunda a Sábado</span>
                    <span className="font-bold text-[#C89B58]">10:00 – 22:00</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#9E9EA7]">
                    <span>Pausa p/ Almoço</span>
                    <span className="text-[#C89B58]">13:00 – 14:00</span>
                  </div>
                  <div className="flex justify-between items-center text-xs opacity-60">
                    <span>Domingo</span>
                    <span>Encerrado</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Map Frame */}
          <div className="lg:col-span-7 flex">
            <div className={`p-3 rounded-3xl w-full flex flex-col justify-between shadow-lg border transition-all ${
              isDark
                ? "bg-[#111318] border-white/10"
                : "bg-white border-[#DED7C8]"
            }`}>
              <iframe
                title="Localização Rota Do Corte Paião Figueira da Foz"
                src="https://maps.google.com/maps?q=40.0704142,-8.8054765&hl=pt&z=16&output=embed"
                width="100%"
                height="100%"
                className={`w-full h-full min-h-[340px] rounded-2xl border-0 transition-opacity ${
                  isDark ? "filter invert contrast-125 opacity-80 hover:opacity-100" : "grayscale-10 contrast-105"
                }`}
                loading="lazy"
                allowFullScreen
              ></iframe>

              <div className="p-3 flex items-center justify-between">
                <span className={`text-xs ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
                  Paião, Rua da Direita nº 75
                </span>
                <a
                  href={shopInfo.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-1.5 font-bold transition-all ${
                    isDark ? "btn-pill-gold" : "bg-[#1C1A17] text-white hover:bg-[#2F2B26]"
                  }`}
                >
                  <span>Abrir Rota</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
