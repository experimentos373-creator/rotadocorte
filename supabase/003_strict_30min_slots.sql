-- ==============================================================================
-- 003_strict_30min_slots.sql
-- Force strict 30-minute independent slots for Rota Do Corte
-- 1 booking = strictly occupies its own 30-min start slot (e.g. 16:00 -> 16:30)
-- Adjacent slots (15:30 and 16:30) remain 100% FREE regardless of service duration.
-- ==============================================================================

-- 1. Update any existing appointments to standard 30-min end_time
UPDATE appointments 
SET end_time = start_time + '30 minutes'::INTERVAL
WHERE end_time > start_time + '30 minutes'::INTERVAL;

-- 2. Redefine get_available_slots RPC
CREATE OR REPLACE FUNCTION get_available_slots(
    p_shop_slug TEXT,
    p_date DATE,
    p_service_id TEXT DEFAULT NULL
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
    v_interval_min INT := 30;
    v_min_notice_hrs INT;
    v_day_of_week INT;
    v_hours RECORD;
    v_slot_start TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
    v_shift_start TIMESTAMPTZ;
    v_shift_end TIMESTAMPTZ;
    v_earliest_allowed TIMESTAMPTZ;
    v_is_conflict BOOLEAN;
BEGIN
    -- 1. Lookup Shop
    SELECT id, timezone, min_notice_hours
    INTO v_shop_id, v_timezone, v_min_notice_hrs
    FROM shops
    WHERE slug = p_shop_slug AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Shop with slug % not found or inactive', p_shop_slug;
    END IF;

    v_timezone := COALESCE(v_timezone, 'Europe/Lisbon');
    v_min_notice_hrs := COALESCE(v_min_notice_hrs, 1);

    -- 2. Day of Week & Working Hours
    v_day_of_week := EXTRACT(DOW FROM p_date);
    v_earliest_allowed := now() + (v_min_notice_hrs || ' hours')::INTERVAL;

    SELECT start_time, end_time, is_open
    INTO v_hours
    FROM business_hours
    WHERE shop_id = v_shop_id AND day_of_week = v_day_of_week;

    IF NOT FOUND OR v_hours.is_open = false THEN
        RETURN;
    END IF;

    v_shift_start := (p_date || ' ' || v_hours.start_time)::TIMESTAMP AT TIME ZONE v_timezone;
    v_shift_end   := (p_date || ' ' || v_hours.end_time)::TIMESTAMP AT TIME ZONE v_timezone;

    v_slot_start := v_shift_start;

    -- Iterate strictly in 30-minute intervals
    WHILE v_slot_start + (v_interval_min || ' minutes')::INTERVAL <= v_shift_end LOOP
        v_slot_end := v_slot_start + (v_interval_min || ' minutes')::INTERVAL;

        -- Check past time if today
        IF v_slot_start < v_earliest_allowed THEN
            slot_time := v_slot_start;
            formatted_time := to_char(v_slot_start AT TIME ZONE v_timezone, 'HH24:MI');
            is_available := false;
            RETURN NEXT;
            v_slot_start := v_slot_start + (v_interval_min || ' minutes')::INTERVAL;
            CONTINUE;
        END IF;

        -- Check recurring breaks (Lunch)
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

        -- Check manual blocked slots
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

        -- Check active appointments (Strict 30-min block: 1 booking at 16:00 only conflicts with 16:00)
        SELECT EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.shop_id = v_shop_id
              AND a.status NOT IN ('cancelled')
              AND (tstzrange(v_slot_start, v_slot_end, '[)') && tstzrange(a.start_time, a.start_time + (v_interval_min || ' minutes')::INTERVAL, '[)'))
        ) INTO v_is_conflict;

        slot_time := v_slot_start;
        formatted_time := to_char(v_slot_start AT TIME ZONE v_timezone, 'HH24:MI');
        is_available := NOT v_is_conflict;
        RETURN NEXT;

        v_slot_start := v_slot_start + (v_interval_min || ' minutes')::INTERVAL;
    END LOOP;

    RETURN;
END;
$$;


