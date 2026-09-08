import { useState, useEffect } from "react";
import { Shield, Check, X, Settings2, Sliders } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function CookieConsent({ onOpenPrivacy }) {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    try {
      const consent = localStorage.getItem("rotadocorte_cookie_consent_v2");
      if (!consent) {
        setShowBanner(true);
      } else {
        const parsed = JSON.parse(consent);
        setPreferences(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      setShowBanner(true);
    }

    const handleReset = () => {
      try {
        localStorage.removeItem("rotadocorte_cookie_consent_v2");
        localStorage.removeItem("rotadocorte_cookie_consent");
      } catch {}
      setShowBanner(true);
      setShowConfig(true);
    };

    window.addEventListener("reset_cookie_consent", handleReset);
    return () => window.removeEventListener("reset_cookie_consent", handleReset);
  }, []);

  const saveConsent = (prefs) => {
    const consentRecord = {
      ...prefs,
      necessary: true,
      timestamp: new Date().toISOString(),
      version: "2026.1"
    };
    try {
      localStorage.setItem("rotadocorte_cookie_consent_v2", JSON.stringify(consentRecord));
      localStorage.setItem("rotadocorte_cookie_consent", "accepted");
    } catch {}
    setPreferences(consentRecord);
    setShowBanner(false);
    setShowConfig(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <aside 
      aria-label="Gestão de Consentimento e Privacidade"
      className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-lg z-50 animate-fadeIn text-left font-sans"
    >
      <div className="bg-[#121316]/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-[#c89b58]/50 shadow-[0_20px_50px_rgba(0,0,0,0.95)] space-y-3.5 text-white">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#c89b58]/20 flex items-center justify-center text-[#e5c268] shrink-0 mt-0.5 border border-[#c89b58]/30">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-[#c89b58]/15 text-[#e5c268] border border-[#c89b58]/30 mb-1">
              <span>RGPD & ePrivacy</span>
            </div>
            <h3 className="text-xs font-bold text-[#f7f5f0] uppercase tracking-wider">
              {t?.cookies?.title || "Privacidade & Armazenamento"}
            </h3>
            <p className="text-xs text-[#b8b8c2] mt-1 leading-relaxed font-normal">
              Utilizamos armazenamento local e cookies estritamente necessários para permitir o funcionamento do agendamento de cortes e gravação do tema. Não utilizamos ferramentas de rastreamento comercial ou criação de perfis.{" "}
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-[#e5c268] underline font-semibold hover:text-white transition-colors cursor-pointer inline"
              >
                Política de Privacidade & Cookies
              </button>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRejectNonEssential}
            className="text-neutral-500 hover:text-white transition-colors cursor-pointer p-1"
            aria-label="Rejeitar não-essenciais e fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer de Configuração Granular */}
        {showConfig && (
          <div className="my-2 pt-2.5 border-t border-white/10 space-y-2 text-xs text-neutral-300 bg-black/40 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between pb-1">
              <span className="font-bold text-[#e5c268] uppercase text-[10.5px] tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Definições de Armazenamento
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <div className="pr-3">
                <div className="font-semibold text-white">Estritamente Necessários</div>
                <div className="text-[10px] text-neutral-400">Agendamentos, segurança e registo do consentimento.</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c89b58]/20 text-[#e5c268] font-bold">
                Obrigatório
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <div className="pr-3">
                <div className="font-semibold text-white">Preferências de Visualização</div>
                <div className="text-[10px] text-neutral-400">Guarda a sua escolha de tema visual (Claro / Escuro).</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                className="w-4 h-4 accent-[#c89b58] rounded cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleSavePreferences}
              className="w-full mt-2 py-2 rounded-xl bg-[#c89b58] hover:bg-[#e5c268] text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              Guardar Definições
            </button>
          </div>
        )}

        {/* Links e Botão Configurar */}
        <div className="flex items-center justify-between gap-3 pt-1 text-[11px] text-neutral-400 border-t border-white/10">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-[#e5c268] hover:underline"
          >
            Ver Detalhes Legais
          </button>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-neutral-300 hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer text-[11px] underline"
          >
            <Settings2 className="w-3 h-3 text-[#e5c268]" />
            <span>{showConfig ? "Ocultar Opções" : "Configurar"}</span>
          </button>
        </div>

        {/* 3 Botões de Ação */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={handleRejectNonEssential}
            className="py-2.5 px-2.5 rounded-xl bg-[#1c1e24] hover:bg-[#252830] text-[#d0d0d8] border border-white/10 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all active:scale-98 text-center"
          >
            Rejeitar Não-Essenciais
          </button>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="py-2.5 px-2.5 rounded-xl bg-[#121316] hover:bg-[#1a1c22] text-[#e5c268] border border-[#c89b58]/40 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all active:scale-98 text-center"
          >
            Configurar
          </button>

          <button
            type="button"
            onClick={handleAcceptAll}
            className="col-span-2 sm:col-span-1 bg-[#c89b58] hover:bg-[#e5c268] text-[#0a0a0c] py-2.5 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-98 text-center"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Aceitar Todos</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
