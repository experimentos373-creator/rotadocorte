import React from "react";
import { Instagram, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { shopInfo } from "../data/services";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export default function Footer({ onOpenBooking, onOpenPrivacy, onOpenTerms }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <footer className={`pt-16 pb-24 sm:pb-12 text-xs border-t transition-colors duration-300 ${
      isDark
        ? "bg-[#050608] text-[#FAF8F5] border-white/5"
        : "bg-[#1C1A17] text-[#FAF8F5] border-[#DED7C8]"
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="Rota Do Corte"
                className="w-10 h-10 object-contain drop-shadow-md"
              />
              <div>
                <span className="text-lg font-bold tracking-wider block">
                  ROTA DO CORTE
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#C89B58]">
                  Paião • Figueira da Foz
                </span>
              </div>
            </div>

            <p className="text-xs text-[#C5BDB0] max-w-sm leading-relaxed">
              Atelier de barbearia & barbaterapia com vaporizador de ozónio no Paião. Atendimento de excelência por Gabriel.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href={shopInfo.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:text-[#E5C268] hover:bg-white/20 transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>

              <a
                href={`tel:${shopInfo.phoneClean}`}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:text-[#E5C268] hover:bg-white/20 transition-colors"
                title="Telefone"
              >
                <Phone className="w-4 h-4" />
              </a>

              <a
                href={shopInfo.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:text-[#E5C268] hover:bg-white/20 transition-colors"
                title="Google Maps"
              >
                <MapPin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Col */}
          <div className="md:col-span-3 space-y-3 text-left">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C89B58] block">
              Menu
            </span>
            <ul className="space-y-2 text-xs text-[#C5BDB0]">
              <li>
                <a href="#servicos" className="hover:text-white transition-colors">
                  Serviços
                </a>
              </li>
              <li>
                <a href="#sobre" className="hover:text-white transition-colors">
                  Artista (Gabriel)
                </a>
              </li>
              <li>
                <a href="#ozonio" className="hover:text-white transition-colors">
                  Barbaterapia
                </a>
              </li>
              <li>
                <a href="#galeria" className="hover:text-white transition-colors">
                  Galeria
                </a>
              </li>
              <li>
                <a href="#localizacao" className="hover:text-white transition-colors">
                  Localização
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="md:col-span-4 space-y-3 text-left">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C89B58] block">
              Contacto
            </span>
            <p className="text-[#C5BDB0]">
              {shopInfo.address}
            </p>
            <p className="text-white font-bold text-sm">
              <a href={`tel:${shopInfo.phoneClean}`} className="hover:text-[#E5C268] transition-colors">
                {shopInfo.phone}
              </a>
              <span className="text-[10px] text-[#C5BDB0] font-normal block leading-tight">(Chamada para a rede móvel nacional)</span>
            </p>
            <p className="text-[#C89B58] font-medium">
              Segunda a Sábado: 10:00 – 22:00
              <span className="text-[10px] text-[#C5BDB0] font-normal block leading-tight">(Almoço: 13:00 – 14:00)</span>
            </p>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onOpenBooking()}
                className="btn-pill-gold text-xs uppercase tracking-[0.12em] px-5 py-2.5 flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <span>Agendar Horário</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          </div>

        </div>

        {/* Agency Rights & Legal Attribution */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#9E9EA7]">
          <p>
            © {new Date().getFullYear()} Rota Do Corte. Todos os direitos reservados. Website por{" "}
            <a
              href="https://pdagencydigital.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C89B58] hover:text-white font-bold transition-colors underline decoration-[#C89B58]/40 hover:decoration-white"
            >
              P&D Agency
            </a>.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-2.5 gap-y-1.5 text-[11px]">
            <button type="button" onClick={onOpenPrivacy} className="hover:text-white transition-colors cursor-pointer underline">
              Política de Privacidade
            </button>
            <span className="inline-flex items-center gap-2.5">
              <span className="text-[#9E9EA7]/50 select-none">•</span>
              <button type="button" onClick={onOpenPrivacy} className="hover:text-white transition-colors cursor-pointer underline">
                Política de Cookies
              </button>
            </span>
            <span className="inline-flex items-center gap-2.5">
              <span className="text-[#9E9EA7]/50 select-none">•</span>
              <button type="button" onClick={onOpenTerms} className="hover:text-white transition-colors cursor-pointer underline">
                Termos e Condições
              </button>
            </span>
            <span className="inline-flex items-center gap-2.5">
              <span className="text-[#9E9EA7]/50 select-none">•</span>
              <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline">
                Livro de Reclamações
              </a>
            </span>
            <span className="inline-flex items-center gap-2.5">
              <span className="text-[#9E9EA7]/50 select-none">•</span>
              <a href="https://www.cniacc.pt" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline whitespace-nowrap">
                Resolução de Litígios de Consumo (RAL)
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
