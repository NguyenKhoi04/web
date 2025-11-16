"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SprintCreateModal from "@/app/components/SprintCreateModal";

export default function CreateSprintButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        className="px-3 py-2 bg-green-600 text-white rounded-md text-sm"
        onClick={() => setOpen(true)}
      >
        + Sprint
      </button>

      <SprintCreateModal
        projectId={projectId}
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          router.refresh(); // reload server data after create
        }}
      />
    </>
  );
}