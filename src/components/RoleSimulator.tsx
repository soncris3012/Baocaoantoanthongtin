"use client";

import { type BurpAutoplayRequest } from "@/components/simulators/BurpSuiteEmulator";
import { type ExternalTerminalCommand } from "@/components/simulators/TerminalEmulator";
import { Member1Simulator } from "@/components/simulators/Member1Simulator";
import { Member2Simulator } from "@/components/simulators/Member2Simulator";
import { Member3Simulator } from "@/components/simulators/Member3Simulator";
import { Member4Simulator } from "@/components/simulators/Member4Simulator";
import { LabWorkspaceState } from "@/types/scenario";

interface RoleSimulatorProps {
  memberNumber: 1 | 2 | 3 | 4;
  workspaceState: LabWorkspaceState;
  focusedSimulatorKey?: string;
  burpAutoplay?: BurpAutoplayRequest | null;
  terminalAutoplay?: ExternalTerminalCommand | null;
}

export function RoleSimulator({
  memberNumber,
  workspaceState,
  focusedSimulatorKey,
  burpAutoplay,
  terminalAutoplay,
}: RoleSimulatorProps) {
  if (memberNumber === 1) {
    return (
      <Member1Simulator
        key={focusedSimulatorKey || "m1"}
        containerRef={workspaceState.container_ref}
        activeTab={focusedSimulatorKey}
        terminalAutoplay={terminalAutoplay}
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
        burpAutoplay={burpAutoplay}
        terminalAutoplay={terminalAutoplay}
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
        terminalAutoplay={terminalAutoplay}
      />
    );
  }
  return (
    <Member4Simulator
      key={focusedSimulatorKey || "m4"}
      containerRef={workspaceState.container_ref}
      phpsessid={workspaceState.phpsessid}
      userToken={workspaceState.user_token}
      activeTab={focusedSimulatorKey}
      burpAutoplay={burpAutoplay}
      terminalAutoplay={terminalAutoplay}
    />
  );
}
