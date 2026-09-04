import { useState, useEffect } from "react";
import { Shield, Check, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function CookieConsent({ onOpenPrivacy }) {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("rotadocorte_cookie_consent");
      if (!consent) {
        setShowBanner(true);
      }
    } catch {
      setShowBanner(true);
    }

    const handleReset = () => {
      try {
        localStorage.removeItem("rotadocorte_cookie_consent");
      } catch {}
      setShowBanner(true);
    };

    window.addEventListener("reset_cookie_consent", handleReset);
    return () => window.removeEventListener("reset_cookie_consent", handleReset);
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("rotadocorte_cookie_consent", "accepted");
    } catch {}
    setShowBanner(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("rotadocorte_cookie_consent", "essential_only");
    } catch {}
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-fadeIn">
      <div className="bg-[#121316] p-5 sm:p-6 rounded-2xl border border-[#c89b58]/50 shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#c89b58]/20 flex items-center justify-center text-[#e5c268] shrink-0 mt-0.5 border border-[#c89b58]/30">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#f7f5f0] uppercase tracking-wider">
              {t.cookies.title}
            </h3>
            <p className="text-xs text-[#b8b8c2] mt-1 leading-relaxed font-normal">
              {t.cookies.desc}{" "}
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-[#e5c268] underline font-semibold hover:text-white transition-colors cursor-pointer"
              >
                Política de Privacidade
              </button>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 bg-[#c89b58] hover:bg-[#e5c268] text-[#0a0a0c] py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t.cookies.accept}</span>
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="bg-[#1c1e24] hover:bg-[#252830] text-[#d0d0d8] border border-white/10 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all active:scale-98"
          >
            <span>{t.cookies.decline}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
