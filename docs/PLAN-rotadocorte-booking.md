# 💈 PLAN: P&D Booking Multi-Tenant System & Rota do Corte Integration

> **Agent:** `project-planner` (Collaborating with `database-architect`, `backend-specialist`, `frontend-specialist`, `security-auditor`)  
> **Target Project:** `rotadocorte` & P&D Agency Multi-Tenant Platform  
> **Tech Stack:** Supabase (PostgreSQL 15+, RLS, PL/pgSQL, btree_gist), React 18, Vite, Tailwind CSS, Lucide Icons, Date-fns  
> **Status:** READY FOR REVIEW

---

## 1. Executive Summary & Vision

The objective is to architect and implement a **production-grade, multi-tenant appointment scheduling platform** built on **Supabase** that powers **Rota do Corte** today, and serves as a reusable SaaS white-label product for **P&D Agency** clients tomorrow.

### Key Architectural Pillars
1. **Zero Double-Booking Guarantee:** Database-level concurrency control via PostgreSQL GiST exclusion constraints and atomic transactional booking RPCs.
2. **Dynamic Slot Calculation Engine:** Real-time computation of open slots based on barber working hours, lunch intervals, blocked periods, service duration, and buffers.
3. **High-Converting 6-Step Client Booking Flow:** Smooth, mobile-first booking wizard integrated directly into Rota do Corte's luxurious gold/dark aesthetic.
4. **Barber/Admin Management Dashboard:** Real-time daily agenda, status management (Confirm / Cancel / Reschedule / Complete), and 1-click WhatsApp customer notifications.
5. **Strict Multi-Tenant Row Level Security (RLS):** Complete data isolation by `shop_id` with zero public exposure of customer phone numbers or private records.

---

## 2. Database Architecture & Schema (PostgreSQL)

```
                       ┌──────────────────────┐
                       │     barbershops      │
                       │ (Tenant / Settings)  │
                       └──────────┬───────────┘
                                  │ 1:N
         ┌────────────────────────┼────────────────────────┐
         │ 1:N                    │ 1:N                    │ 1:N
┌────────┴────────┐      ┌────────┴────────┐      ┌────────┴────────┐
│     barbers     │      │    services     │      │  blocked_slots  │
│(Staff / Profile)│      │(Duration/Price) │      │(Holidays/Breaks)│
└────────┬────────┘      └────────┬────────┘      └─────────────────┘
         │ 1:N                    │
┌────────┴────────┐               │
│barber_schedules │               │
│ (Working Hours) │               │
└─────────────────┘               │
         │                        │
         └───────────┬────────────┘
                     │ 1:N
           ┌─────────┴─────────┐
           │   appointments    │
           │(Atomic Bookings)  │
           └───────────────────┘
```

### 2.1 Table Specifications

#### `barbershops` (Tenants)
- `id` (UUID, PK, default `gen_random_uuid()`)
- `slug` (TEXT, UNIQUE) — e.g. `'rotadocorte'`
- `name` (TEXT) — e.g. `'Rota Do Corte'`
- `phone` (TEXT)
- `email` (TEXT)
- `address` (TEXT)
- `timezone` (TEXT, default `'Europe/Lisbon'`)
- `slot_interval_minutes` (INT, default `15`) — granularity of slot starts
- `buffer_minutes` (INT, default `5`) — buffer between cuts for cleanup
- `min_notice_hours` (INT, default `2`) — minimum lead time to book
- `max_advance_days` (INT, default `30`) — how far ahead clients can book
- `created_at` (TIMESTAMPTZ, default `now()`)

#### `barbers` (Staff Members)
- `id` (UUID, PK, default `gen_random_uuid()`)
- `shop_id` (UUID, FK -> `barbershops.id` ON DELETE CASCADE)
- `name` (TEXT) — e.g. `'Gabriel Silva'`
- `email` (TEXT)
- `phone` (TEXT)
- `avatar_url` (TEXT)
- `bio` (TEXT)
- `is_active` (BOOLEAN, default `true`)
- `created_at` (TIMESTAMPTZ, default `now()`)

