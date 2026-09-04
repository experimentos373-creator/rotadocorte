# 💈 Rota Do Corte — Website & Sistema de Marcações (P&D Booking)

Website oficial da **Rota Do Corte** (Paião, Figueira da Foz) com sistema de agendamento em tempo real desenvolvido com **React 19, Vite, Tailwind CSS** e **Supabase (PostgreSQL 15+)**.

🌐 **Website Oficial:** [https://rotadocorte.vercel.app/](https://rotadocorte.vercel.app/)  
📋 **Painel do Barbeiro:** [https://rotadocorte.vercel.app/admin](https://rotadocorte.vercel.app/admin)

---

## ✨ Funcionalidades Principais

- ⚡ **Wizard de Agendamento em 5 Passos:**
  1. Seleção de serviço (Corte, Barba Terapia, Combo Premium com preços e durações).
  2. Seleção do dia (calendário com folgas aos domingos).
  3. Seleção de horário (slots a cada 30 minutos calculados dinamicamente).
  4. Dados do cliente (Nome, WhatsApp +351, Notas).
  5. Confirmação instantânea com **1-Click WhatsApp**, **Google Calendar** e **Apple / Outlook Calendar (.ics)**.
- 🛡️ **Zero Double-Booking ao Nível da Base de Dados:** Proteção atómica com `btree_gist` e restrição de exclusão (`tstzrange`) no PostgreSQL.
- 📱 **Painel de Gestão do Barbeiro (`/admin` ou `/agenda`):** Visualização de marcações do dia, métricas de faturação, botão 1-Click WhatsApp ao cliente e marcação manual.
- 🎨 **Design Responsivo & Luxuoso:** Tema escuro refinado com apontamentos em dourado, micro-interações e suporte multi-dispositivo.
- 🔒 **Row Level Security (RLS):** Proteção rigorosa de privacidade de dados dos clientes.

---

## 🚀 Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Build de produção
npm run build
```

---

## 🗄️ Estrutura do Supabase (`/supabase`)

Para ligar a base de dados no Supabase, executa os scripts no **SQL Editor** do projeto:
1. `supabase/001_booking_schema.sql` — Tabelas, RLS e constraints de exclusão.
2. `supabase/002_booking_rpcs.sql` — Funções RPC `get_available_slots` e `book_appointment`.
3. `supabase/003_seed_rotadocorte.sql` — Dados iniciais da barbearia, horários (10h-22h) e serviços.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, Vite, React Router Dom 7, Tailwind CSS 4, Lucide Icons, Canvas Confetti
- **Backend / Database:** Supabase, PostgreSQL 15+, PL/pgSQL, Row Level Security (RLS)
- **Deployment:** Vercel
