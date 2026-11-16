"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { RoleSimulator } from "@/components/RoleSimulator";
import { useWorkspace } from "@/components/WorkspaceProvider";

export default function MoPhongPage() {
  const { snapshot } = useWorkspace();
  const [selectedMember, setSelectedMember] = useState<1 | 2 | 3 | 4>(1);

  const member = snapshot.members.find((m) => m.member_number === selectedMember) ?? snapshot.members[0];
  const currentState = snapshot.workspaceStates[selectedMember];

  return (
    <div className="space-y-8">
      {/* Breadcrumb + Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Trang tổng quan BTL
        </Link>

        <div className="inline-flex rounded-md border border-hairline bg-subtle p-0.5">
          {snapshot.members.map((m) => (
            <button
              key={m.member_number}
              type="button"
              onClick={() => setSelectedMember(m.member_number as 1 | 2 | 3 | 4)}
              className={`cursor-pointer rounded px-3 py-1 font-mono text-xs font-medium transition-colors ${
                m.member_number === selectedMember
                  ? "bg-surface text-ink font-bold shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              0{m.member_number} · {m.display_name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-accent font-semibold uppercase tracking-wider">
            Phòng Lab Mô phỏng Tương tác Trực tiếp
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Console Mô phỏng: {member.display_name}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {member.role_title} · Thiết bị: <strong>{member.device}</strong> ({member.os_env})
          </p>
        </div>

        <Link
          href={`/thanh-vien/${selectedMember}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-subtle px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
        >
          <span>Xem Kịch bản từng bước của {member.display_name}</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Simulator Frame */}
      <RoleSimulator
        key={`sim-page-${selectedMember}`}
        memberNumber={selectedMember}
        workspaceState={currentState}
      />
    </div>
  );
}