#### `barber_schedules` (Working Shifts & Lunch Breaks)
- `id` (UUID, PK, default `gen_random_uuid()`)
- `shop_id` (UUID, FK -> `barbershops.id` ON DELETE CASCADE)
- `barber_id` (UUID, FK -> `barbers.id` ON DELETE CASCADE)
- `day_of_week` (INT) — `0` = Sunday, `1` = Monday ... `6` = Saturday
- `start_time` (TIME) — e.g. `'09:00:00'`
- `end_time` (TIME) — e.g. `'19:30:00'`
- `lunch_start` (TIME) — e.g. `'13:00:00'` (nullable)
- `lunch_end` (TIME) — e.g. `'14:30:00'` (nullable)
- `is_working` (BOOLEAN, default `true`)
- `UNIQUE(barber_id, day_of_week)`

#### `services` (Catalog)
- `id` (UUID, PK, default `gen_random_uuid()`)
- `shop_id` (UUID, FK -> `barbershops.id` ON DELETE CASCADE)
- `name` (TEXT) — e.g. `'Corte & Barba & Terapia de Ozono'`
- `description` (TEXT)
- `duration_minutes` (INT) — e.g. `50`
- `price` (NUMERIC(10,2)) — e.g. `24.00`
- `category` (TEXT) — e.g. `'signature'`, `'hair'`, `'beard'`, `'treatment'`
- `is_active` (BOOLEAN, default `true`)
- `sort_order` (INT, default `0`)
- `created_at` (TIMESTAMPTZ, default `now()`)

#### `blocked_slots` (Exceptions / Time-off)
- `id` (UUID, PK, default `gen_random_uuid()`)
- `shop_id` (UUID, FK -> `barbershops.id` ON DELETE CASCADE)
- `barber_id` (UUID, FK -> `barbers.id` ON DELETE CASCADE, nullable if entire shop closed)
- `start_time` (TIMESTAMPTZ)
- `end_time` (TIMESTAMPTZ)
- `reason` (TEXT) — e.g. `'Férias'`, `'Formação'`, `'Feriado Municipal'`
- `created_at` (TIMESTAMPTZ, default `now()`)

#### `appointments` (Bookings)
- `id` (UUID, PK, default `gen_random_uuid()`)
- `shop_id` (UUID, FK -> `barbershops.id` ON DELETE CASCADE)
- `barber_id` (UUID, FK -> `barbers.id` ON DELETE RESTRICT)
- `service_id` (UUID, FK -> `services.id` ON DELETE RESTRICT)
- `customer_name` (TEXT NOT NULL)
- `customer_phone` (TEXT NOT NULL)
- `customer_email` (TEXT)
- `customer_notes` (TEXT)
- `start_time` (TIMESTAMPTZ NOT NULL)
- `end_time` (TIMESTAMPTZ NOT NULL)
- `status` (TEXT NOT NULL default `'confirmed'`) — `'pending'`, `'confirmed'`, `'cancelled'`, `'completed'`, `'no_show'`
- `cancellation_reason` (TEXT)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

---

## 3. Concurrency Protection & Anti-Double-Booking Strategy

### 3.1 PostgreSQL GiST Exclusion Constraint
To make double-booking physically impossible at the database engine level:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_barber_appointments
EXCLUDE USING gist (
  barber_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status != 'cancelled');