-- 3. Redefine book_appointment RPC
CREATE OR REPLACE FUNCTION book_appointment(
    p_shop_slug TEXT,
    p_service_id TEXT,
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
    v_actual_service_id UUID;
    v_service_name TEXT;
    v_service_duration INT;
    v_service_price NUMERIC(10,2);
    v_slot_end_time TIMESTAMPTZ;
    v_new_appointment_id UUID;
    v_has_conflict BOOLEAN;
BEGIN
    -- 1. Input Sanitization
    IF char_length(trim(COALESCE(p_customer_name, ''))) < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'CUSTOMER_NAME_REQUIRED', 'message', 'Por favor insira um nome válido.');
    END IF;

    IF char_length(trim(COALESCE(p_customer_phone, ''))) < 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'CUSTOMER_PHONE_REQUIRED', 'message', 'Por favor insira um contacto telefónico válido.');
    END IF;

    -- 2. Lookup shop
    SELECT id, name, phone, timezone
    INTO v_shop_id, v_shop_name, v_shop_phone, v_timezone
    FROM shops
    WHERE slug = p_shop_slug AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'SHOP_NOT_FOUND', 'message', 'Barbearia não encontrada.');
    END IF;

    v_timezone := COALESCE(v_timezone, 'Europe/Lisbon');

    -- 3. Lookup service & enforce server-side price & duration
    SELECT id, name, duration_minutes, price
    INTO v_actual_service_id, v_service_name, v_service_duration, v_service_price
    FROM services
    WHERE shop_id = v_shop_id 
      AND is_active = true
      AND (
        id::text = p_service_id
        OR slug = p_service_id
        OR lower(name) = lower(p_service_id)
        OR lower(replace(name, ' ', '-')) = lower(p_service_id)
      )
    LIMIT 1;

    IF NOT FOUND THEN
        SELECT id, name, duration_minutes, price
        INTO v_actual_service_id, v_service_name, v_service_duration, v_service_price
        FROM services
        WHERE shop_id = v_shop_id AND is_active = true
        ORDER BY sort_order ASC
        LIMIT 1;
    END IF;

    -- 4. Calculate End Time Server-Side: strictly fixed 30-min block
    v_slot_end_time := p_start_time + '30 minutes'::INTERVAL;

    -- 5. Check conflict strictly on exact 30-minute slot
    SELECT EXISTS (
        SELECT 1 FROM appointments
        WHERE shop_id = v_shop_id
          AND status NOT IN ('cancelled')
          AND (tstzrange(p_start_time, v_slot_end_time, '[)') && tstzrange(start_time, start_time + '30 minutes'::INTERVAL, '[)'))
    ) OR EXISTS (
        SELECT 1 FROM blocked_slots
        WHERE shop_id = v_shop_id
          AND (tstzrange(p_start_time, v_slot_end_time, '[)') && tstzrange(start_time, end_time, '[)'))
    ) INTO v_has_conflict;

    IF v_has_conflict THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'SLOT_ALREADY_TAKEN',
            'message', 'Este horário acabou de ser reservado. Por favor escolha outro horário.'
        );
    END IF;

    -- 6. Insert Appointment
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
            v_actual_service_id,
            trim(p_customer_name),
            trim(p_customer_phone),
            NULLIF(trim(p_customer_email), ''),
            NULLIF(trim(p_notes), ''),
            p_start_time,
            v_slot_end_time,
            'confirmed'
        )
        RETURNING id INTO v_new_appointment_id;

    EXCEPTION WHEN exclusion_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'CONCURRENCY_COLLISION',
            'message', 'Outro cliente reservou este horário milissegundos antes. Por favor selecione outro horário.'
        );
    END;

    -- 7. Return Confirmation Payload
    RETURN jsonb_build_object(
        'success', true,
        'appointment', jsonb_build_object(
            'id', v_new_appointment_id,
            'shop_name', v_shop_name,
            'shop_phone', v_shop_phone,
            'service_name', v_service_name,
            'service_duration', v_service_duration,
            'service_price', to_char(v_service_price, 'FM999999990.00') || ' €',
            'customer_name', trim(p_customer_name),
            'customer_phone', trim(p_customer_phone),
            'start_time', p_start_time,
            'end_time', v_slot_end_time,
            'formatted_date', to_char(p_start_time AT TIME ZONE v_timezone, 'DD/MM/YYYY'),
            'formatted_time', to_char(p_start_time AT TIME ZONE v_timezone, 'HH24:MI'),
            'status', 'confirmed'
        )
    );
END;
$$;
