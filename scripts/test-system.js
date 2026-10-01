import { createClient } from "@supabase/supabase-js";
import {
  generateAvailableSlots,
  buildWhatsAppMessage,
  buildAdminWhatsAppNotificationMessage,
  sendAdminWhatsAppNotification,
  buildGoogleCalendarUrl
} from "../src/lib/bookingEngine.js";
import { parseLedgerPrice } from "../src/lib/financialLedger.js";

const SUPABASE_URL = "https://vvucnqnyynydjccfqnor.supabase.co";
const SUPABASE_KEY = "sb_publishable_7HteCWain-w3xhd8o2hwSA_p33weMaJ";
const ADMIN_PIN = "2026";

const GREEN_API_URL = "https://7107.api.greenapi.com";
const GREEN_API_ID = "710722740665";
const GREEN_API_TOKEN = "6aafbc5f8161432fb8342fc5ab5c20533dde6e794dfc406987";
const GREEN_API_GROUP_ID = "120363412598827459@g.us";

const GABRIEL_PHONE = "351935190491";

const isLiveWhatsAppTest = process.argv.includes("--live");

async function runTests() {
  console.log("==================================================");
  console.log("🧪 INICIANDO BATERIA COMPLETA DE TESTES DO SISTEMA");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // ----------------------------------------------------
  // TESTE 1: Conexão e Leitura da Base de Dados Supabase (Live RPC)
  // ----------------------------------------------------
  console.log("1️⃣ [SUPABASE] A testar ligação à base de dados de produção (RPC admin_get_appointments)...");
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase.rpc("admin_get_appointments", {
      p_admin_pin: ADMIN_PIN,
      p_shop_slug: "rotadocorte"
    });

    if (error || !data?.success) {
      console.error("   ❌ Erro ao consultar appointments:", error?.message || data?.error);
      failed++;
    } else {
      const appts = data.appointments || [];
      console.log(`   ✅ Ligação Supabase OK! Encontrados ${appts.length} agendamentos reais na base de dados.`);
      if (appts.length > 0) {
        console.log(`   Último agendamento real: ${appts[0].customer_name} - ${appts[0].service_name} (${appts[0].start_time})`);
      }
      passed++;
    }

    // Testar RPC de consulta de vagas em tempo real
    const { data: rpcSlots, error: rpcErr } = await supabase.rpc("get_available_slots", {
      p_shop_slug: "rotadocorte",
      p_date: "2026-09-22",
      p_service_id: "corte-tradicional"
    });

    if (rpcErr || !Array.isArray(rpcSlots)) {
      console.error("   ❌ Erro no RPC get_available_slots:", rpcErr?.message);
      failed++;
    } else {
      console.log(`   ✅ RPC get_available_slots OK! Retornou ${rpcSlots.length} vagas para terça-feira.`);
      passed++;
    }
  } catch (err) {
    console.error("   ❌ Exceção ao ligar ao Supabase:", err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TESTE 2: Lógica de Horários por Dia da Semana
  // ----------------------------------------------------
  console.log("\n2️⃣ [BOOKING ENGINE] A testar grelha horária por dia da semana...");
  try {
    // Test Monday (Segunda-feira) - deve começar às 13:00 e terminar às 22:00
    const mondaySlots = generateAvailableSlots({ date: "2026-09-21" });
    const mondayFirst = mondaySlots[0]?.time;
    const mondayLast = mondaySlots[mondaySlots.length - 1]?.time;
    console.log(`   Segunda-feira (2026-09-21): ${mondaySlots.length} vagas. Primeiro: ${mondayFirst}, Último: ${mondayLast}`);
    
    if (mondayFirst === "13:00" && mondayLast === "21:30") {
      console.log("   ✅ Segunda-feira abre às 13:00 e fecha às 22:00 (último slot 21:30)");
      passed++;
    } else {
      console.error(`   ❌ Horário de segunda inválido: ${mondayFirst} a ${mondayLast}`);
      failed++;
    }

    // Test Saturday (Sábado) - deve fechar às 18:00 (último slot 17:30) com almoço 13:00-14:00
    const saturdaySlots = generateAvailableSlots({ date: "2026-09-26" });
    const satFirst = saturdaySlots[0]?.time;
    const satLast = saturdaySlots[saturdaySlots.length - 1]?.time;
    const hasSatLunch = saturdaySlots.some(s => s.time === "13:00" || s.time === "13:30");
    console.log(`   Sábado (2026-09-26): ${saturdaySlots.length} vagas. Primeiro: ${satFirst}, Último: ${satLast}, Almoço 13:00-14:00 excluído: ${!hasSatLunch}`);
    
    if (satFirst === "10:00" && satLast === "17:30" && !hasSatLunch) {
      console.log("   ✅ Sábado funciona das 10:00 às 18:00 com pausa de almoço respeitada");
      passed++;
    } else {
      console.error("   ❌ Horário de sábado incorreto");
      failed++;
    }

    // Test Sunday (Domingo) - deve ter 0 vagas
    const sundaySlots = generateAvailableSlots({ date: "2026-09-27" });
    console.log(`   Domingo (2026-09-27): ${sundaySlots.length} vagas.`);
    if (sundaySlots.length === 0) {
      console.log("   ✅ Domingo encerrado com 0 vagas");
      passed++;
    } else {
      console.error("   ❌ Domingo deveria ter 0 vagas mas tem:", sundaySlots.length);
      failed++;
    }
  } catch (err) {
    console.error("   ❌ Exceção ao testar horários:", err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TESTE 3: Multi-Slot Engine (Proteção de Vagas Consecutivas)
  // ----------------------------------------------------
  console.log("\n3️⃣ [MULTI-SLOT ENGINE] A testar proteção de vagas consecutivas (1 a 4 pessoas)...");
  try {
    const existingBookings = [
      { date: "2026-09-22", time: "15:30", status: "confirmed", duration: 30 }
    ];

    const slots2Persons = generateAvailableSlots({
      date: "2026-09-22",
      existingBookings,
      requiredSlots: 2 // 60 minutos
    });

    const slot1500 = slots2Persons.find(s => s.time === "15:00");
    const slot1530 = slots2Persons.find(s => s.time === "15:30");
    const slot1600 = slots2Persons.find(s => s.time === "16:00");

    console.log("   Cenário: 15:30 ocupado. Cliente seleciona 2 pessoas (60 min):");
    console.log(`     - 15:00 disponível? ${slot1500?.available} (Motivo: "${slot1500?.reasonLabel || slot1500?.reason}")`);
    console.log(`     - 15:30 disponível? ${slot1530?.available} (Motivo: "${slot1530?.reason}")`);
    console.log(`     - 16:00 disponível? ${slot1600?.available}`);

    if (!slot1500?.available && slot1500?.reasonLabel?.includes("60 min")) {
      console.log("   ✅ SUCESSO: 15:00 foi bloqueado com precisão pois 15:30 estava ocupado!");
      passed++;
    } else {
      console.error("   ❌ Falha na proteção de slots consecutivos para 2 pessoas");
      failed++;
    }

    // Testar colisão com almoço para 2 pessoas às 12:30 (13:00 é almoço)
    const slot1230 = slots2Persons.find(s => s.time === "12:30");
    console.log("   Cenário: 12:30 para 2 pessoas (13:00 é almoço):");
    console.log(`     - 12:30 disponível? ${slot1230?.available} (Motivo: "${slot1230?.reasonLabel || slot1230?.reason}")`);
    if (!slot1230?.available && slot1230?.reasonLabel?.includes("60 min")) {
      console.log("   ✅ SUCESSO: 12:30 bloqueado para 2 pessoas porque colide com almoço às 13:00!");
      passed++;
    } else {
      console.error("   ❌ Falha na proteção de intervalo de almoço para slots múltiplos");
      failed++;
    }

    // Testar limite de fecho de sábado para 4 pessoas (16:30 requer 2h -> 18:30 mas fecha às 18:00)
    const satSlots4Persons = generateAvailableSlots({
      date: "2026-09-26",
      requiredSlots: 4 // 120 minutos
    });
    const sat1630 = satSlots4Persons.find(s => s.time === "16:30");
    console.log("   Cenário: Sábado às 16:30 para 4 pessoas (fecha às 18:00):");
    console.log(`     - 16:30 disponível? ${sat1630?.available} (Motivo: "${sat1630?.reasonLabel || sat1630?.reason}")`);
    if (!sat1630?.available && sat1630?.reasonLabel?.includes("120 min")) {
      console.log("   ✅ SUCESSO: 16:30 de sábado bloqueado para 4 pessoas pois ultrapassa as 18:00!");
      passed++;
    } else {
      console.error("   ❌ Falha na proteção de fecho de sábado para 4 pessoas");
      failed++;
    }

  } catch (err) {
    console.error("   ❌ Exceção ao testar lógicas de booking:", err);
    failed++;
  }

  // ----------------------------------------------------
  // TESTE 4: Instância do Green-API WhatsApp
  // ----------------------------------------------------
  console.log("\n4️⃣ [WHATSAPP] A testar estado da instância Green-API...");
  try {
    const stateUrl = `${GREEN_API_URL}/waInstance${GREEN_API_ID}/getStateInstance/${GREEN_API_TOKEN}`;
    const res = await fetch(stateUrl);
    const json = await res.json();
    console.log(`   Resposta Green-API:`, json);

    if (json.stateInstance === "authorized") {
      console.log("   ✅ Instância WhatsApp Green-API está AUTORIZADA e ATIVA!");
      passed++;
    } else {
      console.warn(`   ⚠️ Estado da instância: ${json.stateInstance}`);
      failed++;
    }
  } catch (err) {
    console.error("   ❌ Erro ao consultar Green-API:", err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TESTE 5: Formatação da Mensagem WhatsApp para o Gabriel (1-Clique)
  // ----------------------------------------------------
  console.log("\n5️⃣ [WHATSAPP LINK] A testar gerador do link WhatsApp do Cliente (1-Clique)...");
  try {
    const encodedMsg = buildWhatsAppMessage({
      serviceName: "Corte Tradicional + Barba",
      servicePrice: "27,00 €",
      dateFormatted: "sábado, 26 de setembro",
      time: "15:00 – 16:00",
      clientName: "João Silva",
      phone: "+351 912 345 678",
      notes: "2 cortes (pai e filho)"
    });

    const decodedMsg = decodeURIComponent(encodedMsg);
    const fullUrl = `https://wa.me/${GABRIEL_PHONE}?text=${encodedMsg}`;

    if (
      fullUrl.includes(GABRIEL_PHONE) &&
      decodedMsg.includes("João Silva") &&
      decodedMsg.includes("15:00 – 16:00") &&
      !decodedMsg.includes("undefined")
    ) {
      console.log("   ✅ Mensagem pré-formatada do cliente está perfeita e direcionada para o Gabriel (+351 935 190 491)!");
      passed++;
    } else {
      console.error("   ❌ Falha na composição da mensagem WhatsApp do cliente");
      failed++;
    }
  } catch (err) {
    console.error("   ❌ Erro ao testar gerador de link WhatsApp:", err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TESTE 6: Contrato e Disparo do Grupo WhatsApp (Green-API)
  // ----------------------------------------------------
  console.log("\n6️⃣ [WHATSAPP GROUP ALERT] A validar contrato e despacho para o grupo...");
  try {
    const testPayload = {
      serviceName: "Corte Tradicional",
      servicePrice: "15,00 €",
      dateFormatted: "sexta-feira, 2 de outubro",
      time: "14:30",
      clientName: "Cliente Teste",
      phone: "+351 912 000 111",
      notes: "Corte sem lavagem"
    };

    const formattedMessage = buildAdminWhatsAppNotificationMessage(testPayload);

    // Validações rigorosas de contrato do texto
    const hasHeader = formattedMessage.includes("ROTA DO CORTE — NOVO AGENDAMENTO!");
    const hasClient = formattedMessage.includes("Cliente Teste");
    const hasPhone = formattedMessage.includes("+351 912 000 111");
    const hasService = formattedMessage.includes("Corte Tradicional (15,00 €)");
    const hasDateTime = formattedMessage.includes("sexta-feira, 2 de outubro às 14:30");
    const hasNotes = formattedMessage.includes("Corte sem lavagem");
    const hasNoUndefined = !formattedMessage.includes("undefined") && !formattedMessage.includes("null");

    if (hasHeader && hasClient && hasPhone && hasService && hasDateTime && hasNotes && hasNoUndefined) {
      console.log("   ✅ Contrato de mensagem do grupo: 100% íntegro (zero campos undefined/nulos)!");
      passed++;
    } else {
      console.error("   ❌ Falha no contrato da mensagem do grupo");
      failed++;
    }

    if (isLiveWhatsAppTest) {
      console.log("   📡 Flag --live detetada: A enviar mensagem real de teste para o grupo...");
      const liveRes = await sendAdminWhatsAppNotification(testPayload);
      if (liveRes.success) {
        console.log("   ✅ Disparo LIVE para o grupo executado com sucesso!");
        passed++;
      } else {
        console.error("   ❌ Falha no disparo LIVE:", liveRes.error);
        failed++;
      }
    } else {
      // Mock de verificação de despacho sem floodar o grupo
      const originalFetch = globalThis.fetch;
      let intercepted = null;
      globalThis.fetch = async (url, opts) => {
        intercepted = { url, body: JSON.parse(opts.body) };
        return { ok: true, json: async () => ({ idMessage: "mock_test_ok" }) };
      };

      const mockRes = await sendAdminWhatsAppNotification(testPayload);
      globalThis.fetch = originalFetch;

      if (
        mockRes.success &&
        intercepted &&
        intercepted.body.chatId === GREEN_API_GROUP_ID &&
        intercepted.body.message.length > 50
      ) {
        console.log(`   ✅ Dispatcher validado: Envio endereçado com precisão ao grupo ${GREEN_API_GROUP_ID}!`);
        passed++;
      } else {
        console.error("   ❌ Falha na simulação de despacho do Green-API");
        failed++;
      }
    }
  } catch (err) {
    console.error("   ❌ Erro ao validar notificação de grupo:", err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TESTE 7: Gerador de Links de Calendário Google
  // ----------------------------------------------------
  console.log("\n7️⃣ [CALENDAR] A testar gerador de link Google Calendar...");
  try {
    const gcalUrl = buildGoogleCalendarUrl({
      serviceName: "Corte & Barba",
      date: "2026-10-05",
      time: "15:00",
      durationMinutes: 45
    });

    if (
      gcalUrl.startsWith("https://calendar.google.com/calendar/render?action=TEMPLATE") &&
      gcalUrl.includes("Rota%20do%20Corte") &&
      gcalUrl.includes("20261005")
    ) {
      console.log("   ✅ Link Google Calendar gerado com conformidade ISO!");
      passed++;
    } else {
      console.error("   ❌ Link Google Calendar incorreto:", gcalUrl);
      failed++;
    }
  } catch (err) {
    console.error("   ❌ Erro ao testar link de calendário:", err.message);
    failed++;
  }

  // ----------------------------------------------------
  // TESTE 8: Motor Financeiro & Parser de Preços
  // ----------------------------------------------------
  console.log("\n8️⃣ [FINANCIAL LEDGER] A testar motor financeiro e conversão de preços...");
  try {
    const price1 = parseLedgerPrice("15.00 €");
    const price2 = parseLedgerPrice("12,50 €");
    const price3 = parseLedgerPrice("25€");
    const price4 = parseLedgerPrice(30);

    const total = price1 + price2 + price3 + price4;
    console.log(`   Preços convertidos: ${price1} + ${price2} + ${price3} + ${price4} = ${total} €`);

    if (price1 === 15 && price2 === 12.5 && price3 === 25 && price4 === 30 && total === 82.5) {
      console.log("   ✅ Parser financeiro converte vírgulas, símbolos e números perfeitamente!");
      passed++;
    } else {
      console.error("   ❌ Falha na conversão de preços do ledger financeiro");
      failed++;
    }
  } catch (err) {
    console.error("   ❌ Erro ao testar motor financeiro:", err.message);
    failed++;
  }

  // ----------------------------------------------------
  // RESUMO E STATUS DE SAÍDA (QUALITY GATE)
  // ----------------------------------------------------
  console.log("\n==================================================");
  console.log(`🏁 RESULTADO FINAL DOS TESTES: ${passed} PASSOU | ${failed} FALHOU`);
  console.log("==================================================");

  if (failed > 0) {
    console.error("\n❌ QUALITY GATE: O sistema falhou testes críticos. O deploy foi bloqueado!\n");
    process.exit(1);
  } else {
    console.log("\n🎉 QUALITY GATE: Todos os 8 pilares foram validados com 100% de sucesso!\n");
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Erro fatal durante a execução dos testes:", err);
  process.exit(1);
});
