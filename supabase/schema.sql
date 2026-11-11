-- ============================================================================
-- Schema Supabase (PostgreSQL) cho Web Mo phong Kich ban BTL ATTT (DVWA)
-- Repo: soncris3012/Baocaoantoanthongtin
-- ============================================================================

-- 1. Danh sach 4 thanh vien & phan cong nhiem vu
CREATE TABLE IF NOT EXISTS public.team_members (
  member_number INTEGER PRIMARY KEY CHECK (member_number BETWEEN 1 AND 4),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  device TEXT NOT NULL,
  os_env TEXT NOT NULL,
  slide_range TEXT NOT NULL,
  duration_text TEXT NOT NULL,
  main_practice TEXT NOT NULL,
  band95_upgrade TEXT NOT NULL,
  overview_summary TEXT NOT NULL,
  tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  accent_theme TEXT NOT NULL DEFAULT 'cyan',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kich ban thuc hanh tung buoc cua tung thanh vien
CREATE TABLE IF NOT EXISTS public.scenario_steps (
  id TEXT PRIMARY KEY,
  member_number INTEGER NOT NULL REFERENCES public.team_members(member_number) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  phase_tag TEXT NOT NULL,
  title TEXT NOT NULL,
  slide_ref TEXT NOT NULL,
  is_band95 BOOLEAN NOT NULL DEFAULT FALSE,
  goal TEXT NOT NULL,
  action_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  commands JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_output TEXT NOT NULL,
  academic_explanation TEXT NOT NULL,
  presenter_script TEXT NOT NULL,
  simulator_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenario_steps_member ON public.scenario_steps(member_number, step_order);

-- 3. Bang chuan hoa Rui ro CWE & CVSS v3.1
CREATE TABLE IF NOT EXISTS public.vulnerabilities (
  id TEXT PRIMARY KEY,
  cwe_id TEXT NOT NULL,
  title TEXT NOT NULL,
  cvss_vector TEXT NOT NULL,
  cvss_score NUMERIC(3, 1) NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  poc_ref TEXT NOT NULL,
  owner_member INTEGER NOT NULL REFERENCES public.team_members(member_number) ON DELETE CASCADE,
  remediation TEXT NOT NULL
);

-- 4. Ngan hang cau hoi phan bien danh cho 4 thanh vien
CREATE TABLE IF NOT EXISTS public.qa_items (
  id TEXT PRIMARY KEY,
  member_number INTEGER NOT NULL REFERENCES public.team_members(member_number) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer_summary TEXT NOT NULL,
  is_band95 BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. Trang thai thuc hanh thuc te & bien phien dong bo cua nhom
CREATE TABLE IF NOT EXISTS public.lab_workspace_state (
  member_number INTEGER PRIMARY KEY REFERENCES public.team_members(member_number) ON DELETE CASCADE,
  container_ref TEXT NOT NULL DEFAULT 'dvwa',
  phpsessid TEXT NOT NULL DEFAULT '7nst0hrqrfmv744a5ouj7663b0',
  user_token TEXT NOT NULL DEFAULT 'd41d8cd98f00b204e9800998ecf8427e',
  completed_step_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security (RLS) - Mo doc/ghi cho khong gian lam viec nhom 4 nguoi
-- ============================================================================
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_workspace_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read team_members" ON public.team_members;
CREATE POLICY "Public read team_members" ON public.team_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write team_members" ON public.team_members;
CREATE POLICY "Public write team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read scenario_steps" ON public.scenario_steps;
CREATE POLICY "Public read scenario_steps" ON public.scenario_steps FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write scenario_steps" ON public.scenario_steps;
CREATE POLICY "Public write scenario_steps" ON public.scenario_steps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read vulnerabilities" ON public.vulnerabilities;
CREATE POLICY "Public read vulnerabilities" ON public.vulnerabilities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write vulnerabilities" ON public.vulnerabilities;
CREATE POLICY "Public write vulnerabilities" ON public.vulnerabilities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read qa_items" ON public.qa_items;
CREATE POLICY "Public read qa_items" ON public.qa_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write qa_items" ON public.qa_items;
CREATE POLICY "Public write qa_items" ON public.qa_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read lab_workspace_state" ON public.lab_workspace_state;
CREATE POLICY "Public read lab_workspace_state" ON public.lab_workspace_state FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write lab_workspace_state" ON public.lab_workspace_state;
CREATE POLICY "Public write lab_workspace_state" ON public.lab_workspace_state FOR ALL USING (true) WITH CHECK (true);
