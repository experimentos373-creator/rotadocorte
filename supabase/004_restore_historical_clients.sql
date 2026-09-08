-- ==============================================================================
-- 004_restore_historical_clients.sql
-- Recuperação imediata dos clientes e histórico de faturação (Sábado, 05/09/2026)
-- ==============================================================================

INSERT INTO appointments (
    id,
    shop_id,
    service_id,
    customer_name,
    customer_phone,
    customer_email,
    notes,
    start_time,
    end_time,
    status,
    created_at
) VALUES 
(
    gen_random_uuid(),
    '960c7ee6-df3f-46aa-889c-a8c174f813bd',
    'dff9b327-2bed-45ec-91b1-5553f25b82e5', -- Corte de Cabelo + Sobrancelha (11.00 €)
    'Ruben Fajardo',
    '910000000', -- Pode ajustar para o contacto real no Admin CRM
    NULL,
    'Cliente atendido no Sábado (Concluído)',
    '2026-09-05 20:00:00+00',
    '2026-09-05 20:30:00+00',
    'completed',
    '2026-09-05 18:00:00+00'
),
(
    gen_random_uuid(),
    '960c7ee6-df3f-46aa-889c-a8c174f813bd',
    '69e6cea9-c739-4d45-b3c1-c6c304a9958d', -- Corte e Barba Terapia (15.00 €)
    'Ricardo jordao',
    '910000000', -- Pode ajustar para o contacto real no Admin CRM
    NULL,
    'Cliente atendido no Sábado (Concluído)',
    '2026-09-05 15:00:00+00',
    '2026-09-05 15:40:00+00',
    'completed',
    '2026-09-05 13:00:00+00'
),
(
    gen_random_uuid(),
    '960c7ee6-df3f-46aa-889c-a8c174f813bd',
    '69e6cea9-c739-4d45-b3c1-c6c304a9958d', -- Corte e Barba Terapia (15.00 €)
    'Cliente Atendido (Corte e Barba Terapia)',
    '910000000',
    NULL,
    'Marcação confirmada no print de Segunda-feira, 7 de Setembro às 20:30',
    '2026-09-07 20:30:00+00',
    '2026-09-07 21:10:00+00',
    'completed',
    '2026-09-07 18:00:00+00'
);
