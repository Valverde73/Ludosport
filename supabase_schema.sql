-- =========================================================================
-- LUDOSPORT ARENA - MIGRACIÓN DE TABLAS EN SUPABASE (POSTGRESQL)
-- =========================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/hvnwxeifiyysitoxorxy/sql/new
-- =========================================================================

-- 1. TABLA: TIRADORES (fencers)
CREATE TABLE IF NOT EXISTS public.fencers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rank TEXT NOT NULL DEFAULT 'Inizziato',
    color TEXT NOT NULL DEFAULT 'cyan',
    joined_at TEXT DEFAULT '',
    photo_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en fencers
ALTER TABLE public.fencers ENABLE ROW LEVEL SECURITY;

-- Política de acceso público total en fencers (SELECT, INSERT, UPDATE, DELETE)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Acceso público fencers" ON public.fencers;
    CREATE POLICY "Acceso público fencers" ON public.fencers
        FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN
    NULL;
END $$;

-- 2. TABLA: COMBATES MENSUALES (matches)
CREATE TABLE IF NOT EXISTS public.matches (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    fighter_a_id TEXT NOT NULL,
    fighter_a_name TEXT NOT NULL,
    fighter_b_id TEXT NOT NULL,
    fighter_b_name TEXT NOT NULL,
    result TEXT NOT NULL,
    points_a INTEGER NOT NULL DEFAULT 0,
    points_b INTEGER NOT NULL DEFAULT 0,
    winner TEXT NOT NULL,
    notes TEXT DEFAULT '',
    score_a INTEGER NOT NULL DEFAULT 0,
    score_b INTEGER NOT NULL DEFAULT 0,
    score_text TEXT DEFAULT '',
    month_key TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para optimizar consultas de liga mensual
CREATE INDEX IF NOT EXISTS idx_matches_month_key ON public.matches (month_key);
CREATE INDEX IF NOT EXISTS idx_matches_fighter_a ON public.matches (fighter_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_fighter_b ON public.matches (fighter_b_id);

-- Habilitar Row Level Security (RLS) en matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Política de acceso público total en matches (SELECT, INSERT, UPDATE, DELETE)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Acceso público matches" ON public.matches;
    CREATE POLICY "Acceso público matches" ON public.matches
        FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN
    NULL;
END $$;

-- 3. SEMILLA INICIAL DE LOS 14 TIRADORES OFICIALES (LudoSport Almería)
INSERT INTO public.fencers (id, name, rank, color, joined_at, photo_url)
VALUES
    ('f-1', 'Mar Garcia', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-2', 'Auri Haro', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-3', 'Mario Ferrer', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-4', 'Isa Liria', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-5', 'Ulises Carmona', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-6', 'Paula Carmona', 'Novizio', 'cyan', '2026-01-01', ''),
    ('f-7', 'Alberto Delgado', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-8', 'Rogelio Carceles', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-9', 'Patricia Urquiza', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-10', 'Saúl García-Abadillo', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-11', 'Virginia García', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-12', 'Andrés Saavedra', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-13', 'Emilio Valverde', 'Inizziato', 'cyan', '2026-01-01', ''),
    ('f-14', 'Trino Góngora', 'Instructor', 'emerald', '2026-01-01', '')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    rank = EXCLUDED.rank,
    color = EXCLUDED.color;
