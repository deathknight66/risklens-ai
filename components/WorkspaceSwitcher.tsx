"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Building, Check, ChevronDown, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkspaceSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel("risklens-org");
    channel.onmessage = (event) => {
      if (event.data === "workspace-switched") {
        // Another tab switched the workspace, we need to refresh this tab
        window.location.reload();
      }
    };
    return () => channel.close();
  }, []);

  if (!session || !session.user || !(session.user as any).memberships) {
    return null; 
  }

  const { activeOrganizationId, memberships, role: currentRole } = session.user as any;

  const handleSwitch = async (newOrgId: string) => {
    if (newOrgId === activeOrganizationId) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
    setIsSwitching(true);

    try {
      // Rotate session context
      await update({ activeOrganizationId: newOrgId });
      
      // Notify other tabs (Rule E)
      const channel = new BroadcastChannel("risklens-org");
      channel.postMessage("workspace-switched");
      channel.close();

      // Bust cache (Rule D)
      router.refresh();
      
      // Wait for router refresh to settle before unmounting the loading state
      setTimeout(() => {
        setIsSwitching(false);
      }, 800);
    } catch (error) {
      console.error("Failed to switch workspace:", error);
      setIsSwitching(false);
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700 focus:outline-none"
        >
          <Building className="w-4 h-4 text-emerald-500" />
          <span className="max-w-[120px] truncate">{activeOrganizationId}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 z-50">
            <div className="px-3 py-2 border-b border-slate-700 mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Switch Workspace</p>
            </div>
            {memberships.map((m: any) => {
              const isCurrent = m.organization_id === activeOrganizationId;
              return (
                <button
                  key={m.organization_id}
                  onClick={() => handleSwitch(m.organization_id)}
                  className={cn(
                    "w-full text-left px-3 py-2 flex flex-col gap-1 hover:bg-slate-700 transition-colors",
                    isCurrent && "bg-slate-700/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">
                      {m.organization_id}
                    </span>
                    {isCurrent && <Check className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-300 font-medium">
                      {m.role}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isSwitching && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center gap-4 shadow-2xl">
            <RefreshCcw className="w-8 h-8 text-emerald-500 animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-200">Switching Workspace...</h3>
              <p className="text-sm text-slate-400">Loading secure tenant context</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
