import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspaceSnapshot,
  saveMemberWorkspaceState,
  updateMemberDisplayName,
} from "@/lib/repository";
import { LabWorkspaceState } from "@/types/scenario";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getWorkspaceSnapshot();
  return NextResponse.json(snapshot);
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "rename_member") {
      const memberNumber = Number(body.member_number) as 1 | 2 | 3 | 4;
      if (![1, 2, 3, 4].includes(memberNumber)) {
        return NextResponse.json({ ok: false, error: "member_number không hợp lệ" }, { status: 400 });
      }
      const res = await updateMemberDisplayName(memberNumber, String(body.display_name ?? ""));
      return NextResponse.json(res, { status: res.ok ? 200 : 500 });
    }

    const state: LabWorkspaceState = {
      member_number: Number(body.member_number) as 1 | 2 | 3 | 4,
      container_ref: String(body.container_ref ?? "dvwa"),
      phpsessid: String(body.phpsessid ?? "7nst0hrqrfmv744a5ouj7663b0"),
      user_token: String(body.user_token ?? "d41d8cd98f00b204e9800998ecf8427e"),
      completed_step_ids: Array.isArray(body.completed_step_ids) ? body.completed_step_ids : [],
      notes: String(body.notes ?? ""),
    };

    if (![1, 2, 3, 4].includes(state.member_number)) {
      return NextResponse.json({ ok: false, error: "member_number không hợp lệ" }, { status: 400 });
    }

    const result = await saveMemberWorkspaceState(state);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Bad request" },
      { status: 400 }
    );
  }
}
