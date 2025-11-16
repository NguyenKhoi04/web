// app/projects/[projectId]/sprints/SprintCreateButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SprintCreateModal from '@/app/components/SprintCreateModal'; // đường dẫn tới modal bạn đã có

export default function SprintCreateButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700"
      >
        + Tạo sprint
      </button>

      <SprintCreateModal
        projectId={projectId}
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
