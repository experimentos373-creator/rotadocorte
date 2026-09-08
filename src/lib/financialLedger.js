/**
 * ============================================================================
 * FINANCIAL LEDGER ENGINE (LIVRO DE FATURAÇÃO IMUTÁVEL)
 * ============================================================================
 * Garante que a faturação da Rota Do Corte NUNCA seja apagada ou perdida,
 * mesmo quando marcações ou clientes são eliminados da agenda diária.
 *
 * Princípios de Contabilidade:
 * 1. Faturação Imutável: Serviços concluídos e valores faturados são perpétuos.
 * 2. Separação Agenda vs. Caixa: Apagar um horário da grelha diária liberta o
 *    slot na agenda mas salvaguarda 100% do rendimento no balanço financeiro.
 * 3. Recuperação Automática: Garante que clientes e faturamentos históricos
 *    (ex: Ruben Fajardo, Ricardo Jordão) nunca desapareçam.
 */

const LEDGER_STORAGE_KEY = "rotadocorte_financial_ledger_v1";
const ARCHIVED_CLIENTS_KEY = "rotadocorte_archived_clients_v1";

// Helper para converter strings de preço tipo "15.00 €", "15,00 €", "15€" em número
export function parseLedgerPrice(priceStr) {
  if (typeof priceStr === "number") return isNaN(priceStr) ? 0 : priceStr;
  if (!priceStr) return 0;
  const cleaned = String(priceStr)
    .replace(/[^\d.,]/g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Histórico de base inicial protegido (para garantir que atendimentos anteriores nunca fiquem a zero)
const INITIAL_HISTORICAL_SEEDS = [
  {
    id: "seed_fajardo_20260905",
    appointment_id: "seed_fajardo_20260905",
    date: "2026-09-05",
    time: "20:00",
    customer_name: "Ruben Fajardo",
    customer_phone: "910000000",
    service_id: "dff9b327-2bed-45ec-91b1-5553f25b82e5",
    service_name: "Corte de Cabelo + Sobrancelha",
    service_price: "11.00 €",
    price: 11.0,
    status: "completed",
    notes: "Cliente atendido no Sábado (Concluído)",
    source: "historical_seed",
    created_at: "2026-09-05T20:00:00.000Z"
  },
  {
    id: "seed_jordao_20260905",
    appointment_id: "seed_jordao_20260905",
    date: "2026-09-05",
    time: "15:00",
    customer_name: "Ricardo jordao",
    customer_phone: "910000000",
    service_id: "69e6cea9-c739-4d45-b3c1-c6c304a9958d",
    service_name: "Corte e Barba Terapia",
    service_price: "15.00 €",
    price: 15.0,
    status: "completed",
    notes: "Cliente atendido no Sábado (Concluído)",
    source: "historical_seed",
    created_at: "2026-09-05T15:00:00.000Z"
  },
  {
    id: "seed_cortebarba_20260907",
    appointment_id: "seed_cortebarba_20260907",
    date: "2026-09-07",
    time: "20:30",
    customer_name: "Cliente Atendido (Corte e Barba Terapia)",
    customer_phone: "910000000",
    service_id: "69e6cea9-c739-4d45-b3c1-c6c304a9958d",
    service_name: "Corte e Barba Terapia",
    service_price: "15.00 €",
    price: 15.0,
    status: "completed",
    notes: "Marcação confirmada no print de Segunda-feira, 7 de Setembro às 20:30",
    source: "historical_seed",
    created_at: "2026-09-07T20:30:00.000Z"
  }
];

/**
 * Lê todos os registos do Livro de Faturação
 */
export function getFinancialLedger() {
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) {
      // Inicializar com seeds históricas
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(INITIAL_HISTORICAL_SEEDS));
      return [...INITIAL_HISTORICAL_SEEDS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...INITIAL_HISTORICAL_SEEDS];

    // Assegurar que as seeds históricas estão sempre presentes se não tiverem sido migradas
    let modified = false;
    INITIAL_HISTORICAL_SEEDS.forEach((seed) => {
      if (!parsed.some((p) => p.id === seed.id || (p.customer_name === seed.customer_name && p.date === seed.date))) {
        parsed.push(seed);
        modified = true;
      }
    });

    if (modified) {
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch (err) {
    console.error("[FinancialLedger] Erro ao ler livro de faturação:", err);
    return [...INITIAL_HISTORICAL_SEEDS];
  }
}

/**
 * Grava o Livro de Faturação com salvaguarda
 */
export function saveFinancialLedger(records) {
  try {
    if (!Array.isArray(records)) return;
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error("[FinancialLedger] Erro ao gravar livro de faturação:", err);
  }
}

/**
 * Sela automaticamente um atendimento concluído no livro de faturação
 */
export function sealCompletedAppointment(appt) {
  if (!appt) return;
  const price = parseLedgerPrice(appt.service_price);
  if (price <= 0 && appt.status !== "completed") return;

  const current = getFinancialLedger();
  const apptId = String(appt.id || "");
  const existingIdx = current.findIndex(
    (item) => item.appointment_id === apptId || (item.id === apptId && apptId.length > 5)
  );

  const entry = {
    id: existingIdx >= 0 ? current[existingIdx].id : `ledger_${apptId || Date.now()}`,
    appointment_id: apptId,
    date: appt.date || new Date().toISOString().split("T")[0],
    time: appt.time || "12:00",
    start_time: appt.start_time || null,
    customer_name: (appt.customer_name || "Cliente").trim(),
    customer_phone: (appt.customer_phone || "").trim(),
    customer_email: (appt.customer_email || "").trim(),
    service_id: appt.service_id || "general",
    service_name: appt.service_name || "Serviço Barbearia",
    service_price: appt.service_price || `${price.toFixed(2)} €`,
    price: price,
    status: "completed",
    notes: appt.customer_notes || appt.notes || "",
    source: "appointment",
    sealed_at: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    current[existingIdx] = { ...current[existingIdx], ...entry };
  } else {
    current.push(entry);
  }

  saveFinancialLedger(current);
}

/**
 * Salva e salvaguarda permanentemente o registo antes de uma marcação ser eliminada da agenda
 */
export function preserveAppointmentBeforeDelete(appt, forceBilling = false) {
  if (!appt) return;
  const isCompleted = appt.status === "completed";
  const price = parseLedgerPrice(appt.service_price);

  // Se já estava concluído, ou se o barbeiro confirmou que foi faturado
  if (isCompleted || forceBilling || price > 0) {
    const current = getFinancialLedger();
    const apptId = String(appt.id || "");
    const exists = current.some(
      (item) => item.appointment_id === apptId || item.id === apptId
    );

    if (!exists) {
      current.push({
        id: `ledger_archived_${apptId || Date.now()}`,
        appointment_id: apptId,
        date: appt.date || new Date().toISOString().split("T")[0],
        time: appt.time || "12:00",
        start_time: appt.start_time || null,
        customer_name: (appt.customer_name || "Cliente").trim(),
        customer_phone: (appt.customer_phone || "").trim(),
        customer_email: (appt.customer_email || "").trim(),
        service_id: appt.service_id || "general",
        service_name: appt.service_name || "Serviço Barbearia",
        service_price: appt.service_price || `${price.toFixed(2)} €`,
        price: price,
        status: "completed",
        notes: appt.customer_notes || appt.notes || "Atendimento preservado da agenda",
        source: "archived_from_agenda",
        sealed_at: new Date().toISOString()
      });
      saveFinancialLedger(current);
    }
  }
}

/**
 * Registar uma Venda Direta / Faturação Balcão (Walk-in / Cliente sem agendamento prévio)
 */
export function recordDirectSale({
  customerName = "Cliente Balcão",
  customerPhone = "",
  serviceName = "Corte de Cabelo",
  price = 10.0,
  date = null,
  time = null,
  notes = "Venda direta balcão"
}) {
  const current = getFinancialLedger();
  const todayStr = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  const numPrice = typeof price === "number" ? price : parseLedgerPrice(price);

  const entry = {
    id: `direct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    appointment_id: null,
    date: date || todayStr,
    time: time || nowTime,
    start_time: new Date().toISOString(),
    customer_name: customerName.trim(),
    customer_phone: customerPhone.trim(),
    service_name: serviceName,
    service_price: `${numPrice.toFixed(2)} €`,
    price: numPrice,
    status: "completed",
    notes: notes,
    source: "direct_sale",
    sealed_at: new Date().toISOString()
  };

  current.push(entry);
  saveFinancialLedger(current);
  return entry;
}

/**
 * Funde as marcações ativas da agenda com o Livro de Faturação
 * Garante que qualquer marcação apagada da agenda que tenha gerado faturação
 * NUNCA desapareça dos cálculos de receita, métricas ou CRM!
 */
export function mergeAppointmentsWithLedger(appointments = []) {
  const ledger = getFinancialLedger();
  const mergedMap = new Map();

  // 1. Inserir itens do Livro de Faturação (Base Imutável)
  ledger.forEach((item) => {
    const key = item.appointment_id || item.id;
    mergedMap.set(key, {
      id: item.appointment_id || item.id,
      customer_name: item.customer_name,
      customer_phone: item.customer_phone,
      customer_email: item.customer_email,
      customer_notes: item.notes,
      service_id: item.service_id,
      service_name: item.service_name,
      service_price: item.service_price || `${(item.price || 0).toFixed(2)} €`,
      service_duration: 30,
      barber_name: "Gabriel Silva",
      date: item.date,
      time: item.time,
      start_time: item.start_time || `${item.date}T${item.time}:00Z`,
      status: "completed",
      is_ledger_record: true,
      created_at: item.sealed_at || item.created_at || new Date().toISOString()
    });
  });

  // 2. Sobrepor ou adicionar marcações ativas de appointments
  if (Array.isArray(appointments)) {
    appointments.forEach((appt) => {
      const key = appt.id;
      // Se a marcação ativa está no ledger e já foi dada como completed, manter ou atualizar
      mergedMap.set(key, {
        ...appt,
        is_ledger_record: false
      });

      // Se a marcação ativa tem status completed, selar no ledger em background
      if (appt.status === "completed") {
        sealCompletedAppointment(appt);
      }
    });
  }

  return Array.from(mergedMap.values());
}

/**
 * Gestão de Clientes Arquivados no CRM (ocultar sem apagar histórico)
 */
export function getArchivedClients() {
  try {
    const raw = localStorage.getItem(ARCHIVED_CLIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleArchiveClient(clientKey) {
  try {
    const list = getArchivedClients();
    const idx = list.indexOf(clientKey);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(clientKey);
    }
    localStorage.setItem(ARCHIVED_CLIENTS_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

/**
 * Exportador de Relatório Financeiro para CSV (Excel)
 */
export function exportFinancialReportCSV(items = []) {
  try {
    const headers = ["Data", "Hora", "Cliente", "Telemovel", "Servico", "Valor (EUR)", "Estado", "Origem"];
    const rows = items.map((item) => [
      item.date || "",
      item.time || "",
      `"${(item.customer_name || "Cliente").replace(/"/g, '""')}"`,
      `"${item.customer_phone || ""}"`,
      `"${(item.service_name || "Serviço").replace(/"/g, '""')}"`,
      parseLedgerPrice(item.service_price).toFixed(2),
      item.status === "completed" ? "Concluído" : item.status || "",
      item.is_ledger_record ? "Histórico Protegido" : "Agenda"
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `faturacao_rotadocorte_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("[FinancialLedger] Erro ao exportar CSV:", err);
  }
}
