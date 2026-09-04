import React from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { clientReviews } from "../data/gallery";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export default function Testimonials() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section id="avaliacoes" className={`py-24 sm:py-32 border-b transition-colors duration-300 ${
      isDark ? "bg-[#090A0E] border-white/5" : "bg-white border-[#DED7C8]"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className={`font-serif text-3xl sm:text-5xl font-bold tracking-tight ${
            isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
          }`}>
            O Que Dizem os Nossos Clientes
          </h2>

          <p className={`text-base sm:text-lg ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
            Críticas reais verificadas de clientes que confiam na Rota Do Corte no Paião.
          </p>
        </div>

        {/* 4 Review Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {clientReviews.map((review) => (
            <div
              key={review.id}
              className={`rounded-3xl p-6 flex flex-col justify-between space-y-4 border transition-all duration-300 ${
                isDark
                  ? "bg-[#111318] border-white/10 hover:border-[#C89B58]/40 shadow-lg"
                  : "bg-[#FAF8F5] border-[#DED7C8]/80 hover:border-[#9A7743] shadow-xs"
              }`}
            >
              <div className="space-y-3 text-left">
                {/* 5 Stars + Google Badge */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1 ${isDark ? "text-[#E5C268]" : "text-[#9A7743]"}`}>
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    isDark ? "text-[#9E9EA7] bg-white/5" : "text-[#5C554B] bg-[#ECE7DC]"
                  }`}>
                    <svg viewBox="0 0 24 24" className="w-3 h-3 text-[#4285F4]" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Google
                  </span>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed italic ${
                  isDark ? "text-[#E5E0D8]" : "text-[#3D372F]"
                }`}>
                  "{review.comment}"
                </p>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between text-left ${
                isDark ? "border-white/5" : "border-[#DED7C8]/60"
              }`}>
                <div>
                  <h3 className={`font-serif text-sm font-bold flex items-center gap-1.5 ${
                    isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
                  }`}>
                    <span>{review.author}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </h3>
                  <p className={`text-[10px] ${isDark ? "text-[#C89B58]" : "text-[#8C8275]"}`}>
                    {review.role}
                  </p>
                </div>
                <span className={`text-[10px] ${isDark ? "text-[#71717A]" : "text-[#8C8275]"}`}>
                  {review.date}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
