import React, { useState, useEffect, useRef } from "react";
import { Clock, Check, ArrowUpRight } from "lucide-react";
import { servicesData } from "../data/services";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const comboPlaylist = [
  { src: "/videos/barbaterapia.mp4", duration: 3000 },      // Barbaterapia 1.º lugar com 3s
  { src: "/videos/corte_normal.mp4", duration: 2500 },     // Corte Normal 2.5s
  { src: "/videos/corte_barba.mp4", duration: 2500 },      // Corte & Barba 2.5s
  { src: "/videos/razor_art_design.mp4", duration: 2500 }  // Razor Art Design 2.5s
];

function ComboPremiumVideoPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const currentItem = comboPlaylist[currentIndex];
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % comboPlaylist.length);
    }, currentItem.duration);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.25; // 1.25x speed
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  return (
    <video
      ref={videoRef}
      key={comboPlaylist[currentIndex].src}
      src={comboPlaylist[currentIndex].src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
      onLoadedMetadata={(e) => {
        e.target.playbackRate = 1.25;
        e.target.play().catch(() => {});
      }}
    />
  );
}

function SingleServiceVideoPlayer({ videoUrl }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.0;
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
      onCanPlay={(e) => {
        e.target.play().catch(() => {});
      }}
      onLoadedMetadata={(e) => {
        e.target.play().catch(() => {});
      }}
    />
  );
}

export default function ServicesPricing({ onSelectService }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section id="servicos" className={`py-24 sm:py-32 border-b transition-colors duration-300 ${
      isDark ? "bg-[#07080A] border-white/5" : "bg-[#F6F4EE] border-[#DED7C8]"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        
        {/* Section Header without Cluttered Eyebrow Badges */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className={`font-serif text-3xl sm:text-5xl font-bold tracking-tight ${
            isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
          }`}>
            {t.services.title}
          </h2>

          <p className={`text-base sm:text-lg ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
            {t.services.subtitle}
          </p>
        </div>

        {/* 5 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {servicesData.map((service) => (
            <div
              key={service.id}
              className={`rounded-3xl p-6 flex flex-col justify-between group border transition-all duration-300 ${
                isDark
                  ? `bg-[#111318] border-white/10 hover:border-[#C89B58]/40 hover:-translate-y-1 shadow-lg ${
                      service.featured ? "border-[#C89B58]/50 bg-gradient-to-b from-[#161820] to-[#101217]" : ""
                    }`
                  : `bg-white border-[#DED7C8] hover:border-[#9A7743] hover:-translate-y-1 shadow-sm ${
                      service.featured ? "border-[#C29F6E] ring-1 ring-[#C29F6E]/40" : ""
                    }`
              }`}
            >
              <div className="space-y-4">
                
                {/* Photo or Video & Duration Badge */}
                <div className={`relative rounded-2xl overflow-hidden aspect-16/10 ${isDark ? "bg-[#14161C]" : "bg-[#ECE7DC]"}`}>
                  {service.id === "combo-premium" ? (
                    <ComboPremiumVideoPlayer />
                  ) : service.video ? (
                    <SingleServiceVideoPlayer videoUrl={service.video} />
                  ) : (
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none"></div>

                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md backdrop-blur-xs ${
                      isDark
                        ? "bg-black/80 text-[#E5C268] border border-[#C89B58]/30"
                        : "bg-[#1C1A17]/85 text-[#FAF8F5]"
                    }`}>
                      {service.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 z-10">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1.5 ${
                      isDark
                        ? "bg-black/80 text-[#FAF8F5] border border-white/10"
                        : "bg-white/90 text-[#1C1A17] shadow-sm"
                    }`}>
                      <Clock className="w-3 h-3 text-[#C89B58]" />
                      {service.duration}
                    </span>
                  </div>
                </div>

                {/* Title & Price */}
                <div className="flex items-start justify-between gap-2 pt-2">
                  <h3 className={`font-serif text-xl sm:text-2xl font-bold leading-tight ${
                    isDark ? "text-[#FAF8F5] group-hover:text-[#E5C268]" : "text-[#1C1A17]"
                  } transition-colors`}>
                    {service.name}
                  </h3>
                  <span className={`font-serif text-2xl font-bold shrink-0 ${
                    isDark ? "text-gold-gradient" : "text-[#9A7743]"
                  }`}>
                    {service.priceFormatted}
                  </span>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
                  {service.shortDesc}
                </p>

                {/* Details Checklist */}
                <div className={`space-y-2 pt-3 border-t ${isDark ? "border-white/5" : "border-[#DED7C8]/60"}`}>
                  {service.details.map((detail, idx) => (
                    <div key={idx} className={`flex items-start gap-2 text-xs ${isDark ? "text-[#C5BDB0]" : "text-[#3D372F]"}`}>
                      <Check className="w-3.5 h-3.5 text-[#C89B58] shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-2">
                <button
                  type="button"
                  onClick={() => onSelectService(service)}
                  className={`w-full py-3.5 text-xs uppercase tracking-wider font-bold rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isDark
                      ? service.featured ? "btn-pill-gold" : "btn-pill-outline-dark"
                      : service.featured ? "bg-[#1C1A17] text-white hover:bg-[#2F2B26]" : "bg-white border border-[#DED7C8] text-[#1C1A17] hover:bg-[#F6F4EE]"
                  }`}
                >
                  <span>Agendar {service.priceFormatted}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
