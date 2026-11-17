"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, Save } from "lucide-react";
import { RoleSimulator } from "@/components/RoleSimulator";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { ATTACK_FLOW_STAGES } from "@/data/scenarioData";

function MoPhongContent() {
  const { snapshot, savingMember, updateMemberState } = useWorkspace();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialParam = Number(searchParams.get("member"));
  const validInitial: 1 | 2 | 3 | 4 =
    initialParam >= 1 && initialParam <= 4 ? (initialParam as 1 | 2 | 3 | 4) : 1;

  const [selectedMember, setSelectedMember] = useState<1 | 2 | 3 | 4>(validInitial);

  useEffect(() => {
    const param = Number(searchParams.get("member"));
    if (param >= 1 && param <= 4 && param !== selectedMember) {
      setSelectedMember(param as 1 | 2 | 3 | 4);
    }
  }, [searchParams, selectedMember]);

  const member =
    snapshot.members.find((m) => m.member_number === selectedMember) ??
    snapshot.members[0];
  const currentState = snapshot.workspaceStates[selectedMember];

  const [containerInput, setContainerInput] = useState(currentState.container_ref);
  const [phpsessidInput, setPhpsessidInput] = useState(currentState.phpsessid);
  const [userTokenInput, setUserTokenInput] = useState(currentState.user_token);

  useEffect(() => {
    setContainerInput(currentState.container_ref);
    setPhpsessidInput(currentState.phpsessid);
    setUserTokenInput(currentState.user_token);
  }, [
    selectedMember,
    currentState.container_ref,
    currentState.phpsessid,
    currentState.user_token,
  ]);

  const handleSelectMember = (num: 1 | 2 | 3 | 4) => {
    setSelectedMember(num);
    router.replace(`/mo-phong?member=${num}`, { scroll: false });
  };

  const handleSaveVars = async () => {
    await updateMemberState(selectedMember, {
      container_ref: containerInput,
      phpsessid: phpsessidInput,
      user_token: userTokenInput,
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Trang tổng quan BTL
        </Link>

        <div className="inline-flex flex-wrap rounded-md border border-hairline bg-subtle p-0.5">
          {snapshot.members.map((m) => (
            <button
              key={m.member_number}
              type="button"
              onClick={() => handleSelectMember(m.member_number as 1 | 2 | 3 | 4)}
              className={`cursor-pointer rounded px-3 py-1 font-mono text-xs font-medium transition-colors ${
                m.member_number === selectedMember
                  ? "bg-surface font-bold text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              0{m.member_number} · {m.display_name}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
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

      {/* 4-Stage Attack-to-Defense Handoff Pipeline Bar */}
      <section className="rounded-lg border border-hairline bg-surface p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            Luồng Bàn giao Dữ liệu 4 Trạm (Attack-to-Defense Handoff)
          </span>
          <span className="hidden text-[11px] text-muted sm:inline">
            Chọn trạm để chuyển nhanh giữa 4 công cụ
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ATTACK_FLOW_STAGES.map((stage) => {
            const owner = snapshot.members.find(
              (m) => m.member_number === stage.owner_member
            );
            const active = stage.owner_member === selectedMember;
            return (
              <button
                key={stage.stage}
                type="button"
                onClick={() => handleSelectMember(stage.owner_member)}
                className={`flex cursor-pointer flex-col justify-between rounded-md border p-2.5 text-left transition-colors ${
                  active
                    ? "border-accent bg-accent/5"
                    : "border-hairline bg-subtle hover:bg-canvas"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] font-bold">
                    <span className={active ? "text-accent" : "text-muted"}>
                      GĐ 0{stage.stage} · {owner?.display_name}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted" aria-hidden="true" />
                  </div>
                  <div className="mt-1 text-xs font-semibold text-ink">
                    {stage.poc_label}
                  </div>
                </div>
                <div className="mt-1.5 line-clamp-2 text-[11px] text-muted">
                  {stage.handoff}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Environment Variable Bar */}
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold text-ink sm:text-sm">
              Biến Phiên Mô phỏng Dùng chung ({member.display_name})
            </h2>
            <p className="text-[11px] text-muted">
              Thay đổi CONTAINER_REF, PHPSESSID hoặc USER_TOKEN tại đây sẽ cập nhật tức thì vào các gói tin và câu lệnh mô phỏng.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveVars}
            disabled={savingMember === selectedMember}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {savingMember === selectedMember ? "Đang lưu..." : "Lưu tham số"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="sim-container"
              className="mb-1 block font-mono text-[11px] font-medium text-muted"
            >
              CONTAINER_REF
            </label>
            <input
              id="sim-container"
              type="text"
              value={containerInput}
              onChange={(e) => setContainerInput(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="sim-phpsessid"
              className="mb-1 block font-mono text-[11px] font-medium text-muted"
            >
              PHPSESSID
            </label>
            <input
              id="sim-phpsessid"
              type="text"
              value={phpsessidInput}
              onChange={(e) => setPhpsessidInput(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="sim-usertoken"
              className="mb-1 block font-mono text-[11px] font-medium text-muted"
            >
              USER_TOKEN
            </label>
            <input
              id="sim-usertoken"
              type="text"
              value={userTokenInput}
              onChange={(e) => setUserTokenInput(e.target.value)}
              className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Simulator Frame */}
      <RoleSimulator
        key={`sim-page-${selectedMember}`}
        memberNumber={selectedMember}
        workspaceState={{
          ...currentState,
          container_ref: containerInput,
          phpsessid: phpsessidInput,
          user_token: userTokenInput,
        }}
      />
    </div>
  );
}

export default function MoPhongPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-lg border border-hairline bg-surface p-6 font-mono text-xs text-muted">
          Đang khởi tạo Phòng Lab Mô phỏng...
        </div>
      }
    >
      <MoPhongContent />
    </Suspense>
  );
}
