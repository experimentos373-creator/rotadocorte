-- ==============================================================================
-- P&D BOOKING SYSTEM / ROTA DO CORTE (SIMPLIFIED SINGLE-BARBER MULTI-TENANT)
-- MIGRATION 002: Dynamic 30-Minute Slot Engine & Atomic Booking RPC
-- ==============================================================================

-- 1. FUNCTION: get_available_slots
-- Generates slots at 30-minute intervals, returning full grid with is_available flag
CREATE OR REPLACE FUNCTION get_available_slots(
    p_shop_slug TEXT,
    p_date DATE,
    p_service_id UUID
)
RETURNS TABLE (
    slot_time TIMESTAMPTZ,
    formatted_time TEXT,
    is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shop_id UUID;
    v_timezone TEXT;
    v_interval_min INT := 30; -- Strictly 30-minute intervals
    v_min_notice_hrs INT;
    v_service_duration INT;
    v_day_of_week INT;
    v_hours RECORD;
    v_slot_start TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
    v_shift_start TIMESTAMPTZ;
    v_shift_end TIMESTAMPTZ;
    v_earliest_allowed TIMESTAMPTZ;
    v_is_conflict BOOLEAN;
BEGIN
    -- 1. Get Shop Info
    SELECT id, timezone, min_notice_hours
    INTO v_shop_id, v_timezone, v_min_notice_hrs
    FROM shops
    WHERE slug = p_shop_slug AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Shop with slug % not found or inactive', p_shop_slug;
    END IF;

    v_timezone := COALESCE(v_timezone, 'Europe/Lisbon');
    v_min_notice_hrs := COALESCE(v_min_notice_hrs, 1);

    -- 2. Get Service Duration
    SELECT duration_minutes
    INTO v_service_duration
    FROM services
    WHERE id = p_service_id AND shop_id = v_shop_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service % not found or inactive in this shop', p_service_id;
    END IF;

    -- 3. Day of week & schedule check
    v_day_of_week := EXTRACT(DOW FROM p_date);
    v_earliest_allowed := now() + (v_min_notice_hrs || ' hours')::INTERVAL;

    SELECT start_time, end_time, is_open
    INTO v_hours
    FROM business_hours
    WHERE shop_id = v_shop_id AND day_of_week = v_day_of_week;

    IF NOT FOUND OR v_hours.is_open = false THEN
        -- Closed on this day (e.g. Sunday)
        RETURN;
    END IF;

    -- Shift boundaries in shop timezone
    v_shift_start := (p_date || ' ' || v_hours.start_time)::TIMESTAMP AT TIME ZONE v_timezone;
    v_shift_end   := (p_date || ' ' || v_hours.end_time)::TIMESTAMP AT TIME ZONE v_timezone;

    -- 4. Generate candidate slots every 30 minutes
    v_slot_start := v_shift_start;

    WHILE v_slot_start + (v_service_duration || ' minutes')::INTERVAL <= v_shift_end LOOP
        v_slot_end := v_slot_start + (v_service_duration || ' minutes')::INTERVAL;

        -- Check A: Skip past times if today
        IF v_slot_start < v_earliest_allowed THEN
            v_slot_start := v_slot_start + (v_interval_min || ' minutes')::INTERVAL;
            CONTINUE;
        END IF;

        -- Check B: Overlap with recurring breaks (e.g. Lunch)
        SELECT EXISTS (
            SELECT 1 FROM breaks b
            WHERE b.shop_id = v_shop_id
              AND b.day_of_week = v_day_of_week
              AND (tstzrange(v_slot_start, v_slot_end, '[)') && 
                   tstzrange(
                     (p_date || ' ' || b.start_time)::TIMESTAMP AT TIME ZONE v_timezone,
                     (p_date || ' ' || b.end_time)::TIMESTAMP AT TIME ZONE v_timezone,
                     '[)'
                   ))
        ) INTO v_is_conflict;

        IF v_is_conflict THEN
            v_slot_start := v_slot_start + (v_interval_min || ' minutes')::INTERVAL;
            CONTINUE;
        END IF;

        -- Check C: Overlap with manual blocked slots / day offs
        SELECT EXISTS (
            SELECT 1 FROM blocked_slots bs
            WHERE bs.shop_id = v_shop_id
              AND (tstzrange(v_slot_start, v_slot_end, '[)') && tstzrange(bs.start_time, bs.end_time, '[)'))
        ) INTO v_is_conflict;

        IF v_is_conflict THEN
            slot_time := v_slot_start;
            formatted_time := to_char(v_slot_start AT TIME ZONE v_timezone, 'HH24:MI');
            is_available := false;
            RETURN NEXT;
            v_slot_start := v_slot_start + (v_interval_min || ' minutes')::INTERVAL;
            CONTINUE;
        END IF;

        -- Check D: Overlap with existing active appointments
        SELECT EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.shop_id = v_shop_id
              AND a.status != 'cancelled'
              AND (tstzrange(v_slot_start, v_slot_end, '[)') && tstzrange(a.start_time, a.end_time, '[)'))
        ) INTO v_is_conflict;

        slot_time := v_slot_start;
        formatted_time := to_char(v_slot_start AT TIME ZONE v_timezone, 'HH24:MI');
        is_available := NOT v_is_conflict;
        RETURN NEXT;

        -- Advance strictly by 30 minutes
        v_slot_start := v_slot_start + (v_interval_min || ' minutes')::INTERVAL;
    END LOOP;

    RETURN;
