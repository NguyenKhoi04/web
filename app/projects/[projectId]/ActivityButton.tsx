// app/projects/[projectId]/ActivityButton.tsx
"use client";

import React from "react";
import ProjectActivityDrawerWithApi from '@/app/components/ActivityDrawer';


export default function ActivityButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      >
        Xem lịch sử dự án
      </button>

      <ProjectActivityDrawerWithApi
        projectId={projectId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}