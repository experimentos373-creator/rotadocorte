import { useEffect } from "react";
import { X, Shield, FileText } from "lucide-react";
import { shopInfo } from "../data/services";

export default function LegalModals({ activeModal, onClose }) {
  // 🔒 Lock body scroll when legal modal is open
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeModal]);

  if (!activeModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-[#111318] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 max-h-[85vh] overflow-y-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 border border-white/10 text-[#9e9ea7] hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {activeModal === "privacy" ? (
          <div className="space-y-4 text-left text-xs sm:text-sm text-[#c4c4cc] leading-relaxed">
            <div className="flex items-center gap-2 text-[#e5c268]">
              <Shield className="w-5 h-5 text-[#C89B58]" />
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
                Política de Privacidade
              </h2>
            </div>
            <p className="text-[11px] text-[#9e9ea7]">Última atualização: 2026</p>

            <h3 className="font-bold text-white text-sm pt-2">1. Responsável pelo Tratamento</h3>
            <p>
              A <strong>Rota Do Corte</strong>, localizada na Rua da Direita nº 75, 3090-495 Paião, Figueira da Foz, é a responsável pelo tratamento de dados pessoais recolhidos para efeitos de marcação de serviços e contacto.
            </p>

            <h3 className="font-bold text-white text-sm pt-2">2. Finalidade da Recolha</h3>
            <p>
              Os dados facultados (como nome, contacto telefónico ou mensagens de WhatsApp) destinam-se exclusivamente à gestão de agendamentos na barbearia, confirmação de horários e esclarecimento de dúvidas.
            </p>

            <h3 className="font-bold text-white text-sm pt-2">3. Plataformas e Segurança</h3>
            <p>
              Os agendamentos online automáticos são processados de forma segura cumprindo os padrões de segurança e privacidade em vigor pelo RGPD.
            </p>

            <h3 className="font-bold text-white text-sm pt-2">4. Direitos do Titular, CNPD e RAL</h3>
            <p>
              Pode a qualquer momento solicitar o acesso, retificação ou eliminação dos seus dados contactando-nos através do telefone <strong>{shopInfo.phone}</strong>. O titular dos dados tem o direito de apresentar reclamação à <strong>CNPD (Comissão Nacional de Proteção de Dados - www.cnpd.pt)</strong>. Em caso de litígio de consumo, pode recorrer à Entidade RAL competente: <strong>CNIACC (www.cniacc.pt)</strong>.
            </p>

            <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between">
              <span className="text-xs text-[#9e9ea7]">Preferências de Armazenamento Local:</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new Event("reset_cookie_consent"));
                }}
                className="btn-outline-gold px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Redefinir Cookies 🔄</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left text-xs sm:text-sm text-[#c4c4cc] leading-relaxed">
            <div className="flex items-center gap-2 text-[#e5c268]">
              <FileText className="w-5 h-5 text-[#C89B58]" />
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
                Termos e Condições de Serviço
              </h2>
            </div>
            <p className="text-[11px] text-[#9e9ea7]">Última atualização: 2026</p>

            <h3 className="font-bold text-white text-sm pt-2">1. Agendamentos e Pontualidade</h3>
            <p>
              Recomendamos a comparência com 5 minutos de antecedência ao horário marcado. Em caso de atraso ou necessidade de cancelamento, agradecemos o aviso prévio por WhatsApp ou telefone.
            </p>

            <h3 className="font-bold text-white text-sm pt-2">2. Horário de Funcionamento Alargado</h3>
            <p>
              A barbearia opera de Segunda a Sábado das 10:00 às 22:00 (com pausa para almoço das 13:00 às 14:00), sujeito a disponibilidade na agenda oficial.
            </p>

            <h3 className="font-bold text-white text-sm pt-2">3. Preços e Pagamento</h3>
            <p>
              Todos os preços indicados no website incluem IVA à taxa legal em vigor em Portugal e correspondem à tabela oficial afixada no estabelecimento.
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/10 text-right">
          <button
            type="button"
            onClick={onClose}
            className="btn-pill-gold px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Compreendi
          </button>
        </div>
      </div>
    </div>
  );
}
