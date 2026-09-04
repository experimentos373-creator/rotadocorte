import { useState, useEffect } from "react";

export const WhatsAppIcon = ({ className = "w-7 h-7 relative z-10" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.197 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.78 0-3.52-.479-5.045-1.385l-.362-.214-3.75.983.999-3.656-.235-.374a9.92 9.92 0 0 1-1.528-5.321c0-5.485 4.463-9.948 9.948-9.948 2.658 0 5.157 1.036 7.034 2.914a9.88 9.88 0 0 1 2.912 7.031c0 5.487-4.464 9.95-9.949 9.95m0-18.358c-4.637 0-8.409 3.771-8.409 8.408 0 1.482.389 2.93 1.127 4.204l.176.299-.667 2.441 2.498-.655.289.172c1.233.733 2.648 1.12 4.086 1.12 4.637 0 8.408-3.772 8.408-8.409 0-2.246-.874-4.358-2.46-5.945a8.35 8.35 0 0 0-5.945-2.459"/>
  </svg>
);

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 250);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const whatsappUrl = `https://wa.me/351935190491?text=${encodeURIComponent(
    "Olá! Gostaria de obter informações sobre os serviços e agendamentos na Rota Do Corte (Paião)."
  )}`;

  return (
    <div
      className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      {/* Tooltip */}
      <div className="hidden sm:block bg-[#14161b] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-md">
        <span>Fale connosco no WhatsApp</span>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar Barbearia Rota Do Corte no WhatsApp"
        className="w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all relative group"
      >
        <WhatsAppIcon className="w-6 h-6 relative z-10 fill-white" />
      </a>
    </div>
  );
}
