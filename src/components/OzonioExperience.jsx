import { Sparkles, CheckCircle2, Shield, Droplets, Flame, Wind, Calendar } from "lucide-react";
import { ozoneBenefits } from "../data/gallery";
import { useLanguage } from "../context/LanguageContext";

export default function OzonioExperience({ onOpenBooking }) {
  const { t } = useLanguage();

  return (
    <section id="ozonio" className="py-20 lg:py-28 bg-[#0d0f13] relative overflow-hidden border-t border-white/5">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#c89b58]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Storytelling & Visual */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#181a20] border border-[#c89b58]/40 text-xs font-semibold text-[#e5c268]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.ozone.badge}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f7f5f0] tracking-tight font-display leading-[1.15]">
              {t.ozone.title}
            </h2>

            <p className="text-sm sm:text-base text-[#9e9ea7] leading-relaxed">
              {t.ozone.subtitle} Na <strong className="text-[#f7f5f0]">Rota Do Corte</strong>, aliamos a tradição da navalha clássica ao poder rejuvenescedor da tecnologia de vapor de ozono, proporcionando uma experiência de barbearia inigualável no concelho da Figueira da Foz.
            </p>

            {/* Visual Card Image */}
            <div className="relative rounded-2xl overflow-hidden border border-[#c89b58]/30 shadow-2xl group">
              <img
                src="/images/ozone-ritual.jpg"
                alt="Ritual de Barbaterapia com Vaporizador de Ozónio na Rota Do Corte"
                className="w-full h-72 sm:h-80 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
              
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#e5c268] uppercase tracking-wider">Tratamento Exclusivo</p>
                  <p className="text-xs text-[#f7f5f0]">Vaporizador de Ozónio + Toalha Quente</p>
                </div>
                <span className="text-xs font-bold text-black bg-[#c89b58] px-3 py-1 rounded-lg">
                  Desde 5,00 €
                </span>
              </div>
            </div>

            {/* Mini CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onOpenBooking({ id: "corte-barba-terapia", name: "Corte e Barba Terapia", priceFormatted: "15,00 €" })}
                className="btn-gold px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2.5 cursor-pointer shadow-xl"
              >
                <Calendar className="w-4 h-4" />
                <span>Experimentar Barbaterapia com Ozónio</span>
              </button>
            </div>
          </div>

          {/* Right Column: 5 Step Ritual Timeline */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <h3 className="text-xl sm:text-2xl font-bold text-[#f7f5f0] font-display flex items-center gap-2">
                <span>O Ritual em 5 Etapas</span>
                <span className="w-12 h-0.5 bg-[#c89b58]"></span>
              </h3>

              <div className="space-y-4">
                {ozoneBenefits.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-[#14161b] border border-white/5 hover:border-[#c89b58]/40 transition-all group flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#c89b58]/10 border border-[#c89b58]/30 flex items-center justify-center font-brand font-bold text-sm text-[#e5c268] shrink-0 group-hover:bg-[#c89b58] group-hover:text-black transition-colors">
                      {item.step}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm sm:text-base font-bold text-[#f7f5f0] font-display group-hover:text-[#e5c268] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#9e9ea7] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dermatological Health Highlights */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-white/5">
                  <Droplets className="w-4 h-4 text-[#c89b58] mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-[#f7f5f0]">Hidratação 3x Superior</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <Shield className="w-4 h-4 text-[#c89b58] mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-[#f7f5f0]">Anti-Foliculite</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 col-span-2 sm:col-span-1">
                  <Wind className="w-4 h-4 text-[#c89b58] mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-[#f7f5f0]">Relaxamento Total</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
