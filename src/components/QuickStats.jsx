import { Clock, Sparkles, Scissors, MapPin } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function QuickStats() {
  const { t } = useLanguage();

  const stats = [
    {
      icon: Clock,
      title: t.stats.hoursTitle,
      desc: t.stats.hoursDesc,
      highlight: "Destaque Noturno"
    },
    {
      icon: Sparkles,
      title: t.stats.ozoneTitle,
      desc: t.stats.ozoneDesc,
      highlight: "Exclusivo Barbaterapia"
    },
    {
      icon: Scissors,
      title: t.stats.precisionTitle,
      desc: t.stats.precisionDesc,
      highlight: "Degradê & Tesoura"
    },
    {
      icon: MapPin,
      title: t.stats.locationTitle,
      desc: t.stats.locationDesc,
      highlight: "Fácil Acesso"
    }
  ];

  return (
    <section className="py-12 bg-[#0b0d10] border-y border-white/5 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-[#c89b58]/40 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#c89b58]/10 border border-[#c89b58]/30 flex items-center justify-center text-[#e5c268] group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#c89b58] bg-[#c89b58]/10 px-2.5 py-1 rounded-md">
                    {item.highlight}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#f7f5f0] mb-1 font-display">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#9e9ea7] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
