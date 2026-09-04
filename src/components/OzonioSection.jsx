import React, { useRef, useState } from "react";
import { Droplets, Shield, Wind, ArrowUpRight, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export default function OzonioSection({ onOpenBooking }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const benefits = [
    {
      icon: Wind,
      title: t.ozone?.benefit1Title || "Abertura dos Poros & Suavidade",
      desc: t.ozone?.benefit1Desc || "O vapor aquecido amolece os pelos mais resistentes, permitindo um deslize suave da navalha sem puxões ou irritações."
    },
    {
      icon: Shield,
      title: t.ozone?.benefit2Title || "Ação Antibacteriana & Anti-Foliculite",
      desc: t.ozone?.benefit2Desc || "As propriedades do ozónio purificam a epiderme, eliminam bactérias e previnem borbulhas ou pelos encravados."
    },
    {
      icon: Droplets,
      title: t.ozone?.benefit3Title || "Toalha Quente Aromática & Hidratação",
      desc: t.ozone?.benefit3Desc || "Infusão de toalha de algodão aquecida com óleos essenciais para uma sensação de spa e relaxamento profundo."
    }
  ];

  return (
    <section id="ozonio" className={`py-24 sm:py-32 border-b relative overflow-hidden transition-colors duration-300 ${
      isDark ? "bg-[#090A0E] border-white/5" : "bg-white border-[#DED7C8]"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Real Ozone Steamer Video Player */}
          <div className="lg:col-span-5">
            <div className={`p-3.5 rounded-3xl relative shadow-2xl border ${
              isDark ? "bg-[#13151B] border-[#C89B58]/40" : "bg-[#FAF8F5] border-[#DED7C8]"
            }`}>
              <div className="rounded-2xl overflow-hidden aspect-4/5 relative group bg-black">
                
                {/* Real Barbaterapia Video */}
                <video
                  ref={videoRef}
                  src="/videos/barbaterapia.mp4"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700 cursor-pointer"
                  onClick={togglePlay}
                />

                {/* Top Video Overlay Controls (Play/Pause & Mute/Unmute) */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-2.5 rounded-full bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                    title={isMuted ? "Ativar Som" : "Desativar Som"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-[#C89B58]" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-2.5 rounded-full bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                    title={isPlaying ? "Pausar Vídeo" : "Reproduzir Vídeo"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-[#E5C268]" />}
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Right: Benefits & Explanation */}
          <div className="lg:col-span-7 space-y-7 text-left">
            <h2 className={`font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight ${
              isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
            }`}>
              {t.ozone?.titlePrefix || "Barbaterapia com"} <span className={isDark ? "text-gold-gradient" : "text-[#9A7743]"}>{t.ozone?.titleHighlight || "Vaporizador de Ozónio"}</span>
            </h2>

            <p className={`text-base sm:text-lg leading-relaxed ${
              isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"
            }`}>
              {t.ozone?.description}
            </p>

            <div className="space-y-3.5 pt-2">
              {benefits.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex items-start gap-4 transition-colors ${
                      isDark
                        ? "bg-[#13151B] border-white/5 hover:border-[#C89B58]/30"
                        : "bg-[#F6F4EE] border-[#DED7C8]/70 hover:border-[#C89B58]/60"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                      isDark
                        ? "bg-[#C89B58]/10 border-[#C89B58]/30 text-[#E5C268]"
                        : "bg-white border-[#DED7C8] text-[#9A7743] shadow-xs"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-base font-bold ${isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"}`}>
                        {item.title}
                      </h3>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                type="button"
                onClick={() => onOpenBooking({ id: "corte-barba-terapia", name: "Corte e Barba Terapia", priceFormatted: "15,00 €" })}
                className={`text-xs uppercase tracking-[0.16em] px-7 py-4 rounded-full flex items-center gap-2 cursor-pointer shadow-xl font-bold transition-all ${
                  isDark ? "btn-pill-gold" : "bg-[#1C1A17] text-[#FAF8F5] hover:bg-[#2F2B26]"
                }`}
              >
                <span>{t.ozone?.cta || "Agendar Barbaterapia (€ 15)"}</span>
                <ArrowUpRight className={`w-3.5 h-3.5 ${isDark ? "text-black" : "text-[#D6B78B]"}`} />
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

