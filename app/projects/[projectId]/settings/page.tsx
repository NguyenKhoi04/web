// app/projects/[projectId]/settings/page.tsx
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import {
  Settings, Save, Hash, FileText, ChevronLeft, Users as UsersIcon,
} from "lucide-react";
import { logProjectActivity } from "@/lib/activity-log";
import ProjectMembersSettings from "./ProjectMembersSettings";
import { requireUser } from "@/lib/authz";

/** ===== Status config (slug lưu DB, label hiển thị) ===== */
export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'done';

export const PROJECT_STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'planning', label: 'Đang lên kế hoạch' },
  { value: 'in_progress', label: 'Đang triển khai' },
  { value: 'review', label: 'Đang đánh giá / nghiệm thu' },
  { value: 'done', label: 'Hoàn thành' },
];

export const DEFAULT_PROJECT_STATUS: ProjectStatus = 'planning';

/** ===== Zod schema ===== */
const UpdateSchema = z.object({
  name: z.string().min(1, "Tên dự án không được để trống"),
  description: z.string().optional().nullable(),
  status: z.enum(['planning', 'in_progress', 'review', 'done']),
  leadId: z.string().cuid().nullable().optional(),
});

/** ===== Server Action độc lập ===== */
export async function updateProjectAction(projectId: string, formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const parsed = UpdateSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: (formData.get("description") as string) ?? null,
    status: (formData.get("status") as ProjectStatus) ?? DEFAULT_PROJECT_STATUS,
    leadId: (() => {
      const v = formData.get("leadId");
      if (!v || v === "none") return null;
      return String(v);
    })(),
  });

  if (!parsed.success) {
    console.error("updateProject invalid:", parsed.error.flatten().fieldErrors);
    redirect(`/projects/${projectId}/settings?error=invalid`);
  }

  const { name, description, status, leadId } = parsed.data;

  // Nếu có leadId, đảm bảo người đó là thành viên dự án
  if (leadId) {
    const exists = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: leadId } },
      select: { userId: true },
    });
    if (!exists) redirect(`/projects/${projectId}/settings?error=lead_not_member`);
  }

  const before = await prisma.project.findUnique({
    where: { id: projectId },
  });

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name, description: description ?? null, status, leadId },
  });

  // 👇 Ghi lịch sử hệ thống
  await logProjectActivity({
    projectId,
    actorId: session.user.id,          // người đang chỉnh sửa
    type: "PROJECT_UPDATED",
    message: "Cập nhật thông tin dự án",
    meta: { before, after: updated },  // có thể bỏ nếu muốn log nhẹ
  });

  revalidatePath(`/projects/${projectId}`, "page");
  revalidatePath(`/projects/${projectId}/settings`, "page");
  redirect(`/projects/${projectId}/settings?saved=1`);
}

/** ===== Page ===== */
export default async function ProjectSettingsPage({
  params,
}: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  // Fetch current user role for client component
  const me = await requireUser();
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: me.id } },
    select: { role: true },
  });
  const currentUserRole = membership?.role || 'VIEWER';

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: { select: { members: true } },
      members: { include: { user: true } },
      columns: { orderBy: { order: "asc" } },
    },
  });

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy dự án</h1>
          <p className="text-gray-500">Dự án bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ChevronLeft className="w-4 h-4" /> Về Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Chuẩn hóa defaultValue cho select status (fallback về planning nếu DB có giá trị lạ)
  const ALLOWED: ProjectStatus[] = ['planning', 'in_progress', 'review', 'done'];
  const safeStatus: ProjectStatus = ALLOWED.includes(project.status as ProjectStatus)
    ? (project.status as ProjectStatus)
    : DEFAULT_PROJECT_STATUS;

  // ====== Server Action bind cho form ======
  function makeUpdateProjectAction(projectId: string) {
    return async function updateProject(formData: FormData) {
      "use server";
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) redirect("/login");

      const parsed = UpdateSchema.safeParse({
        name: String(formData.get("name") ?? ""),
        description: (formData.get("description") as string) ?? null,
        status: (formData.get("status") as ProjectStatus) ?? DEFAULT_PROJECT_STATUS,
        leadId: (() => {
          const v = formData.get("leadId");
          if (!v || v === "none") return null;
          return String(v);
        })(),
      });

      if (!parsed.success) {
        console.error("updateProject invalid:", parsed.error.flatten().fieldErrors);
        redirect(`/projects/${projectId}/settings?error=invalid`);
      }

      const { name, description, status, leadId } = parsed.data;

      // (An toàn) Nếu set leadId thì đảm bảo người đó là thành viên dự án
      if (leadId) {
        const exists = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: leadId } },
          select: { userId: true },
        });
        if (!exists) redirect(`/projects/${projectId}/settings?error=lead_not_member`);
      }

      const before = await prisma.project.findUnique({
        where: { id: projectId },
      });

      const updated = await prisma.project.update({
        where: { id: projectId },
        data: { name, description: description ?? null, status, leadId },
      });

      // 👇 Ghi lịch sử hệ thống
      await logProjectActivity({
        projectId,
        actorId: session.user.id,          // người đang chỉnh sửa
        type: "PROJECT_UPDATED",
        message: "Cập nhật thông tin dự án",
        meta: { before, after: updated },  // có thể bỏ nếu muốn log nhẹ
      });

      revalidatePath(`/projects/${projectId}`, "page");
      revalidatePath(`/projects/${projectId}/settings`, "page");
      redirect(`/projects/${projectId}/settings?saved=1`);
    };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center order-last ml-auto">
                <ChevronLeft className="w-8 h-8 text-white" />
              </Link>
              <Settings className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-3xl font-bold text-white">Cài đặt dự án</h1>
                <div className="flex items-center gap-2 text-indigo-100 mt-1">
                  <span className="font-medium">{project.name}</span>
                  <span className="opacity-60">•</span>
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    <span>{project.key}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quản lý thành viên */}
        <ProjectMembersSettings
          projectId={project.id}
          initialMembers={project.members.map(m => ({
            userId: m.userId,
            role: m.role,
            user: {
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
              image: m.user.image,
            }
          }))}
          currentUserRole={currentUserRole}
        />

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Thông tin dự án</h2>
            <p className="text-gray-500 mt-1">Chỉnh sửa và lưu lại các thông tin cơ bản.</p>
          </div>

          <form action={makeUpdateProjectAction(project.id)} className="p-8 space-y-6">
            <input type="hidden" name="_method" value="PATCH" />

            {/* Tên dự án */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Hash className="w-4 h-4" />
                Tên dự án
              </label>
              <input
                name="name"
                defaultValue={project.name}
                className="text-gray-900 w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nhập tên dự án..."
              />
            </div>

            {/* Mô tả */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4" />
                Mô tả dự án
              </label>
              <textarea
                name="description"
                defaultValue={project.description ?? ""}
                className="text-gray-900 w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors duration-200 bg-gray-50 focus:bg-white resize-none"
                rows={5}
                placeholder="Mô tả chi tiết về dự án của bạn..."
              />
            </div>

            {/* Trạng thái */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Trạng thái</label>
              <select
                name="status"
                defaultValue={safeStatus}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-blue-500"
              >
                {PROJECT_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Trưởng dự án (lead) */}


            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </button>

              <Link
                href={`/projects/${project.id}`}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
              >
                Hủy
              </Link>
            </div>
          </form>

        </div>
      </div>
    </div >
  );
}

