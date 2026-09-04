-- ==============================================================================
-- P&D BOOKING SYSTEM / ROTA DO CORTE (SIMPLIFIED SINGLE-BARBER MULTI-TENANT)
-- MIGRATION 001: Clean Database Schema & Concurrency Exclusion Constraints
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Drop existing tables for a clean, lean schema
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS blocked_slots CASCADE;
DROP TABLE IF EXISTS breaks CASCADE;
DROP TABLE IF EXISTS business_hours CASCADE;
DROP TABLE IF EXISTS barber_schedules CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS barbershops CASCADE;
DROP TABLE IF EXISTS shops CASCADE;

-- 3. Shops (Multi-tenant foundation)
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    timezone TEXT DEFAULT 'Europe/Lisbon' NOT NULL,
    slot_interval_minutes INT DEFAULT 30 NOT NULL, -- 30 minutes slots
    min_notice_hours INT DEFAULT 1 NOT NULL,
    max_advance_days INT DEFAULT 30 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    badge TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Business Hours (Recurring weekly schedule)
-- day_of_week: 0=Sunday, 1=Monday ... 6=Saturday
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_open BOOLEAN DEFAULT true NOT NULL,
    CONSTRAINT unique_shop_day UNIQUE (shop_id, day_of_week)
);

-- 6. Recurring Breaks (e.g. Lunch 13:00 - 14:00)
CREATE TABLE breaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    name TEXT DEFAULT 'Almoço',
    CONSTRAINT valid_break_time CHECK (end_time > start_time)
);

-- 7. Blocked Slots (Manual exceptions, holidays, day-offs)
CREATE TABLE blocked_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT valid_block_range CHECK (end_time > start_time)
);

-- 8. Appointments (Atomic Bookings)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    notes TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'confirmed' NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT valid_appointment_range CHECK (end_time > start_time)
);

-- 9. 🔥 ATOMIC EXCLUSION CONSTRAINT: ZERO DOUBLE-BOOKING
-- Prevents overlapping active bookings for the shop at the database engine level!
ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
    shop_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status != 'cancelled');

-- 10. Indexes
CREATE INDEX idx_appointments_shop_start ON appointments (shop_id, start_time);
CREATE INDEX idx_services_shop_active ON services (shop_id, is_active, sort_order);
CREATE INDEX idx_blocked_slots_shop ON blocked_slots (shop_id, start_time, end_time);

-- 11. Row Level Security (RLS)
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Public Anon Read Policies (Catalog only)
CREATE POLICY "Public can view active shops"
ON shops FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Public can view active services"
ON services FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Public can view business hours"
ON business_hours FOR SELECT TO anon, authenticated
USING (is_open = true);

CREATE POLICY "Public can view breaks"
ON breaks FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Public can view blocked slots"
ON blocked_slots FOR SELECT TO anon, authenticated
USING (true);

-- Authenticated Shop Admin Policy
CREATE POLICY "Shop owners can manage appointments"
ON appointments FOR ALL TO authenticated
USING (true) WITH CHECK (true);
