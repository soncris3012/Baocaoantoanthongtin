"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, Save } from "lucide-react";
import { RoleSimulator } from "@/components/RoleSimulator";
import { DvwaWebEmulator } from "@/components/simulators/DvwaWebEmulator";
import { MiniWafSimulator } from "@/components/simulators/MiniWafSimulator";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { ATTACK_FLOW_STAGES } from "@/data/scenarioData";

function MoPhongContent() {
  const { snapshot, savingMember, updateMemberState } = useWorkspace();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isDvwaParam = searchParams.get("view") === "dvwa";
  const isMiniWafParam = searchParams.get("view") === "miniwaf";
  const tabParam = searchParams.get("tab");
  const initialParam = Number(searchParams.get("member"));
  const validInitial: 1 | 2 | 3 | 4 =
    initialParam >= 1 && initialParam <= 4 ? (initialParam as 1 | 2 | 3 | 4) : 1;

  const [viewMode, setViewMode] = useState<"member" | "dvwa" | "miniwaf">(
    isDvwaParam ? "dvwa" : isMiniWafParam ? "miniwaf" : "member"
  );
  const [selectedMember, setSelectedMember] = useState<1 | 2 | 3 | 4>(validInitial);

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "dvwa") {
      setViewMode("dvwa");
      return;
    }
    if (viewParam === "miniwaf") {
      setViewMode("miniwaf");
      return;
    }
    const param = Number(searchParams.get("member"));
    if (param >= 1 && param <= 4) {
      setViewMode("member");
      if (param !== selectedMember) {
        setSelectedMember(param as 1 | 2 | 3 | 4);
      }
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
    setViewMode("member");
    setSelectedMember(num);
    router.replace(`/mo-phong?member=${num}`, { scroll: false });
  };

  const handleOpenDvwaView = () => {
    setViewMode("dvwa");
    router.replace("/mo-phong?view=dvwa", { scroll: false });
  };

  const handleOpenMiniWafView = () => {
    setViewMode("miniwaf");
    router.replace("/mo-phong?view=miniwaf", { scroll: false });
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
          <button
            type="button"
            onClick={handleOpenMiniWafView}
            className={`cursor-pointer rounded px-3 py-1 font-mono text-xs font-medium transition-colors ${
              viewMode === "miniwaf"
                ? "bg-accent font-bold text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Mini-WAF v2 (:8080/:8888)
          </button>
          <button
            type="button"
            onClick={handleOpenDvwaView}
            className={`cursor-pointer rounded px-3 py-1 font-mono text-xs font-medium transition-colors ${
              viewMode === "dvwa"
                ? "bg-emerald-600 font-bold text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            DVWA Web (:8080)
          </button>
          {snapshot.members.map((m) => (
            <button
              key={m.member_number}
              type="button"
              onClick={() => handleSelectMember(m.member_number as 1 | 2 | 3 | 4)}
              className={`cursor-pointer rounded px-3 py-1 font-mono text-xs font-medium transition-colors ${
                viewMode === "member" && m.member_number === selectedMember
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
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Workspace: {member.display_name}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {member.role_title} · {member.device} ({member.os_env})
          </p>
        </div>

        <Link
          href={`/thanh-vien/${selectedMember}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-subtle px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
        >
          <span>Chi tiết {member.display_name}</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Handoff Pipeline Bar */}
      <section className="rounded-lg border border-hairline bg-surface p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            Trạm Thực hành (4 Thành viên)
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

      {/* Environment Parameters */}
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-ink sm:text-sm">
            Tham số Phiên ({member.display_name})
          </h2>
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

      {/* Simulator Frame, Mini-WAF v2, or Full DVWA Web Emulator */}
      {viewMode === "miniwaf" ? (
        <MiniWafSimulator />
      ) : viewMode === "dvwa" ? (
        <section className="space-y-3 rounded-lg border border-hairline bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
            <div>
              <h2 className="text-sm font-bold text-ink sm:text-base">
                Ứng dụng Web Mục tiêu: Damn Vulnerable Web Application (DVWA v1.10)
              </h2>
              <p className="font-mono text-xs text-muted">
                http://127.0.0.1:8080 · Tài khoản mặc định: admin / password · Hỗ trợ chuyển 4 mức Low / Medium / High / Impossible
              </p>
            </div>
          </div>
          <DvwaWebEmulator
            defaultPage="home"
            phpsessid={phpsessidInput}
            userToken={userTokenInput}
          />
        </section>
      ) : (
        <RoleSimulator
          key={`sim-page-${selectedMember}-${tabParam ?? "default"}`}
          memberNumber={selectedMember}
          focusedSimulatorKey={
            tabParam === "eng" ? `m${selectedMember}-eng` : undefined
          }
          workspaceState={{
            ...currentState,
            container_ref: containerInput,
            phpsessid: phpsessidInput,
            user_token: userTokenInput,
          }}
        />
      )}
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
