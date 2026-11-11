"use client";

import { Member1Simulator } from "@/components/simulators/Member1Simulator";
import { Member2Simulator } from "@/components/simulators/Member2Simulator";
import { Member3Simulator } from "@/components/simulators/Member3Simulator";
import { Member4Simulator } from "@/components/simulators/Member4Simulator";
import { LabWorkspaceState } from "@/types/scenario";

interface RoleSimulatorProps {
  memberNumber: 1 | 2 | 3 | 4;
  workspaceState: LabWorkspaceState;
  focusedSimulatorKey?: string;
}

export function RoleSimulator({
  memberNumber,
  workspaceState,
  focusedSimulatorKey,
}: RoleSimulatorProps) {
  if (memberNumber === 1) {
    return (
      <Member1Simulator
        key={focusedSimulatorKey || "m1"}
        containerRef={workspaceState.container_ref}
        activeTab={focusedSimulatorKey}
      />
    );
  }
  if (memberNumber === 2) {
    return (
      <Member2Simulator
        key={focusedSimulatorKey || "m2"}
        containerRef={workspaceState.container_ref}
        phpsessid={workspaceState.phpsessid}
        activeTab={focusedSimulatorKey}
      />
    );
  }
  if (memberNumber === 3) {
    return (
      <Member3Simulator
        key={focusedSimulatorKey || "m3"}
        containerRef={workspaceState.container_ref}
        phpsessid={workspaceState.phpsessid}
        activeTab={focusedSimulatorKey}
      />
    );
  }
  return (
    <Member4Simulator
      key={focusedSimulatorKey || "m4"}
      phpsessid={workspaceState.phpsessid}
      userToken={workspaceState.user_token}
      activeTab={focusedSimulatorKey}
    />
  );
}
