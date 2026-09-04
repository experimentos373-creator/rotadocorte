import React from "react";
import { Instagram, ArrowUpRight } from "lucide-react";
import { galleryItems } from "../data/gallery";
import { shopInfo } from "../data/services";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export default function GalleryCuts() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section id="galeria" className={`py-24 sm:py-32 border-b transition-colors duration-300 ${
      isDark ? "bg-[#07080A] border-white/5" : "bg-[#F6F4EE] border-[#DED7C8]"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        
        {/* Section Header without Cluttered Eyebrow Badges */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className={`font-serif text-3xl sm:text-5xl font-bold tracking-tight ${
            isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
          }`}>
            {t.gallery.title}
          </h2>

          <p className={`text-base sm:text-lg ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
            {t.gallery.subtitle}
          </p>
        </div>

        {/* Real Cuts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl overflow-hidden group relative border transition-all duration-300 ${
                isDark
                  ? "bg-[#111318] border-white/10 hover:border-[#C89B58]/40 shadow-lg"
                  : "bg-white border-[#DED7C8] hover:border-[#9A7743] shadow-sm"
              }`}
            >
              <div className={`aspect-square w-full overflow-hidden relative ${
                isDark ? "bg-[#181A20]" : "bg-[#ECE7DC]"
              }`}>
                {item.video ? (
                  <video
                    src={item.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <img
                    src={item.image}
                    alt={item.title}
                    className={`w-full h-full object-cover ${item.objectPosition || "object-center"} group-hover:scale-105 transition-transform duration-500`}
                  />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none"></div>

                <div className="absolute top-3 left-3 z-10">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md backdrop-blur-xs ${
                    isDark
                      ? "bg-black/80 text-[#E5C268] border border-[#C89B58]/30"
                      : "bg-[#1C1A17]/85 text-[#FAF8F5]"
                  }`}>
                    {item.categoryLabel}
                  </span>
                </div>
              </div>

              <div className="p-4 text-left">
                <h3 className={`font-serif text-base font-bold leading-tight ${
                  isDark ? "text-[#FAF8F5] group-hover:text-[#E5C268]" : "text-[#1C1A17]"
                } transition-colors`}>
                  {item.title}
                </h3>
                <p className={`text-xs mt-1 line-clamp-1 ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Instagram CTA */}
        <div className="mt-14 text-center">
          <a
            href={shopInfo.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] px-7 py-4 rounded-full font-semibold transition-all border ${
              isDark
                ? "btn-pill-outline-dark"
                : "bg-white border-[#DED7C8] text-[#1C1A17] hover:bg-[#ECE7DC]"
            }`}
          >
            <Instagram className={`w-4 h-4 ${isDark ? "text-[#C89B58]" : "text-[#9A7743]"}`} />
            <span>Ver todos os trabalhos no Instagram {shopInfo.instagramHandle}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>
  );
}
