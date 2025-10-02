"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import InviteMemberModal from "@/app/components/InviteMemberModal";

export default function InviteMemberClient({
    projectId,
  projectName,
  projectKey,
  existingMemberIds,
}: {
  projectId: string;
  projectName?: string;
  projectKey?: string;
   existingMemberIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg"
      >
        + Mời thành viên
      </button>

      <InviteMemberModal
        open={open}
        onClose={() => setOpen(false)}
        onInvited={() => { setOpen(false); router.refresh(); }}
        defaultProjectId={projectId}
        projectOptions={[{ id: projectId, name: projectName ?? "Dự án hiện tại", key: projectKey }]}
        existingMemberIds={existingMemberIds}
      />
    </>
  );
}
