export type AccentTheme = "cyan" | "amber" | "emerald" | "violet";

export interface StepCommand {
  label: string;
  shell: "zsh / bash" | "http" | "sql" | "apache" | "php";
  template: string;
  explanation: string;
}

export interface TeamMember {
  member_number: 1 | 2 | 3 | 4;
  slug: string;
  display_name: string;
  role_title: string;
  device: string;
  os_env: string;
  slide_range: string;
  duration_text: string;
  main_practice: string;
  band95_upgrade: string;
  overview_summary: string;
  tools: string[];
  accent_theme: AccentTheme;
}

export interface ScenarioStep {
  id: string;
  member_number: 1 | 2 | 3 | 4;
  step_order: number;
  phase_tag: string;
  title: string;
  slide_ref: string;
  is_band95: boolean;
  goal: string;
  action_steps: string[];
  commands: StepCommand[];
  expected_output: string;
  academic_explanation: string;
  presenter_script: string;
  simulator_key?: string;
}

export interface VulnerabilityItem {
  id: string;
  cwe_id: string;
  title: string;
  cvss_vector: string;
  cvss_score: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  poc_ref: string;
  owner_member: 1 | 2 | 3 | 4;
  remediation: string;
}

export interface QaItem {
  id: string;
  member_number: 1 | 2 | 3 | 4;
  question: string;
  answer_summary: string;
  is_band95: boolean;
}

export interface LabWorkspaceState {
  member_number: 1 | 2 | 3 | 4;
  container_ref: string;
  phpsessid: string;
  user_token: string;
  completed_step_ids: string[];
  notes: string;
  updated_at?: string;
}

export interface AttackStage {
  stage: number;
  badge: string;
  title: string;
  owner_member: 1 | 2 | 3 | 4;
  tools: string;
  action: string;
  output: string;
  handoff: string;
  poc_label: string;
}

export interface WorkspaceSnapshot {
  source: "supabase" | "fallback";
  supabaseConfigured: boolean;
  needsSeed: boolean;
  members: TeamMember[];
  steps: ScenarioStep[];
  vulnerabilities: VulnerabilityItem[];
  qaItems: QaItem[];
  workspaceStates: Record<number, LabWorkspaceState>;
}
