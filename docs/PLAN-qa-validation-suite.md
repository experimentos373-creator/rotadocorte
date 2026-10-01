# PLAN-qa-validation-suite.md — Plano Mestre de Verificação, Validação e Testes
**Projeto:** Rota do Corte (Barbearia Gabriel Silva • Paião)  
**Objetivo:** Garantir integridade 100% à prova de falhas em todos os fluxos críticos (Agendamentos, WhatsApp do Grupo, Admin, Faturação e Calendário) sem risco de regressão.

---

## 🎯 1. Visão Geral & Problema Abordado
Recentemente, alterações de código para evitar duplicações de mensagens geraram uma regressão silenciosa (`msg is not defined` no motor de notificações), impedindo o envio de alertas para o grupo oficial da barbearia.

Este plano define uma **Bateria de Testes Abrangente (Automática e Manual)** e um **Quality Gate** permanente que impede que qualquer alteração entre em produção sem passar por validação rigorosa de ponta a ponta.

---

## 🧱 2. Matriz dos 6 Pilares de Validação

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ROTA DO CORTE QUALITY SUITE                     │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│ 1. MOTOR DE VAGAS│ 2. WHATSAPP & CRM│ 3. AGENDAMENTO   │ 4. PAINEL ADM │
│ • Horários/Almoço│ • Green-API Grupo│ • Validação Form │ • PIN Auth    │
│ • Bloqueios 1h   │ • Payload Schema │ • Supabase RPC   │ • Bloq Horário│
│ • Multi-Serviço  │ • wa.me 1-Clique │ • Calendário ICS │ • Fecho Caixa │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
```

---

## 📋 3. Especificação Detalhada por Módulo

### Pilar 1: Motor de Agendamento (`src/lib/bookingEngine.js`)
- [ ] **1.1 Regras de Abertura:**
  - Segunda-feira: 13:00 às 22:00 (último slot 21:30).
  - Terça a Sexta: 10:00 às 22:00 (pausa almoço 13:00–14:00 respeitada).
  - Sábado: 10:00 às 18:00 (pausa almoço 13:00–14:00 respeitada, último slot 17:30).
  - Domingo: Fechado (0 vagas).
- [ ] **1.2 Antecedência Mínima (1h):**
  - Vagas anteriores à hora atual + 1 hora no próprio dia devem aparecer bloqueadas/desabilitadas.
- [ ] **1.3 Proteção Multi-Slot (Consectutivos):**
  - Marcações de 60 min (2 slots), 90 min (3 slots) ou 120 min (4 slots) devem exigir slots contíguos livres.
  - Se um slot intermediário estiver ocupado, o slot inicial deve ser desativado com etiqueta `"Requer X min livres"`.

### Pilar 2: Notificações WhatsApp & Green-API
- [ ] **2.1 Saúde da Instância Green-API:**
  - Consulta automática ao `getStateInstance`: deve retornar `"authorized"`.
- [ ] **2.2 Contrato do Payload de Mensagem:**
  - Validação de que todas as variáveis (`clientName`, `phone`, `serviceName`, `servicePrice`, `dateFormatted`, `time`, `notes`) estão definidas antes da serialização.
  - Zero dependência de variáveis globais não declaradas.
- [ ] **2.3 Disparo do Grupo Oficial (`120363412598827459@g.us`):**
  - Confirmação de que o `chatId` aponta com precisão para o grupo e recebe `idMessage` válido.
  - Proteção contra duplicação de mensagens no privado (apenas 1 alerta por marcação no grupo).
- [ ] **2.4 Link 1-Clique do Cliente (`buildWhatsAppMessage`):**
  - Validação da URL `https://wa.me/351935190491?text=...` contendo os dados corretos e caracteres codificados com segurança (`encodeURIComponent`).

