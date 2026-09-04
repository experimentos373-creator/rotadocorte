import React from "react";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { shopInfo } from "../data/services";

export default function Hero({ onOpenBooking }) {
  const { t } = useLanguage();

  const scrollTo = (e, id) => {
    if (e) e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="inicio"
      className="relative min-h-[88vh] sm:min-h-screen flex flex-col justify-center bg-[#0A0B0E] bg-cover bg-no-repeat overflow-hidden border-b border-white/10 bg-[position:85%_top] sm:bg-[position:right_center]"
      style={{
        backgroundImage: `url('/images/hero_gabriel_beauty.png')`
      }}
    >
      {/* Mobile Scrim: Balanced dark gradient to make text & CTAs immediately visible while preserving background image */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-[#0A0B0E]/80 via-40% to-[#0A0B0E]/40 sm:hidden pointer-events-none"></div>

      {/* Desktop Left-to-Right Scrim: Smooth 100% contrast blend matching #0A0B0E */}
      <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#0A0B0E] via-[#0A0B0E]/85 via-50% to-transparent w-7/12 pointer-events-none"></div>

      {/* Soft Golden Ambient Depth Light */}
      <div className="absolute top-1/3 right-0 w-full max-w-[450px] aspect-square bg-[#C89B58]/12 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-5 sm:px-10 xl:px-12 w-full relative z-10 py-8 sm:py-24">
        
        {/* Hero Editorial Block */}
        <div className="max-w-xl lg:max-w-2xl space-y-4 sm:space-y-8 text-left">
          
          {/* Main Headline */}
          <div className="space-y-1 sm:space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="font-serif text-3xl xs:text-4xl sm:text-7xl md:text-8xl lg:text-[5.5rem] font-normal leading-[1.05] text-[#FAF8F5] tracking-tight">
              ROTA DO CORTE
            </h1>
          </div>

          {/* Subtitles */}
          <div className="space-y-1 text-sm sm:text-xl md:text-2xl text-[#FAF8F5] font-normal leading-snug animate-in fade-in slide-in-from-bottom-5 duration-800">
            <p className="font-bold text-[#FAF8F5]">A Arte do Corte & Barbaterapia com Ozónio.</p>
            <p className="text-[#C5BDB0] text-xs sm:text-base">Atelier de barbearia no Paião conduzido por <strong>Gabriel</strong>.</p>
            <p className="text-[#C89B58] font-serif italic text-xs sm:text-2xl pt-0.5">Cortes milimétricos, razor art & experiência revigorante.</p>
          </div>

          {/* Action CTAs: IMMEDIATELY VISIBLE ON MOBILE */}
          <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className="w-full sm:w-auto bg-[#C89B58] hover:bg-[#E5C268] text-black uppercase tracking-[0.14em] text-xs font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all duration-300 shadow-xl active:scale-98 cursor-pointer flex items-center justify-center gap-2 min-h-[46px] sm:min-h-[50px] group text-center"
            >
              <span>AGENDAR HORÁRIO</span>
              <ArrowUpRight className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <a
              href="#servicos"
              onClick={(e) => scrollTo(e, "servicos")}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/15 uppercase tracking-[0.14em] text-xs font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all duration-300 text-center min-h-[46px] sm:min-h-[50px] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>VER SERVIÇOS & PREÇOS</span>
              <ArrowDown className="w-4 h-4 text-[#C89B58]" />
            </a>
          </div>

          {/* Highlights Strip */}
          <div className="pt-4 sm:pt-6 border-t border-white/10 grid grid-cols-3 gap-2 sm:gap-4 text-left">
            <div className="bg-black/50 border border-white/10 p-2.5 sm:p-4 rounded-xl backdrop-blur-md hover:border-[#C89B58]/40 transition-all">
              <p className="text-xs sm:text-xl font-bold font-serif text-[#FAF8F5] tracking-tight">
                10:00 – 22:00
              </p>
              <p className="text-[10px] sm:text-sm text-[#C89B58] font-medium pt-0.5 leading-tight">
                Seg. a Sáb.
              </p>
            </div>
            <div className="bg-black/50 border border-white/10 p-2.5 sm:p-4 rounded-xl backdrop-blur-md hover:border-[#C89B58]/40 transition-all">
              <p className="text-xs sm:text-xl font-bold font-serif text-[#FAF8F5] tracking-tight">
                13:00 – 14:00
              </p>
              <p className="text-[10px] sm:text-sm text-[#9E9EA7] font-medium pt-0.5 leading-tight">
                Pausa Almoço
              </p>
            </div>
            <div className="bg-black/50 border border-white/10 p-2.5 sm:p-4 rounded-xl backdrop-blur-md hover:border-[#C89B58]/40 transition-all">
              <p className="text-xs sm:text-xl font-bold font-serif text-[#FAF8F5] tracking-tight">
                Vapor Ozónio
              </p>
              <p className="text-[10px] sm:text-sm text-[#E5C268] font-medium pt-0.5 leading-tight">
                Barbaterapia
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