END;
$$;


-- 2. FUNCTION: book_appointment
-- Atomically books an appointment for the single barber, protected against double bookings
CREATE OR REPLACE FUNCTION book_appointment(
    p_shop_slug TEXT,
    p_service_id UUID,
    p_start_time TIMESTAMPTZ,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_email TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shop_id UUID;
    v_shop_name TEXT;
    v_shop_phone TEXT;
    v_timezone TEXT;
    v_service_name TEXT;
    v_service_duration INT;
    v_service_price NUMERIC(10,2);
    v_calculated_end_time TIMESTAMPTZ;
    v_new_appointment_id UUID;
    v_has_conflict BOOLEAN;
BEGIN
    -- 1. Validate inputs
    IF trim(p_customer_name) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'CUSTOMER_NAME_REQUIRED');
    END IF;

    IF trim(p_customer_phone) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'CUSTOMER_PHONE_REQUIRED');
    END IF;

    -- 2. Lookup shop
    SELECT id, name, phone, timezone
    INTO v_shop_id, v_shop_name, v_shop_phone, v_timezone
    FROM shops
    WHERE slug = p_shop_slug AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'SHOP_NOT_FOUND');
    END IF;

    v_timezone := COALESCE(v_timezone, 'Europe/Lisbon');

    -- 3. Lookup service
    SELECT name, duration_minutes, price
    INTO v_service_name, v_service_duration, v_service_price
    FROM services
    WHERE id = p_service_id AND shop_id = v_shop_id AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'SERVICE_NOT_FOUND');
    END IF;

    -- 4. Calculate end time
    v_calculated_end_time := p_start_time + (v_service_duration || ' minutes')::INTERVAL;

    -- 5. Check conflict before insert
    SELECT EXISTS (
        SELECT 1 FROM appointments
        WHERE shop_id = v_shop_id
          AND status != 'cancelled'
          AND (tstzrange(p_start_time, v_calculated_end_time, '[)') && tstzrange(start_time, end_time, '[)'))
    ) INTO v_has_conflict;

    IF v_has_conflict THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'SLOT_ALREADY_TAKEN',
            'message', 'Este horário acabou de ser reservado. Por favor escolha outro horário.'
        );
    END IF;

    -- 6. Insert appointment with PostgreSQL exclusion constraint safety
    BEGIN
        INSERT INTO appointments (
            shop_id,
            service_id,
            customer_name,
            customer_phone,
            customer_email,
            notes,
            start_time,
            end_time,
            status
        ) VALUES (
            v_shop_id,
            p_service_id,
            trim(p_customer_name),
            trim(p_customer_phone),
            trim(p_customer_email),
            trim(p_notes),
            p_start_time,
            v_calculated_end_time,
            'confirmed'
        )
        RETURNING id INTO v_new_appointment_id;

    EXCEPTION WHEN exclusion_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'SLOT_ALREADY_TAKEN',
            'message', 'Este horário acabou de ser reservado. Por favor escolha outro horário.'
        );
    END;

    -- 7. Return payload
    RETURN jsonb_build_object(
        'success', true,
        'appointment', jsonb_build_object(
            'id', v_new_appointment_id,
            'shop_name', v_shop_name,
            'shop_phone', v_shop_phone,
            'service_name', v_service_name,
            'service_duration', v_service_duration,
            'service_price', v_service_price,
            'customer_name', trim(p_customer_name),
            'customer_phone', trim(p_customer_phone),
            'start_time', p_start_time,
            'end_time', v_calculated_end_time,
            'formatted_date', to_char(p_start_time AT TIME ZONE v_timezone, 'DD/MM/YYYY'),
            'formatted_time', to_char(p_start_time AT TIME ZONE v_timezone, 'HH24:MI'),
            'status', 'confirmed'
        )
    );
END;
$$;