```

*Why this is unbeatable:*
- Works across concurrent connections, webhooks, and multiple browser tabs.
- Even if two clients click "Marcar" at the exact same millisecond, PostgreSQL serializes the transaction and rejects the second attempt with error code `23P01` (`exclusion_violation`).

### 3.2 Atomic Stored Procedure: `book_appointment`
Clients invoke a single security-definer RPC function:

```sql
CREATE OR REPLACE FUNCTION book_appointment(
  p_shop_slug TEXT,
  p_service_id UUID,
  p_barber_id UUID,
  p_start_time TIMESTAMPTZ,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
...
-- 1. Validates shop and active service duration
-- 2. If barber_id is null ("Qualquer Barbeiro"), auto-assigns the first available barber
-- 3. Checks working schedule, lunch break, and blocked slots
-- 4. Inserts into appointments
-- 5. Returns formatted appointment payload + WhatsApp confirmation link text
$$;
```

---

## 4. Dynamic Slot Calculation Engine (`get_available_slots`)

Instead of fixed 30-minute grids that fail when services vary (e.g. 20m vs 30m vs 50m), the engine dynamically evaluates slot viability:

```sql
CREATE OR REPLACE FUNCTION get_available_slots(
  p_shop_slug TEXT,
  p_date DATE,
  p_service_id UUID,
  p_barber_id UUID DEFAULT NULL
)
RETURNS TABLE (
  slot_time TIMESTAMPTZ,
  formatted_time TEXT,
  barber_id UUID,
  barber_name TEXT
)
...
```

**Algorithm:**
1. Fetch barber's shift for `p_date` day-of-week (e.g., 09:00 - 19:30).
2. Generate candidate slot timestamps stepping by `slot_interval_minutes` (e.g., 15 min).
3. Candidate slot end = `candidate_start + service.duration_minutes + shop.buffer_minutes`.
4. Discard candidates that:
   - Exceed shift `end_time`
   - Overlap with `lunch_start` to `lunch_end`
   - Overlap with any `blocked_slots`
   - Overlap with existing non-cancelled `appointments` for that barber
5. If `p_barber_id` was not specified (Any Barber), return the distinct times where **at least one** barber is free.

---

## 5. Security & Row Level Security (RLS) Policies

| Table | Anon / Public Role | Authenticated Admin / Barber Role |
|-------|--------------------|-----------------------------------|
| `barbershops` | `SELECT` (active shops) | `ALL` (own shop) |
| `barbers` | `SELECT` (active barbers) | `ALL` (own shop) |
| `barber_schedules`| `SELECT` (active schedules) | `ALL` (own shop) |
| `services` | `SELECT` (active services) | `ALL` (own shop) |
| `blocked_slots` | `SELECT` (future blocked slots) | `ALL` (own shop) |
| `appointments` | ❌ `NO DIRECT ACCESS` (Protected against phone harvesting) | `ALL` (only appointments for their `shop_id`) |

> 🔒 **Privacy Shield:** Public users cannot run `SELECT * FROM appointments` to scrape client names/phone numbers. Public slot checking happens strictly via the sanitized `get_available_slots()` RPC.

---

## 6. Client Experience: 6-Step Wizard for Rota do Corte

```
[ Step 1: SERVIÇO ] ──> [ Step 2: BARBEIRO ] ──> [ Step 3: DATA ]
         │                        │                      │
[ Step 6: SUCESSO ] <── [ Step 5: DADOS ] <── [ Step 4: HORÁRIO ]
```

### Step 1: Seleção de Serviço
- Categorized tabs: *Destaques, Cabelo, Barba, Tratamento de Ozono*.
- Cards featuring: Title, detailed description, duration badge (e.g. `50 min`), price in Gold (`24,00 €`).

### Step 2: Seleção de Barbeiro
- Options:
  - **Gabriel Silva** (Especialista em Ozonioterapia & Visagismo)
  - **Qualquer Profissional Disponível** (Calcula a melhor disponibilidade).

### Step 3: Seleção da Data
- Interactive mini-calendar showing next 30 days.
- Visual status indicators: Closed days (dimmed), Available days (active), Full days (disabled).

### Step 4: Seleção do Horário
- Divided into intuitive buckets:
  - 🌅 *Manhã* (09:00 - 13:00)
  - ☀️ *Tarde* (14:30 - 19:30)
- Dynamic chips showing exact start times calculated for the selected service duration.

### Step 5: Dados do Cliente
- Nome Completo (obrigatório).
- Telemóvel / WhatsApp (+351 por defeito com validação).
- Email (opcional para envio de recibo/calendário).
- Notas ou pedidos especiais (opcional).

### Step 6: Confirmação & Pós-Reserva
- Card de Sucesso Premium com animação de checkmark.
- Resumo completo da reserva (Serviço, Barbeiro, Data, Hora, Localização).
- **Ações imediatas do cliente:**
  - 📅 *Adicionar ao Google Calendar / Apple Calendar* (ficheiro `.ics` / link web).
  - 💬 *Enviar Confirmação por WhatsApp* (botão direto para o WhatsApp da barbearia com texto pré-formatado).
  - 📍 *Como Chegar* (Link Google Maps para Rota do Corte, Paião).

---

## 7. Barber/Admin Management Portal

Accessible via `/admin` or dedicated route with Supabase Auth:

1. **Daily & Weekly Agenda:**
   - Visual timeline showing each barber's appointments column by column.
   - Status badges: `Confirmado` (Verde), `Pendente` (Amarelo), `Concluído` (Azul), `Cancelado` (Vermelho).
2. **Quick Actions:**
   - ⚡ **1-Click WhatsApp:** Enviar lembrete ou confirmação imediata ao cliente com link `wa.me`.
   - 🔄 **Remarcar:** Modal rápido para mover marcação para outro horário/barbeiro.
   - ❌ **Cancelar / Não Compareceu:** Liberta imediatamente o horário na agenda.
   - 🚫 **Bloquear Horário:** Bloquear 1 hora ou a tarde inteira (ex: almoço prolongado, formação).
3. **Gestão de Serviços e Horários:**
   - Ajustar preços, tempos de corte e horários de funcionamento sem tocar em código.

---

## 8. Socratic Questions & Strategic Edge Cases

1. **Notificações Automáticas vs. WhatsApp 1-Click:**
   - *Opção A (Mais rápida & gratuita):* Botão 1-click no portal do barbeiro que abre o WhatsApp Web / App com mensagem pré-formatada.
   - *Opção B (Automática):* Webhook via Supabase Edge Functions + Evolution API / Twilio para disparo automático de SMS/WhatsApp.
   *(Recomendação: Iniciar com Opção A + Webhook preparado para evolução).*

2. **Política de Cancelamento pelo Cliente:**
   - Permitir link seguro no SMS/WhatsApp para o cliente cancelar com antecedência mínima de X horas (ex: 2h).

3. **Multi-Tenant URL Structure:**
   - Rota do Corte: Incorporado diretamente no website `rotadocorte.vercel.app`.
   - Futuros Clientes: `pdbooking.com/barbearia-x` ou domínios personalizados via `slug`.

---

## 9. Implementation Roadmap & Task Breakdown

### Phase 1: Database & Backend Foundation (Supabase)
- [ ] **Task 1.1:** Setup SQL Schema (`barbershops`, `barbers`, `barber_schedules`, `services`, `blocked_slots`, `appointments`).
- [ ] **Task 1.2:** Enable `btree_gist` extension and configure `EXCLUDE` constraint for anti-double-booking.
- [ ] **Task 1.3:** Implement `get_available_slots` and `book_appointment` PL/pgSQL stored procedures.
- [ ] **Task 1.4:** Configure Row Level Security (RLS) policies and security definer functions.
- [ ] **Task 1.5:** Seed initial data for Rota do Corte (Gabriel Silva, 7 serviços oficiais, horários reais de Paião).

### Phase 2: Frontend Integration in `rotadocorte`
- [ ] **Task 2.1:** Install `@supabase/supabase-js` and configure Supabase client singleton (`src/lib/supabase.js`).
- [ ] **Task 2.2:** Re-architect `BookingModal.jsx` into the modern 6-Step Booking Wizard.
- [ ] **Task 2.3:** Implement real-time slot fetching and reactive availability indicators.
- [ ] **Task 2.4:** Build Step 6 Confirmation screen with `.ics` calendar generator and WhatsApp confirmation builder.

### Phase 3: Barber Admin Dashboard
- [ ] **Task 3.1:** Create `/admin` login and agenda view component.
- [ ] **Task 3.2:** Implement daily timeline with live appointment status controls.
- [ ] **Task 3.3:** Add manual slot blocking interface for barbers.

### Phase 4: Verification & Stress Testing
- [ ] **Task 4.1:** Concurrency stress test (simulating 2 simultaneous requests for the same slot to prove zero double-booking).
- [ ] **Task 4.2:** End-to-end mobile UX audit on smartphones.
- [ ] **Task 4.3:** Deploy to Vercel and verify live production sync.
