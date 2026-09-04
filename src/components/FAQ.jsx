import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqs } from "../data/gallery";
import { useTheme } from "../context/ThemeContext";

export default function FAQ() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section className={`py-24 sm:py-32 border-b transition-colors duration-300 ${
      isDark ? "bg-[#07080A] border-white/5" : "bg-white border-[#DED7C8]"
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12">
        
        {/* Header without Badges */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className={`font-serif text-3xl sm:text-4xl font-bold tracking-tight ${
            isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
          }`}>
            Perguntas & Respostas
          </h2>

          <p className={`text-base ${isDark ? "text-[#9E9EA7]" : "text-[#5C554B]"}`}>
            Tudo o que precisa de saber sobre os nossos serviços e horário no Paião.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3.5">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`rounded-2xl overflow-hidden border transition-all ${
                isDark
                  ? "bg-[#111318] border-white/10 hover:border-[#C89B58]/30"
                  : "bg-white border-[#DED7C8] hover:border-[#9A7743] shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className={`w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                  isDark ? "hover:bg-white/5" : "hover:bg-[#FAF8F5]"
                }`}
              >
                <span className={`font-serif text-base sm:text-lg font-bold ${
                  isDark ? "text-[#FAF8F5]" : "text-[#1C1A17]"
                }`}>
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    isDark ? "text-[#C89B58]" : "text-[#9A7743]"
                  } ${openIndex === index ? "rotate-180" : ""}`}
                />
              </button>

              {openIndex === index && (
                <div className={`px-5 pb-5 text-xs sm:text-sm leading-relaxed border-t pt-3.5 text-left ${
                  isDark ? "text-[#9E9EA7] border-white/5" : "text-[#5C554B] border-[#DED7C8]/40"
                }`}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
