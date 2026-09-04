# Plano de Evolução: Barber Studio OS & Dashboard de Estatísticas Avançadas

> **Objetivo:** Transformar o painel atual da Rota do Corte num sistema de gestão (OS) completo para barbearias, dotado de métricas financeiras multi-período, análise de ocupação, ranking de serviços, bloqueio de horários e mini-CRM de clientes.

---

## 1. Auditoria do Estado Atual (O que já existe vs O que falta)

### ✅ O que já temos implementado com sucesso:
- **Gestão Operacional do Dia:** Agenda diária com navegação entre datas ("Hoje", "Anterior", "Seguinte").
- **Métricas Básicas do Dia:** Total de marcações, Confirmadas, Concluídas, Faturação Concluída e Faturação Prevista do dia selecionado.
- **Pesquisa e Filtros Rápidos:** Pesquisa por nome, telemóvel e serviço; filtros por estado (*Todos*, *Confirmados*, *Concluídos*, *Cancelados*).
- **Criação & Edição Total:** Marcação manual e edição pós-agendamento (alteração de cliente, data, slot de 30m, serviço, estado e notas).
- **Ações Rápidas:** Confirmação por WhatsApp em 1 clique, conclusão de atendimento e eliminação.

---

### 🚀 O que falta para ser uma Dashboard Completa e de Elite:

| Funcionalidade | Descrição & Utilidade Real |
| :--- | :--- |
| **1. Seletor de Período Temporal** | Alternar métricas entre **Hoje**, **Esta Semana**, **Este Mês** e **Últimos 30 Dias** (em vez de ver apenas o dia isolado). |
| **2. Métricas de Negócio & Performance** | • **Ticket Médio (€/cliente)**<br>• **Taxa de Ocupação da Cadeira (%)**<br>• **Taxa de Conclusão vs Cancelamentos (%)** |
| **3. Ranking de Serviços & Receita** | Gráfico/barra de percentagem dos serviços mais procurados e rentáveis (ex: Barbaterapia vs Corte Tradicional). |
| **4. Picos de Horário (Peak Hours)** | Indicador dos horários com maior procura da barbearia (ex: 17:00 – 20:00). |
| **5. Bloqueio de Horários / Ausências** | Ferramenta para o barbeiro bloquear rapidamente uma tarde, 1 hora de almoço prolongada ou dia de folga. |
| **6. Mini-CRM / Histórico do Cliente** | Cartão com histórico de visitas do cliente, frequência média e notas de preferências de corte. |
| **7. Fecho de Caixa & Exportação** | Resumo diário/semanal exportável para WhatsApp ou impressão com o resumo de faturação. |

---

## 2. Arquitetura Proposta para a Nova Dashboard

```text
                               ┌─────────────────────────────┐
                               │     Painel do Barbeiro      │
                               └──────────────┬──────────────┘
                                              │
              ┌───────────────────────────────┼──────────────────────────────┐
              ▼                               ▼                              ▼
     [ 📊 Tab Estatísticas ]         [ 📅 Tab Agenda & Slots ]       [ 👥 Tab Mini-CRM ]
     • Faturação Mês / Semana        • Timeline Interativa           • Lista de Clientes VIP
     • Ticket Médio (€)              • Criar / Editar Marcação       • Total Gasto & Frequência
     • Taxa de Ocupação (%)          • Bloquear Horário/Pausa        • Último Corte & Notas
     • Ranking Serviços              • Contacto WhatsApp 1-Clique
```

---

## 3. Fases de Implementação

### Fase 1: Motor de Métricas & Seletor de Período (Dia / Semana / Mês)
- Adicionar abas/filtros de período temporal: `Hoje` | `Esta Semana` | `Este Mês` | `Últimos 30 Dias`.
- Cálculos agregados:
  - Faturação Realizada Acumulada
  - Faturação Prevista Acumulada
  - Ticket Médio por Cliente
  - Taxa de Conclusão / No-Show Rate

### Fase 2: Visualização de Estatísticas & Gráficos Elegantes
- Componente de **Mix de Serviços**: percentagem de vendas por cada corte/tratamento.
- Indicador de **Horários de Pico**: quais os períodos com maior taxa de ocupação.
- Comparativo com a semana anterior (+X% vs semana passada).

### Fase 3: Ferramenta de Bloqueio de Horários (Time Off / Pausas)
- Botão no cabeçalho: `+ Bloquear Horário`.
- Permite selecionar início e fim (ex: 13:00 - 15:00) e motivo ("Formação", "Assuntos Pessoais", "Almoço").
- O horário bloqueado fica automaticamente indisponível no agendamento público e sinalizado a cinzento na agenda.

### Fase 4: Mini-CRM de Clientes Frequentes
- Painel lateral ou aba de clientes com pesquisa.
- Exibição de: número de visitas, valor total gasto, último serviço realizado e notas acumuladas.

---

## 4. Critérios de Sucesso e Verificação
1. As estatísticas agregam corretamente os dados de múltiplos dias (Semana e Mês).
2. O cálculo de Ticket Médio e Taxas é exato.
3. Bloqueio de horários reflete-se na API pública do Supabase e no BookingModal.
4. Interface permanece 100% responsiva em telemóveis e computadores com visual dark luxury sem biblioteca pesada desnecessária.