### Pilar 3: Persistência & Calendário
- [ ] **3.1 Supabase RPC `book_appointment`:**
  - Inserção com sucesso de cliente, data, hora e serviço.
  - Proteção de concorrência (se dois clientes tentarem o mesmo slot em simultâneo, o segundo recebe aviso de conflito amigável).
- [ ] **3.2 Fallback LocalStorage:**
  - Se a ligação ao Supabase falhar, o agendamento é preservado localmente e sincronizado logo que restabelecida a rede.
- [ ] **3.3 Exportação de Calendário:**
  - Link Google Calendar gerado com formato de data ISO sem separadores.
  - Ficheiro `.ics` descarregável com carimbo UTC e compatível com Apple Calendar (iOS) e Outlook.

### Pilar 4: Painel Administrativo (`/admin` / `AdminAgenda.jsx`)
- [ ] **4.1 Autenticação e Segurança:**
  - Bloqueio por PIN (`2026`). Sessão segura e logout automático após inatividade.
- [ ] **4.2 Gestão de Estados de Marcações:**
  - Transição de estados: Pendente → Confirmado → Concluído → Cancelado.
  - Atualização em tempo real via Supabase realtime channel (`rotadocorte-appointments-changes`).
- [ ] **4.3 Bloqueio de Horário Personalizado:**
  - Verificação do modal de pausa de horário com `startTime`, `endTime` e `pin`.
- [ ] **4.4 Portão de Validação de Marcações Passadas:**
  - Popup de validação obrigatória quando existirem 4 ou mais marcações passadas pendentes, com botão de fechar (X) e adiar.

### Pilar 5: Motor Financeiro & Analytics (`src/lib/financialLedger.js`)
- [ ] **5.1 Cálculo de Faturação Diária, Semanal e Mensal:**
  - Soma exata de preços de serviços concluídos.
  - Agrupamento semanal sem duplicação de valores.
- [ ] **5.2 Gráficos de Gestão:**
  - Gráfico de barras de "Dias Mais Ativos" e gráfico de donut de "Mix de Serviços" sincronizados com o período selecionado.
- [ ] **5.3 Fecho de Caixa:**
  - Resumo de faturação para exportação direta em WhatsApp ou impressão.

### Pilar 6: Build & Continuous Quality Gate
- [ ] **6.1 Compilação de Produção:**
  - `npm run build` (Vite + React) com 0 erros e 0 warnings impeditivos.
- [ ] **6.2 Script Automatizado de Verificação Completa:**
  - Criação de `npm test` acionando um runner automático de testes (`node scripts/test-system.js`) que valida a cadeia inteira em menos de 5 segundos.

---

## 🚀 4. Plano de Execução por Fases

| Fase | Foco | Ações Concretas |
| :--- | :--- | :--- |
| **Fase 1** | **Automação de Testes** | Expandir `scripts/test-system.js` com testes unitários e de integração para o motor de WhatsApp, agendamento e finanças. Adicionar comando `npm test`. |
| **Fase 2** | **Blindagem de Notificações** | Implementar validação estrita no payload do Green-API com fallback em memória e log de diagnóstico visível no painel admin. |
| **Fase 3** | **Checklist Manual de Ponta a Ponta** | Executar o fluxo completo no navegador: Criar agendamento real de teste → Confirmar notificação no grupo → Verificar no Admin → Concluir marcação → Validar métricas financeiras. |
| **Fase 4** | **Documentação & Quality Gate** | Atualizar `README.md` e criar rotina de pré-deploy que bloqueia commits caso o teste falhe. |

---

## 🛡️ 5. Critérios de Sucesso (Definition of Done)
1. `npm test` executa com **100% de sucesso** em todos os testes.
2. Cada nova marcação realizada no website gera instantaneamente uma mensagem no grupo oficial de WhatsApp (`120363412598827459@g.us`) com dados completos.
3. Nenhuma alteração futura de código em qualquer parte do sistema poderá quebrar o motor de notificações sem que o teste alerte previamente.
