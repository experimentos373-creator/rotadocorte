-- ==============================================================================
-- P&D BOOKING SYSTEM / ROTA DO CORTE (SIMPLIFIED SINGLE-BARBER MULTI-TENANT)
-- MIGRATION 003: Seed Rota do Corte Shop, Hours, Breaks & Services
-- ==============================================================================

DO $$
DECLARE
    v_shop_id UUID;
    v_day INT;
BEGIN
    -- 1. Insert/Update Shop
    INSERT INTO shops (
        slug,
        name,
        phone,
        email,
        address,
        timezone,
        slot_interval_minutes,
        min_notice_hours,
        max_advance_days,
        is_active
    ) VALUES (
        'rotadocorte',
        'Rota Do Corte',
        '+351 935 190 491',
        'rotadocorte.pt@gmail.com',
        'Rua da Direita nº 75, 3090-495 Paião, Figueira da Foz',
        'Europe/Lisbon',
        30,  -- Strictly 30-minute interval slots
        1,   -- Minimum 1-hour notice
        30,  -- Book up to 30 days ahead
        true
    )
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        slot_interval_minutes = 30,
        updated_at = now()
    RETURNING id INTO v_shop_id;

    -- 2. Business Hours (0=Sunday .. 6=Saturday)
    -- Monday to Saturday: 10:00 - 22:00, Sunday: Closed
    FOR v_day IN 0..6 LOOP
        IF v_day = 0 THEN
            INSERT INTO business_hours (shop_id, day_of_week, start_time, end_time, is_open)
            VALUES (v_shop_id, v_day, '10:00:00', '10:00:00', false)
            ON CONFLICT (shop_id, day_of_week) DO UPDATE
            SET is_open = false;
        ELSE
            INSERT INTO business_hours (shop_id, day_of_week, start_time, end_time, is_open)
            VALUES (v_shop_id, v_day, '10:00:00', '22:00:00', true)
            ON CONFLICT (shop_id, day_of_week) DO UPDATE
            SET start_time = '10:00:00',
                end_time = '22:00:00',
                is_open = true;
        END IF;
    END LOOP;

    -- 3. Recurring Lunch Breaks (13:00 - 14:00, Monday to Saturday)
    DELETE FROM breaks WHERE shop_id = v_shop_id;
    FOR v_day IN 1..6 LOOP
        INSERT INTO breaks (shop_id, day_of_week, start_time, end_time, name)
        VALUES (v_shop_id, v_day, '13:00:00', '14:00:00', 'Pausa de Almoço');
    END LOOP;

    -- 4. Services
    DELETE FROM services WHERE shop_id = v_shop_id;
    INSERT INTO services (shop_id, name, description, duration_minutes, price, badge, sort_order, is_active)
    VALUES
    (
        v_shop_id,
        'Barba Terapia',
        'Ritual completo com toalha aquecida, vaporizador de ozónio e alinhamento preciso de contornos.',
        15,
        5.00,
        'Essencial',
        1,
        true
    ),
    (
        v_shop_id,
        'Corte de Cabelo',
        'Corte masculino sob medida (degradê, tesoura, militar ou clássico) com acabamento à navalha.',
        30,
        10.00,
        'Clássico & Moderno',
        2,
        true
    ),
    (
        v_shop_id,
        'Corte de Cabelo + Sobrancelha',
        'Corte completo combinado com o alinhamento e limpeza geométrica da sobrancelha masculina.',
        30,
        11.00,
        'Popular',
        3,
        true
    ),
    (
        v_shop_id,
        'Corte e Barba Terapia',
        'A combinação perfeita: corte personalizado com barbaterapia completa a vapor de ozónio.',
        40,
        15.00,
        'Mais Vendido',
        4,
        true
    ),
    (
        v_shop_id,
        'Combo Premium',
        'Cuidado total: Corte, barbaterapia com ozónio, sobrancelha e tratamento facial revitalizante.',
        45,
        20.00,
        'Experiência VIP',
        5,
        true
    );

    RAISE NOTICE 'Rota do Corte (Single Barber) seed completed successfully!';
END $$;
