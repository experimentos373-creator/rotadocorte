import React from "react";
import { Calendar, Phone, MapPin } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { shopInfo } from "../data/services";

export default function FloatingCTA({ onOpenBooking }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <aside
      aria-label="Ações Rápidas Mobile"
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl transition-colors duration-300 ${
        isDark
          ? "bg-[#0A0C10]/95 border-white/10"
          : "bg-[#FAF8F5]/95 border-[#DED7C8]"
      }`}
    >
      <div className="flex items-center gap-2 max-w-lg mx-auto">
        <a
          href={`tel:${shopInfo.phoneClean}`}
          className={`flex-1 py-2.5 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
            isDark
              ? "border-white/20 text-white bg-white/5 active:bg-white/10"
              : "border-[#DED7C8] text-[#1C1A17] bg-white active:bg-[#ECE7DC]"
          }`}
          aria-label="Ligar para barbearia"
        >
          <Phone className="w-3.5 h-3.5 text-[#C89B58]" />
          <span>Ligar</span>
        </a>

        <button
          type="button"
          onClick={() => onOpenBooking()}
          className={`flex-2 py-2.5 px-4 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all ${
            isDark
              ? "btn-pill-gold"
              : "bg-[#1C1A17] text-[#FAF8F5] active:bg-[#2F2B26]"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{t.nav.bookNow}</span>
        </button>

        <a
          href={shopInfo.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2.5 rounded-full border flex items-center justify-center transition-colors active:scale-95 ${
            isDark
              ? "bg-white/5 border-white/10 text-[#C89B58] active:bg-white/10"
              : "bg-white border-[#DED7C8] text-[#9A7743] active:bg-[#ECE7DC]"
          }`}
          title="Ver no Mapa"
          aria-label="Ver no Mapa"
        >
          <MapPin className="w-4 h-4" />
        </a>
      </div>
    </aside>
  );
}
