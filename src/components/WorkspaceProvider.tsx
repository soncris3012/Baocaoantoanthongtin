"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { LabWorkspaceState, WorkspaceSnapshot } from "@/types/scenario";

interface WorkspaceContextValue {
  snapshot: WorkspaceSnapshot;
  theme: "light" | "dark";
  toggleTheme: () => void;
  presentationMode: boolean;
  setPresentationMode: (val: boolean) => void;
  savingMember: number | null;
  toastMessage: string | null;
  clearToast: () => void;
  updateMemberState: (
    memberNumber: 1 | 2 | 3 | 4,
    patch: Partial<LabWorkspaceState>
  ) => Promise<void>;
  toggleStepCompletion: (memberNumber: 1 | 2 | 3 | 4, stepId: string) => Promise<void>;
  renameMember: (memberNumber: 1 | 2 | 3 | 4, displayName: string) => Promise<void>;
  seedSupabase: () => Promise<{ ok: boolean; message: string }>;
  refreshSnapshot: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const LOCAL_STORAGE_KEY = "btl_attt_workspace_states_v1";
const THEME_STORAGE_KEY = "btl_attt_theme_v1";

export function WorkspaceProvider({
  initialSnapshot,
  children,
}: {
  initialSnapshot: WorkspaceSnapshot;
  children: React.ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(initialSnapshot);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [presentationMode, setPresentationMode] = useState(false);
  const [savingMember, setSavingMember] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "dark") {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      }
    } catch {
      // ignore storage errors
    }

    if (!initialSnapshot.supabaseConfigured) {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<number, LabWorkspaceState>;
          setSnapshot((prev) => ({
            ...prev,
            workspaceStates: { ...prev.workspaceStates, ...parsed },
          }));
        }
      } catch {
        // ignore localStorage parse errors
      }
    }
  }, [initialSnapshot.supabaseConfigured]);

  useEffect(() => {
    if (presentationMode) {
      document.documentElement.classList.add("presentation-mode");
    } else {
      document.documentElement.classList.remove("presentation-mode");
    }
  }, [presentationMode]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  const persistLocal = (nextStates: Record<number, LabWorkspaceState>) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextStates));
    } catch {
      // ignore storage quota errors
    }
  };

  const updateMemberState = async (
    memberNumber: 1 | 2 | 3 | 4,
    patch: Partial<LabWorkspaceState>
  ) => {
    const current = snapshot.workspaceStates[memberNumber];
    const nextState: LabWorkspaceState = {
      ...current,
      ...patch,
      member_number: memberNumber,
      updated_at: new Date().toISOString(),
    };

    const nextStates = {
      ...snapshot.workspaceStates,
      [memberNumber]: nextState,
    };

    setSnapshot((prev) => ({
      ...prev,
      workspaceStates: nextStates,
    }));
    persistLocal(nextStates);

    setSavingMember(memberNumber);
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextState),
      });
      const data = await res.json();
      if (data.persistedTo === "supabase") {
        showToast(`Đã lưu tiến độ Thành viên ${memberNumber} lên Supabase.`);
      } else {
        showToast(`Đã lưu tạm trên trình duyệt cho Thành viên ${memberNumber}.`);
      }
    } catch {
      showToast("Đã lưu cục bộ trên trình duyệt.");
    } finally {
      setSavingMember(null);
    }
  };

  const toggleStepCompletion = async (memberNumber: 1 | 2 | 3 | 4, stepId: string) => {
    const current = snapshot.workspaceStates[memberNumber];
    const exists = current.completed_step_ids.includes(stepId);
    const nextIds = exists
      ? current.completed_step_ids.filter((id) => id !== stepId)
      : [...current.completed_step_ids, stepId];
    await updateMemberState(memberNumber, { completed_step_ids: nextIds });
  };

  const renameMember = async (memberNumber: 1 | 2 | 3 | 4, displayName: string) => {
    const trimmed = displayName.trim();
    if (!trimmed) return;

    setSnapshot((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.member_number === memberNumber ? { ...m, display_name: trimmed } : m
      ),
    }));

    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename_member",
          member_number: memberNumber,
          display_name: trimmed,
        }),
      });
      const data = await res.json();
      if (data.persistedTo === "supabase") {
        showToast(`Đã cập nhật tên Thành viên ${memberNumber} trên Supabase.`);
      } else {
        showToast(`Đã đổi tên Thành viên ${memberNumber} trong phiên hiện tại.`);
      }
    } catch {
      showToast("Không thể kết nối máy chủ để đổi tên.");
    }
  };

  const refreshSnapshot = async () => {
    const res = await fetch("/api/workspace", { cache: "no-store" });
    if (res.ok) {
      const next = (await res.json()) as WorkspaceSnapshot;
      setSnapshot(next);
    }
  };

  const seedSupabase = async () => {
    const res = await fetch("/api/seed", { method: "POST" });
    const data = (await res.json()) as { ok: boolean; message: string };
    if (data.ok) {
      await refreshSnapshot();
      showToast("Đồng bộ dữ liệu lên Supabase thành công.");
    } else {
      showToast(data.message);
    }
    return data;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        snapshot,
        theme,
        toggleTheme,
        presentationMode,
        setPresentationMode,
        savingMember,
        toastMessage,
        clearToast: () => setToastMessage(null),
        updateMemberState,
        toggleStepCompletion,
        renameMember,
        seedSupabase,
        refreshSnapshot,
      }}
    >
      {children}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-md border border-hairline bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-sm"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return ctx;
}
