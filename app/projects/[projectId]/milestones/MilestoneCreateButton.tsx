'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MilestoneCreateModal from '@/app/components/MilestoneCreateModal';


type Props = {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function MilestoneCreateButton({ projectId, open, onClose, onCreated }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30">
      <div className="bg-white p-6 rounded-lg">
        <h3>Create milestone for {projectId}</h3>
        {/* form UI */}
        <button onClick={() => { onCreated(); }}>Create</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}