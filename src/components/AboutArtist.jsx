import React from "react";
import { Instagram, ArrowUpRight, Check, Clock } from "lucide-react";
import { shopInfo } from "../data/services";
import { useTheme } from "../context/ThemeContext";

export default function AboutArtist({ onOpenBooking }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section id="sobre" className={`py-20 sm:py-28 border-b transition-colors duration-300 ${
      isDark ? "bg-[#090A0E] border-white/5" : "bg-white border-[#DED7C8]"
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Single Clean Photo of Gabriel */}
          <div className="lg:col-span-5 flex justify-center">
            <div className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl aspect-4/5 border group relative ${
              isDark ? "bg-[#14161C] border-white/10" : "bg-[#ECE7DC] border-[#DED7C8]"
            }`}>
              <img
                src="/images/gabriel_portrait.jpg"
                alt="Gabriel Barbeiro Rota Do Corte"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <p className="text-white font-serif text-lg font-bold">Gabriel</p>
                <p className="text-[#C89B58] text-xs font-semibold">Fundador & Barbeiro • Paião</p>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h2 className={`font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight ${
              isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
            }`}>
              Gabriel & a Rota Do Corte
            </h2>

            <p className={`text-base sm:text-lg leading-relaxed ${
              isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"
            }`}>
              Com foco absoluto na precisão, na arte do visagismo e no atendimento personalizado, o <strong>Gabriel</strong> fundou a Rota Do Corte no centro do Paião. Cada atendimento combina técnica apurada de tesoura e máquina, desenhos à lâmina e o relaxamento revigorante do vapor de ozono.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className={`p-4 rounded-2xl border space-y-1.5 transition-colors ${
                isDark ? "bg-[#13151B] border-white/5" : "bg-[#F6F4EE] border-[#DED7C8]/70"
              }`}>
                <p className={`text-sm font-bold flex items-center gap-2 ${
                  isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
                }`}>
                  <Check className="w-4 h-4 text-[#C89B58]" />
                  Degradês & Razor Art
                </p>
                <p className={`text-xs ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
                  Fades cirúrgicos e desenhos exclusivos personalizados para o seu perfil.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1.5 transition-colors ${
                isDark ? "bg-[#13151B] border-white/5" : "bg-[#F6F4EE] border-[#DED7C8]/70"
              }`}>
                <p className={`text-sm font-bold flex items-center gap-2 ${
                  isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
                }`}>
                  <Check className="w-4 h-4 text-[#C89B58]" />
                  Barbaterapia com Ozónio
                </p>
                <p className={`text-xs ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
                  Vapor de ozono que abre os poros e elimina qualquer irritação ou foliculite.
                </p>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-4">
              <a
                href={shopInfo.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs uppercase tracking-[0.16em] px-7 py-3.5 rounded-full flex items-center gap-2 font-bold transition-all shadow-md ${
                  isDark ? "btn-pill-gold" : "bg-[#1C1A17] text-[#FAF8F5] hover:bg-[#2F2B26]"
                }`}
              >
                <Instagram className={`w-4 h-4 ${isDark ? "text-black" : "text-[#D6B78B]"}`} />
                <span>Instagram {shopInfo.instagramHandle}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              <div className={`flex items-center gap-2 text-xs px-4 py-3 rounded-full border ${
                isDark ? "bg-white/5 border-white/5 text-[#9E9EA7]" : "bg-[#FAF8F5] border-[#DED7C8] text-[#5C554B]"
              }`}>
                <Clock className="w-3.5 h-3.5 text-[#C89B58]" />
                <span>Seg. a Sáb.: 10:00 – 22:00 (Almoço: 13:00 – 14:00)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
