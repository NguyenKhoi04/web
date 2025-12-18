'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MilestoneCreateModal from '@/app/components/MilestoneCreateModal';

export default function MilestoneCreateButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm font-medium flex items-center gap-2"
      >
        <span className="text-xl leading-none">+</span> Tạo Milestone
      </button>

      <MilestoneCreateModal
        projectId={projectId}
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
