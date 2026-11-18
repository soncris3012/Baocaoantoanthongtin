import {
  DEFAULT_WORKSPACE_STATES,
  QA_ITEMS,
  SCENARIO_STEPS,
  TEAM_MEMBERS,
  VULNERABILITIES,
} from "@/data/scenarioData";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  LabWorkspaceState,
  QaItem,
  ScenarioStep,
  TeamMember,
  VulnerabilityItem,
  WorkspaceSnapshot,
} from "@/types/scenario";

function buildFallbackSnapshot(needsSeed = false): WorkspaceSnapshot {
  return {
    source: "fallback",
    supabaseConfigured: isSupabaseConfigured,
    needsSeed,
    members: TEAM_MEMBERS,
    steps: SCENARIO_STEPS,
    vulnerabilities: VULNERABILITIES,
    qaItems: QA_ITEMS,
    workspaceStates: DEFAULT_WORKSPACE_STATES,
  };
}

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const client = getSupabaseClient();
  if (!client) {
    return buildFallbackSnapshot(false);
  }

  try {
    const [membersRes, stepsRes, vulnsRes, qaRes, stateRes] = await Promise.all([
      client.from("team_members").select("*").order("member_number", { ascending: true }),
      client.from("scenario_steps").select("*").order("step_order", { ascending: true }),
      client.from("vulnerabilities").select("*").order("cvss_score", { ascending: false }),
      client.from("qa_items").select("*").order("id", { ascending: true }),
      client.from("lab_workspace_state").select("*").order("member_number", { ascending: true }),
    ]);

    if (membersRes.error || stepsRes.error || vulnsRes.error || qaRes.error || stateRes.error) {
      return buildFallbackSnapshot(true);
    }

    const dbMembers = (membersRes.data ?? []) as TeamMember[];
    const dbSteps = (stepsRes.data ?? []) as ScenarioStep[];

    if (dbMembers.length === 0 || dbSteps.length === 0) {
      return buildFallbackSnapshot(true);
    }

    const staticMemberByNumber = new Map(
      TEAM_MEMBERS.map((member) => [member.member_number, member])
    );
    const members = dbMembers
      .map((member) => {
        const latest = staticMemberByNumber.get(member.member_number);
        if (!latest) return member;
        return {
          ...latest,
          display_name: member.display_name || latest.display_name,
        };
      })
      .sort((a, b) => a.member_number - b.member_number);

    const dbStepIds = new Set(dbSteps.map((s) => s.id));
    const steps = [
      ...dbSteps,
      ...SCENARIO_STEPS.filter((s) => !dbStepIds.has(s.id)),
    ].sort((a, b) =>
      a.member_number !== b.member_number
        ? a.member_number - b.member_number
        : a.step_order - b.step_order
    );

    const dbVulns = (vulnsRes.data ?? []) as VulnerabilityItem[];
    const dbVulnIds = new Set(dbVulns.map((v) => v.id));
    const vulnerabilities = dbVulns.length
      ? [...dbVulns, ...VULNERABILITIES.filter((v) => !dbVulnIds.has(v.id))]
      : VULNERABILITIES;

    const dbQa = (qaRes.data ?? []) as QaItem[];
    const dbQaIds = new Set(dbQa.map((q) => q.id));
    const qaItems = dbQa.length
      ? [...dbQa, ...QA_ITEMS.filter((q) => !dbQaIds.has(q.id))]
      : QA_ITEMS;

    const workspaceStates: Record<number, LabWorkspaceState> = { ...DEFAULT_WORKSPACE_STATES };
    for (const row of (stateRes.data ?? []) as LabWorkspaceState[]) {
      workspaceStates[row.member_number] = row;
    }

    return {
      source: "supabase",
      supabaseConfigured: true,
      needsSeed: false,
      members,
      steps,
      vulnerabilities,
      qaItems,
      workspaceStates,
    };
  } catch {
    return buildFallbackSnapshot(true);
  }
}

export async function seedSupabaseDatabase(): Promise<{
  ok: boolean;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: "Chưa cấu hình NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  try {
    const mRes = await client.from("team_members").upsert(TEAM_MEMBERS, { onConflict: "member_number" });
    if (mRes.error) throw mRes.error;

    const sRes = await client.from("scenario_steps").upsert(SCENARIO_STEPS, { onConflict: "id" });
    if (sRes.error) throw sRes.error;

    const vRes = await client.from("vulnerabilities").upsert(VULNERABILITIES, { onConflict: "id" });
    if (vRes.error) throw vRes.error;

    const qRes = await client.from("qa_items").upsert(QA_ITEMS, { onConflict: "id" });
    if (qRes.error) throw qRes.error;

    const stateRows = Object.values(DEFAULT_WORKSPACE_STATES);
    const stRes = await client
      .from("lab_workspace_state")
      .upsert(stateRows, { onConflict: "member_number" });
    if (stRes.error) throw stRes.error;

    return {
      ok: true,
      message: "Đã đồng bộ toàn bộ kịch bản 4 thành viên (Sơn, Hùng, Quyết, Khánh) và bảng CWE/CVSS lên Supabase.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi không xác định khi seed Supabase";
    return {
      ok: false,
      message: `Không thể ghi dữ liệu lên Supabase (hãy đảm bảo bạn đã chạy supabase/schema.sql trong SQL Editor): ${msg}`,
    };
  }
}

export async function saveMemberWorkspaceState(
  state: LabWorkspaceState
): Promise<{ ok: boolean; persistedTo: "supabase" | "local"; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: true, persistedTo: "local" };
  }

  try {
    const { error } = await client.from("lab_workspace_state").upsert(
      {
        member_number: state.member_number,
        container_ref: state.container_ref,
        phpsessid: state.phpsessid,
        user_token: state.user_token,
        completed_step_ids: state.completed_step_ids,
        notes: state.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "member_number" }
    );

    if (error) {
      return { ok: false, persistedTo: "local", error: error.message };
    }
    return { ok: true, persistedTo: "supabase" };
  } catch (err) {
    return {
      ok: false,
      persistedTo: "local",
      error: err instanceof Error ? err.message : "Supabase write failed",
    };
  }
}

export async function updateMemberDisplayName(
  memberNumber: 1 | 2 | 3 | 4,
  displayName: string
): Promise<{ ok: boolean; persistedTo: "supabase" | "local"; error?: string }> {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return { ok: false, persistedTo: "local", error: "Tên thành viên không được rỗng." };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { ok: true, persistedTo: "local" };
  }

  try {
    const { error } = await client
      .from("team_members")
      .update({ display_name: trimmed, updated_at: new Date().toISOString() })
      .eq("member_number", memberNumber);

    if (error) {
      return { ok: false, persistedTo: "local", error: error.message };
    }
    return { ok: true, persistedTo: "supabase" };
  } catch (err) {
    return {
      ok: false,
      persistedTo: "local",
      error: err instanceof Error ? err.message : "Supabase update failed",
    };
  }
}
