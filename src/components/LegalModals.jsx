import { useEffect } from "react";
import { X, Shield, FileText, CheckCircle2, Lock, Cookie, Scale } from "lucide-react";
import { shopInfo } from "../data/services";
import { useTheme } from "../context/ThemeContext";

export default function LegalModals({ activeModal, onClose }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 🔒 Lock body & html scroll when legal modal is open
  useEffect(() => {
    if (activeModal) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [activeModal]);

  if (!activeModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl my-8 max-h-[88vh] overflow-y-auto animate-fadeIn border transition-all ${
          isDark
            ? "bg-[#111318] border-white/10 text-[#c4c4cc] shadow-black/80"
            : "bg-[#FAF8F5] border-[#DED7C8] text-[#3A3834] shadow-2xl shadow-black/20"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-5 right-5 w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
            isDark
              ? "bg-white/5 border-white/10 text-[#9e9ea7] hover:text-white"
              : "bg-white border-[#DED7C8] text-[#1C1A17] hover:text-black hover:bg-neutral-100 shadow-sm"
          }`}
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {activeModal === "privacy" ? (
          <div className="space-y-4 text-left text-xs sm:text-sm leading-relaxed">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#C89B58]" />
              <h2 className={`text-xl sm:text-2xl font-bold font-serif ${
                isDark ? "text-white" : "text-[#1C1A17]"
              }`}>
                Política de Privacidade & Cookies (RGPD)
              </h2>
            </div>
            <p className={`text-[11px] ${isDark ? "text-[#9e9ea7]" : "text-[#5C554B]"}`}>
              Conforme Regulamento (UE) 2016/679 (RGPD) & Lei n.º 41/2004 • Última atualização: Setembro de 2026
            </p>

            <h3 className={`font-bold text-sm pt-2 flex items-center gap-1.5 ${isDark ? "text-white" : "text-[#1C1A17]"}`}>
              <span>1. Identificação do Responsável pelo Tratamento</span>
            </h3>
            <p className={isDark ? "text-[#c4c4cc]" : "text-[#4A4740]"}>
              A <strong>Rota Do Corte</strong> (titularidade de Gabriel / Barbearia), localizada na Rua da Direita nº 75, 3090-495 Paião, Figueira da Foz, contacto telefónico <strong>{shopInfo.phone}</strong>, é a entidade responsável pelo tratamento dos dados pessoais recolhidos através deste website (rotadocorte.com).
            </p>

            <h3 className={`font-bold text-sm pt-2 flex items-center gap-1.5 ${isDark ? "text-white" : "text-[#1C1A17]"}`}>
              <span>2. Encarregado de Proteção de Dados (DPO)</span>
            </h3>
            <p className={isDark ? "text-[#c4c4cc]" : "text-[#4A4740]"}>
              Não é obrigatória a designação de um Encarregado de Proteção de Dados nos termos do Artigo 37.º do RGPD, por se tratar de atividade comercial individual de barbearia sem tratamento em grande escala de dados sensíveis ou monitorização sistemática.
            </p>

            <h3 className={`font-bold text-sm pt-2 flex items-center gap-1.5 ${isDark ? "text-white" : "text-[#1C1A17]"}`}>
              <span>3. Dados Recolhidos, Finalidades e Bases Jurídicas</span>
            </h3>
            <p className={isDark ? "text-[#c4c4cc]" : "text-[#4A4740]"}>
              Tratamos apenas os dados estritamente indispensáveis para o serviço de barbearia:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-[11.5px]">
              <li>
                <strong>Gestão de Agendamentos (Nome, Telemóvel, Serviço, Data/Hora, Notas):</strong> Fundamento no <strong>Artigo 6.º, n.º 1, alínea b do RGPD</strong> (Diligências pré-contratuais e execução de contrato de prestação de serviços a pedido do cliente).
              </li>
              <li>
                <strong>Faturação e Obrigações Fiscais:</strong> Fundamento no <strong>Artigo 6.º, n.º 1, alínea c do RGPD</strong> (Cumprimento de obrigação jurídica fiscal).
              </li>
              <li>
                <strong>Segurança e Prevenção de Abuso:</strong> Fundamento no <strong>Artigo 6.º, n.º 1, alínea f do RGPD</strong> (Interesse legítimo na integridade do sistema).
              </li>
            </ul>

            <h3 className={`font-bold text-sm pt-2 flex items-center gap-1.5 ${isDark ? "text-white" : "text-[#1C1A17]"}`}>
              <Lock className="w-4 h-4 text-[#C89B58]" />
              <span>4. Subcontratantes e Segurança da Informação</span>
            </h3>
            <p className={isDark ? "text-[#c4c4cc]" : "text-[#4A4740]"}>
              Os dados de agendamento são processados de forma encriptada através dos seguintes fornecedores técnicos com salvaguardas adequadas (DPF / SCCs):
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11.5px]">
              <li><strong>Supabase Inc.</strong> — Base de dados alojada na União Europeia (Frankfurt / EEE) para gestão em tempo real das marcações.</li>
              <li><strong>Vercel Inc.</strong> — Alojamento web e CDN de alta performance com tráfego HTTPS/TLS forçado.</li>
              <li><strong>Meta Platforms Ireland Ltd. (WhatsApp)</strong> — Canal direto de confirmação voluntária pelo próprio utilizador.</li>
            </ul>

            <h3 className={`font-bold text-sm pt-2 flex items-center gap-1.5 ${isDark ? "text-white" : "text-[#1C1A17]"}`}>
              <Cookie className="w-4 h-4 text-[#C89B58]" />
              <span>5. Política de Armazenamento Local & Cookies</span>
            </h3>
            <div className="overflow-x-auto my-2">
              <table className="w-full text-left text-[10.5px] border border-white/10">
                <thead className={isDark ? "bg-black/50 text-[#e5c268]" : "bg-[#EDE5D8] text-[#1C1A17]"}>
                  <tr>
                    <th className="p-1.5 border-b border-white/10 font-bold">Chave / Tecnologia</th>
                    <th className="p-1.5 border-b border-white/10 font-bold">Tipo</th>
                    <th className="p-1.5 border-b border-white/10 font-bold">Finalidade</th>
                    <th className="p-1.5 border-b border-white/10 font-bold">Duração</th>
                    <th className="p-1.5 border-b border-white/10 font-bold">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="p-1.5 font-mono text-[#e5c268]">rotadocorte_cookie_consent_v2</td>
                    <td className="p-1.5">LocalStorage</td>
                    <td className="p-1.5">Regista o consentimento e escolhas do utilizador</td>
                    <td className="p-1.5">12 meses</td>
                    <td className="p-1.5 font-bold text-emerald-400">Essencial</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-mono text-[#e5c268]">rotadocorte_appointments_v1</td>
                    <td className="p-1.5">LocalStorage</td>
                    <td className="p-1.5">Armazenamento de contingência / cache de agendamento</td>
                    <td className="p-1.5">Persistente</td>
                    <td className="p-1.5 font-bold text-emerald-400">Essencial</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-mono text-[#e5c268]">theme</td>
                    <td className="p-1.5">LocalStorage</td>
                    <td className="p-1.5">Memorização do modo visual (Claro / Escuro)</td>
                    <td className="p-1.5">Persistente</td>
                    <td className="p-1.5 font-bold text-blue-400">Funcional</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className={`font-bold text-sm pt-2 flex items-center gap-1.5 ${isDark ? "text-white" : "text-[#1C1A17]"}`}>
              <Scale className="w-4 h-4 text-[#C89B58]" />
              <span>6. Direitos do Titular & CNPD</span>
            </h3>
            <p className={isDark ? "text-[#c4c4cc]" : "text-[#4A4740]"}>
              Tem o direito de solicitar o acesso, retificação, eliminação ou limitação do tratamento dos seus dados pelo contacto telefónico <strong>{shopInfo.phone}</strong>. Não existem decisões automatizadas ou profiling (Artigo 22.º do RGPD). Assiste-lhe igualmente o direito de apresentar reclamação à <strong>CNPD (Comissão Nacional de Proteção de Dados — www.cnpd.pt)</strong>.
            </p>

            <div className={`pt-3 border-t mt-3 flex items-center justify-between ${
              isDark ? "border-white/10" : "border-[#E8D4BE]"
            }`}>
              <span className={`text-xs ${isDark ? "text-[#9e9ea7]" : "text-[#5C554B]"}`}>
                Preferências de Armazenamento:
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new Event("reset_cookie_consent"));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                  isDark
                    ? "border-[#C89B58]/40 text-[#E5C268] hover:bg-[#C89B58]/15"
                    : "border-[#8C601E] text-[#8C601E] bg-[#FAF0E4] hover:bg-[#F3E2CF]"
                }`}
              >
                <span>Gerir / Redefinir Cookies 🔄</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left text-xs sm:text-sm leading-relaxed">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C89B58]" />
              <h2 className={`text-xl sm:text-2xl font-bold font-serif ${
                isDark ? "text-white" : "text-[#1C1A17]"
              }`}>
                Termos e Condições de Serviço
              </h2>
            </div>
            <p className={`text-[11px] ${isDark ? "text-[#9e9ea7]" : "text-[#5C554B]"}`}>
              Última atualização: Setembro de 2026
            </p>

            <h3 className={`font-bold text-sm pt-2 ${isDark ? "text-white" : "text-[#1C1A17]"}`}>
              1. Agendamentos e Pontualidade
            </h3>
            <p className={isDark ? "text-[#c4c4cc]" : "text-[#4A4740]"}>
              Recomendamos a comparência com 5 minutos de antecedência ao horário marcado. Em caso de atraso ou necessidade de cancelamento, agradecemos o aviso prévio por WhatsApp ou telefone.
            </p>

            <h3 className={`font-bold text-sm pt-2 ${isDark ? "text-white" : "text-[#1C1A17]"}`}>
              2. Horário de Funcionamento Alargado
            </h3>
            <p className={isDark ? "text-[#c4c4cc]" : "text-[#4A4740]"}>
              A barbearia opera de Segunda a Sábado das 10:00 às 22:00 (com pausa para almoço das 13:00 às 14:00), sujeito a disponibilidade na agenda oficial.
            </p>

            <h3 className={`font-bold text-sm pt-2 ${isDark ? "text-white" : "text-[#1C1A17]"}`}>
              3. Preços e Pagamento
            </h3>
            <p className={isDark ? "text-[#c4c4cc]" : "text-[#4A4740]"}>
              Todos os preços indicados no website incluem IVA à taxa legal em vigor em Portugal e correspondem à tabela oficial afixada no estabelecimento. Em caso de litígio, pode recorrer à entidade RAL competente (CNIACC — www.cniacc.pt).
            </p>
          </div>
        )}

        <div className={`mt-6 pt-4 border-t text-right ${
          isDark ? "border-white/10" : "border-[#E8D4BE]"
        }`}>
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
