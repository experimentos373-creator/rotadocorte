import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, ChevronDown, ArrowUpRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { FlagPT, FlagGB, FlagES, FlagFR } from "./Flags";

export default function Navbar({ onOpenBooking }) {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const languages = [
    { code: "pt", label: "PT", fullName: "Português", FlagComponent: FlagPT },
    { code: "en", label: "EN", fullName: "English", FlagComponent: FlagGB },
    { code: "es", label: "ES", fullName: "Español", FlagComponent: FlagES },
    { code: "fr", label: "FR", fullName: "Français", FlagComponent: FlagFR }
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  const scrollTo = (e, id) => {
    if (location.pathname !== "/") return;
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isDark = theme === "dark";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isDark
          ? isScrolled
            ? "bg-[#07080A]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl py-2.5 sm:py-3"
            : "bg-[#07080A]/85 backdrop-blur-md border-b border-white/5 py-3 sm:py-4"
          : isScrolled
            ? "bg-[#F6F4EE]/95 backdrop-blur-xl border-b border-[#DED7C8] shadow-md py-2.5 sm:py-3"
            : "bg-[#F6F4EE]/85 backdrop-blur-md border-b border-[#DED7C8]/70 py-3 sm:py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-6 h-11 sm:h-12">
          
          {/* Brand: Logo & Title */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 group focus:outline-none shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src="/images/logo.png"
              alt="Rota Do Corte"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
            
            <div className="text-left flex flex-col justify-center">
              <span className={`text-sm sm:text-lg font-extrabold tracking-wider leading-none ${
                isDark ? "text-[#FAF8F5] group-hover:text-[#E5C268]" : "text-[#1C1A17] group-hover:text-[#9A7743]"
              } transition-colors whitespace-nowrap`}>
                ROTA DO CORTE
              </span>
              <span className={`text-[8px] sm:text-[9px] tracking-[0.2em] uppercase font-semibold mt-0.5 ${
                isDark ? "text-[#C89B58]" : "text-[#8C8275]"
              } whitespace-nowrap`}>
                Paião
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-9 text-xs uppercase tracking-[0.14em] font-semibold whitespace-nowrap">
            <a
              href="#servicos"
              onClick={(e) => scrollTo(e, "servicos")}
              className={`transition-colors whitespace-nowrap ${
                isDark ? "text-[#9E9EA7] hover:text-[#FAF8F5]" : "text-[#5C554B] hover:text-[#1C1A17]"
              }`}
            >
              {t.nav.services}
            </a>

            <a
              href="#sobre"
              onClick={(e) => scrollTo(e, "sobre")}
              className={`transition-colors whitespace-nowrap ${
                isDark ? "text-[#9E9EA7] hover:text-[#FAF8F5]" : "text-[#5C554B] hover:text-[#1C1A17]"
              }`}
            >
              {t.nav.artist}
            </a>

            <a
              href="#ozonio"
              onClick={(e) => scrollTo(e, "ozonio")}
              className={`transition-colors whitespace-nowrap ${
                isDark ? "text-[#9E9EA7] hover:text-[#FAF8F5]" : "text-[#5C554B] hover:text-[#1C1A17]"
              }`}
            >
              {t.nav.experience}
            </a>

            <a
              href="#galeria"
              onClick={(e) => scrollTo(e, "galeria")}
              className={`transition-colors whitespace-nowrap ${
                isDark ? "text-[#9E9EA7] hover:text-[#FAF8F5]" : "text-[#5C554B] hover:text-[#1C1A17]"
              }`}
            >
              {t.nav.gallery}
            </a>

            <a
              href="#localizacao"
              onClick={(e) => scrollTo(e, "localizacao")}
              className={`transition-colors whitespace-nowrap ${
                isDark ? "text-[#9E9EA7] hover:text-[#FAF8F5]" : "text-[#5C554B] hover:text-[#1C1A17]"
              }`}
            >
              {t.nav.location}
            </a>
          </nav>

          {/* Desktop Right Actions: Theme, Lang, CTA in 1 Line */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isDark
                  ? "bg-white/5 border-white/10 text-[#E5C268] hover:bg-white/10"
                  : "bg-white border-[#DED7C8] text-[#9A7743] hover:bg-[#ECE7DC]"
              }`}
              title={isDark ? "Mudar para modo Claro" : "Mudar para modo Escuro"}
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? "bg-white/5 border-white/10 text-[#FAF8F5] hover:border-[#C89B58]/40"
                    : "bg-white border-[#DED7C8] text-[#1C1A17] hover:bg-[#ECE7DC]"
                }`}
              >
                <currentLang.FlagComponent className="w-4 h-3 rounded-2xs object-cover shrink-0 shadow-xs" />
                <span className="uppercase font-bold tracking-wider">{currentLang.label}</span>
                <ChevronDown className="w-3 h-3 text-[#9E9EA7]" />
              </button>

              {langDropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-32 py-1 rounded-xl shadow-xl z-50 border ${
                    isDark
                      ? "bg-[#13151B] border-white/10 text-[#FAF8F5]"
                      : "bg-white border-[#DED7C8] text-[#1C1A17]"
                  }`}
                  onMouseLeave={() => setLangDropdownOpen(false)}
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLang(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                        lang === l.code
                          ? isDark ? "text-[#E5C268] font-bold bg-[#C89B58]/15" : "text-[#1C1A17] font-bold bg-[#ECE7DC]"
                          : isDark ? "text-[#9E9EA7] hover:bg-white/5" : "text-[#5C554B] hover:bg-[#F6F4EE]"
                      }`}
                    >
                      <l.FlagComponent className="w-4 h-3 rounded-2xs object-cover shrink-0 shadow-xs" />
                      <span className="font-semibold uppercase tracking-wider">{l.label}</span>
                      <span className="text-[10px] text-neutral-400 font-normal">({l.fullName})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Booking CTA Pill */}
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className={`text-xs uppercase tracking-[0.14em] px-5 py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer font-bold transition-all shadow-md whitespace-nowrap ${
                isDark
                  ? "btn-pill-gold"
                  : "bg-[#1C1A17] text-[#FAF8F5] hover:bg-[#2F2B26]"
              }`}
            >
              <span>{t.nav.bookNow}</span>
              <ArrowUpRight className={`w-3.5 h-3.5 ${isDark ? "text-black" : "text-[#D6B78B]"}`} />
            </button>
          </div>

          {/* Mobile Right Actions: Theme, Lang Pill, CTA, Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
            
            {/* Mobile Language Switcher Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-full border text-[11px] font-bold cursor-pointer transition-colors ${
                  isDark
                    ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    : "bg-white border-[#DED7C8] text-[#1C1A17]"
                }`}
                aria-label="Selecionar idioma"
              >
                <currentLang.FlagComponent className="w-3.5 h-2.5 rounded-2xs object-cover shrink-0" />
                <span className="uppercase">{currentLang.label}</span>
              </button>

              {langDropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-32 py-1.5 rounded-2xl shadow-2xl z-50 border ${
                    isDark
                      ? "bg-[#13151B] border-white/15 text-[#FAF8F5]"
                      : "bg-white border-[#DED7C8] text-[#1C1A17]"
                  }`}
                >
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLang(l.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 cursor-pointer ${
                        lang === l.code
                          ? isDark ? "text-[#E5C268] font-bold bg-[#C89B58]/20" : "text-[#1C1A17] font-bold bg-[#ECE7DC]"
                          : isDark ? "text-[#9E9EA7] hover:bg-white/5" : "text-[#5C554B] hover:bg-[#F6F4EE]"
                      }`}
                    >
                      <l.FlagComponent className="w-4 h-3 rounded-2xs object-cover shrink-0" />
                      <span className="font-semibold uppercase">{l.label}</span>
                      <span className="text-[10px] text-neutral-400">({l.fullName})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-1.5 sm:p-2 rounded-full border ${
                isDark
                  ? "bg-white/5 border-white/10 text-[#E5C268]"
                  : "bg-white border-[#DED7C8] text-[#9A7743]"
              }`}
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Booking CTA (Compact Pill) */}
            <button
              type="button"
              onClick={() => onOpenBooking()}
              className={`text-[10px] sm:text-[11px] uppercase tracking-wider px-2.5 sm:px-3 py-1.5 rounded-full font-bold whitespace-nowrap shadow-sm cursor-pointer ${
                isDark ? "btn-pill-gold" : "bg-[#1C1A17] text-[#FAF8F5]"
              }`}
            >
              {t.nav.bookNow}
            </button>

            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-1.5 sm:p-2 rounded-full border cursor-pointer ${
                isDark
                  ? "bg-white/5 border-white/10 text-white"
                  : "bg-white border-[#DED7C8] text-[#1C1A17]"
              }`}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className={`lg:hidden border-b px-5 py-5 space-y-4 animate-in fade-in duration-200 ${
          isDark
            ? "bg-[#0D0E12] border-white/10 text-[#FAF8F5]"
            : "bg-[#F6F4EE] border-[#DED7C8] text-[#1C1A17]"
        }`}>
          {/* Navigation Links */}
          <div className="space-y-1">
            <a
              href="#servicos"
              onClick={(e) => scrollTo(e, "servicos")}
              className="block py-2 text-sm font-semibold hover:text-[#C89B58] transition-colors"
            >
              {t.nav.services}
            </a>
            <a
              href="#sobre"
              onClick={(e) => scrollTo(e, "sobre")}
              className="block py-2 text-sm font-semibold hover:text-[#C89B58] transition-colors"
            >
              {t.nav.artist}
            </a>
            <a
              href="#ozonio"
              onClick={(e) => scrollTo(e, "ozonio")}
              className="block py-2 text-sm font-semibold hover:text-[#C89B58] transition-colors"
            >
              {t.nav.experience}
            </a>
            <a
              href="#galeria"
              onClick={(e) => scrollTo(e, "galeria")}
              className="block py-2 text-sm font-semibold hover:text-[#C89B58] transition-colors"
            >
              {t.nav.gallery}
            </a>
            <a
              href="#localizacao"
              onClick={(e) => scrollTo(e, "localizacao")}
              className="block py-2 text-sm font-semibold hover:text-[#C89B58] transition-colors"
            >
              {t.nav.location}
            </a>
          </div>

          {/* Languages Selector Grid */}
          <div className="pt-3 border-t border-white/10 dark:border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Idioma / Language:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLang(l.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 font-bold border transition-colors cursor-pointer ${
                    lang === l.code
                      ? isDark
                        ? "bg-[#C89B58]/20 border-[#C89B58] text-[#E5C268]"
                        : "bg-[#FAF0E4] border-[#C89B58] text-[#8C601E]"
                      : isDark
                        ? "bg-white/5 border-white/5 text-neutral-300"
                        : "bg-white border-neutral-200 text-neutral-700"
                  }`}
                >
                  <l.FlagComponent className="w-4 h-3 rounded-2xs object-cover shrink-0" />
                  <span>{l.fullName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Booking CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3 rounded-full text-xs uppercase tracking-wider font-bold btn-pill-gold flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>{t.nav.bookNow}</span>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

