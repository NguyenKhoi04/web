import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Settings, Users, Columns, Zap, AlertTriangle, Save, Hash, FileText, ExternalLink, ChevronLeft } from 'lucide-react';
import { getServerSession } from "next-auth/next";


export default async function ProjectSettingsPage({ params }: { params: { projectId: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      _count: { select: { members: true } },
      members: { include: { user: true } },
      columns: { orderBy: { order: "asc" } },
    },
  });

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
          <div className="text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy dự án</h1>
            <p className="text-gray-500">Dự án bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          </div>
        </div>
      </div>
    );
  }

  const UpdateSchema = z.object({
    name : z.string().min(1, "Tên dự án không được để trống"),
    description : z.string().optional().nullable()
});

  function makeUpdateProjectAction(projectId: string) {
  return async function updateProject(formData: FormData) {
    "use server";

    // 1) Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    // 2) Lấy dữ liệu thô và ép kiểu chuỗi
    const nameVal = formData.get("name");
    const descVal = formData.get("description");

    const parsed = UpdateSchema.safeParse({
      name: typeof nameVal === "string" ? nameVal : "",
      description: typeof descVal === "string" ? descVal : null,
    });

    if (!parsed.success) {
      // Đừng console.error(null); nếu muốn log:
      console.error("updateProject invalid:", parsed.error.flatten().fieldErrors);
      redirect(`/projects/${projectId}/settings?error=invalid`);
    }

    // 3) (tuỳ) kiểm tra quyền ở đây

    // 4) Update
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
      },
    });

    // 5) Cache & điều hướng
    revalidatePath(`/projects/${projectId}/settings`, "page");
    redirect(`/projects/${projectId}/settings?saved=1`);
  };
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
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

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex gap-1">
              {/* Active Tab - Tổng quan */}
              <Link 
                href="#" 
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md"
              >
                <FileText className="w-4 h-4" />
                Tổng quan
              </Link>
              
              {/* Other Tabs */}
              <Link 
                href="./members" 
                className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-all duration-200"
              >
                <Users className="w-4 h-4" />
                Thành viên
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full ml-1">
                  {project._count.members}
                </span>
              </Link>
              
              <Link 
                href="./columns" 
                className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-all duration-200"
              >
                <Columns className="w-4 h-4" />
                Cột Kanban
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full ml-1">
                  {project.columns.length}
                </span>
              </Link>
              
              <Link 
                href="./integrations" 
                className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-all duration-200"
              >
                <Zap className="w-4 h-4" />
                Tích hợp
              </Link>
              
              <Link 
                href="./danger" 
                className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all duration-200"
              >
                <AlertTriangle className="w-4 h-4" />
                Nguy hiểm
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Thông tin cơ bản</h2>
                <p className="text-gray-500 mt-1">Cập nhật thông tin dự án của bạn</p>
              </div>
              
              <form 
                action={makeUpdateProjectAction(project.id)}
                className="p-8 space-y-6"
              >
                <input type="hidden" name="_method" value="PATCH" />
                
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
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Save className="w-4 h-4" />
                    Lưu thay đổi
                  </button>
                  
                  <button 
                    type="button"
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Project Stats */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Thống kê dự án</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Thành viên</span>
                  </div>
                  <span className="font-semibold text-blue-600">{project._count.members}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Columns className="w-4 h-4" />
                    <span>Cột Kanban</span>
                  </div>
                  <span className="font-semibold text-green-600">{project.columns.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Hash className="w-4 h-4" />
                    <span>Mã dự án</span>
                  </div>
                  <span className="font-mono font-semibold text-gray-800">{project.key}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
              <div className="space-y-3">
                <Link 
                  href="./members"
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-200 group"
                >
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-700">Quản lý thành viên</span>
                  <ExternalLink className="w-4 h-4 text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                
                <Link 
                  href="./columns"
                  className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-200 group"
                >
                  <Columns className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">Cấu hình Kanban</span>
                  <ExternalLink className="w-4 h-4 text-green-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                
                <Link 
                  href="./integrations"
                  className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors duration-200 group"
                >
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-700">Tích hợp bên thứ 3</span>
                  <ExternalLink className="w-4 h-4 text-purple-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl shadow-xl border-2 border-red-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-800">Vùng nguy hiểm</h3>
              </div>
              <p className="text-red-700 text-sm mb-4 leading-relaxed">
                Các hành động này có thể ảnh hưởng nghiêm trọng đến dự án của bạn. Hãy thực hiện cẩn thận.
              </p>
              <Link 
                href="./danger"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <AlertTriangle className="w-4 h-4" />
                Xóa / Lưu trữ / Khôi phục
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}