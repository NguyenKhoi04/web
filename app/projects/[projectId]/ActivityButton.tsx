"use client";

import { useState } from "react";
import { History } from "lucide-react";
import ActivityDrawer from "@/app/components/ActivityDrawer";

export default function ActivityButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
        title="Lịch sử hoạt động"
      >
        <History className="w-4 h-4" /> 
      </button>

      <ActivityDrawer
        open={open}
        onClose={() => setOpen(false)}
        filters={{ projectId }}
      />
    </>
  );
}