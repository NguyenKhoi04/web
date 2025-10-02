'use client';
import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Bell, Users, FolderOpen, MessageSquare, Clock,
  Filter, MoreHorizontal, CheckCircle, Kanban, Calendar as CalendarIcon,
  BarChart3, UserPlus, Flag, Rocket, Home, ChevronDown, X
} from 'lucide-react';
import ProjectCreateModal from "@/app/components/ProjectCreateModal";
import { useRouter } from "next/navigation";
import ProjectMore from "@/app/components/ProjectMore";
import InviteMemberModal from "@/app/components/InviteMemberModal";
import SprintCreateModal from "@/app/components/SprintCreateModal";
import AssignTaskModal from '@/app/components/AssignTaskModal';

/** Types (nhẹ nhàng cho TS) */
type Priority = 'low' | 'medium' | 'high';
type Status = 'todo' | 'in-progress' | 'review' | 'done';

type TeamProject = {
  id: string;
  name: string;
  key?: string | null;
  _count: { members: number };
  members: { role: string; user: { id: string; name: string | null; email: string; image?: string | null } }[];
};

type TeamResponse = {
  projects: TeamProject[];
  uniqueMembers: { id: string; name: string | null; email: string; image: string | null; projects: { id: string; key: string | null }[] }[];
};

type ProjectCardData = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  progress: number;         // % done
  totalTasks: number;
  doneTasks: number;
  membersCount: number;
  createdAt: string;
};

type Task = {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string;
  deadline: string; // ISO date
  tags: string[];
  comments: number;
  attachments: number;
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  order: number | null;
  project: { id: string; name: string; key?: string | null };
  column?: { id: string; name: string } | null;
  assignees?: { user: { id: string; name: string | null; email: string } }[];
};

type TasksResp = {
  items: TaskRow[];
  total: number;
  page: number;
  pageSize: number;
  projects: { id: string; name: string; key?: string | null }[];
};

const Dashboard = () => {
  const [activeTab, setActiveTab] =
    useState<'dashboard'|'projects'|'tasks'|'kanban'|'calendar'|'team'|'reports'>('projects');
  const [userRole] = useState<'Project Manager'|'Project Member'>('Project Manager');

  const [showInviteModal, setShowInviteModal] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);
  const router = useRouter();

  // ----- mock data (đưa vào state để modal có thể add item demo) -----
   const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [errProjects, setErrProjects] = useState<string | null>(null);

  const [showSprintModal, setShowSprintModal] = useState(false);
const [sprintProjectId, setSprintProjectId] = useState<string | null>(null);

const [teamData, setTeamData] = useState<TeamResponse | null>(null);
const [teamLoading, setTeamLoading] = useState(false);
const [teamErr, setTeamErr] = useState<string | null>(null);

const [tasksData, setTasksData] = useState<TasksResp | null>(null);
const [tasksLoading2, setTasksLoading2] = useState(false);
const [tasksErr2, setTasksErr2] = useState<string | null>(null);

const [taskQ, setTaskQ] = useState("");
const [taskStatus, setTaskStatus] = useState<string>("");
const [taskProject, setTaskProject] = useState<string>("");
const [taskPage, setTaskPage] = useState(1);

const [assignOpen, setAssignOpen] = useState(false);
const [assignTask, setAssignTask] = useState<{ id: string, projectId: string } | null>(null);

async function loadTasksAgg() {
  try {
    setTasksLoading2(true);
    setTasksErr2(null);
    const params = new URLSearchParams();
    if (taskQ.trim()) params.set("q", taskQ.trim());
    if (taskStatus) params.set("status", taskStatus);
    if (taskProject) params.set("projectId", taskProject);
    params.set("page", String(taskPage));
    params.set("pageSize", "20");

    const res = await fetch(`/api/tasks?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: TasksResp = await res.json();
    setTasksData(data);
  } catch (e: any) {
    setTasksErr2(e.message || "Không tải được danh sách task");
  } finally {
    setTasksLoading2(false);
  }
}

// nạp khi vào tab tasks hoặc khi filter thay đổi
useEffect(() => {
  if (activeTab === "tasks") loadTasksAgg();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, taskQ, taskStatus, taskProject, taskPage]);

async function loadTeam() {
  try {
    setTeamLoading(true);
    setTeamErr(null);
    const res = await fetch('/api/team', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: TeamResponse = await res.json();
    setTeamData(data);
  } catch (e: any) {
    setTeamErr(e.message || 'Không tải được danh sách thành viên');
  } finally {
    setTeamLoading(false);
  }
}

// nạp khi đổi sang tab "team"
useEffect(() => {
  if (activeTab === 'team') loadTeam();
}, [activeTab]);

  async function loadProjects() {
    try {
      setLoadingProjects(true);
      setErrProjects(null);
      const res = await fetch('/api/projects?withStats=1', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();   // { items: ProjectCardData[] }
      setProjects(data.items || []);
    } catch (e: any) {
      setErrProjects(e.message || 'Không tải được danh sách dự án');
    } finally {
      setLoadingProjects(false);
    }
  }

async function seedBacklog(projectId: string) {
  if (!confirm("Seed 8 task mẫu vào Backlog của dự án này?")) return;
  const res = await fetch(`/api/projects/${projectId}/tasks/seed`, { method: "POST" });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    alert("Seed thất bại: " + (error || res.statusText));
    return;
  }
  alert("Đã thêm 8 task mẫu vào Backlog.");
  // nếu có trang chi tiết/kanban bạn có thể push tới đó hoặc refresh
  // router.push(`/projects/${projectId}`) hoặc loadProjects();
}

  async function handleDeleteProject(id: string) {
  if (!confirm("Xoá dự án này? Hành động không thể hoàn tác.")) return;
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  if (res.ok) {
    // nếu bạn đã có loadProjects()
    await loadProjects();
  } else {
    const { error } = await res.json().catch(() => ({}));
    alert("Xoá thất bại: " + (error || res.statusText));
  }
}

  useEffect(() => { loadProjects(); }, []);
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Thiết kế UI/UX cho trang chủ',
      description: 'Tạo mockup và prototype cho trang chủ website',
      status: 'in-progress',
      priority: 'high',
      assignee: 'Nguyễn Văn A',
      deadline: '2025-01-30',
      tags: ['UI/UX', 'Frontend'],
      comments: 3,
      attachments: 2
    },
    {
      id: 2,
      title: 'Phát triển API authentication',
      description: 'Xây dựng hệ thống đăng nhập và phân quyền',
      status: 'todo',
      priority: 'high',
      assignee: 'Trần Thị B',
      deadline: '2025-02-05',
      tags: ['Backend', 'API'],
      comments: 1,
      attachments: 0
    }
  ]);

  const [selectedProject] = useState<ProjectCardData | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);


  const [notifications] = useState([
    { id: 1, type: 'task', title: 'Nhiệm vụ mới được giao', time: '2 phút trước', read: false },
    { id: 2, type: 'deadline', title: 'Deadline sắp đến', time: '1 giờ trước', read: false },
    { id: 3, type: 'comment', title: 'Bình luận mới', time: '3 giờ trước', read: true }
  ]);

  // ----- helpers -----
  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getPriorityColor = (priority: 'low'|'medium'|'high') =>
    priority === 'low' ? 'text-green-500' :
    priority === 'medium' ? 'text-yellow-500' :
    'text-red-500';

  // ----- cards -----
  const TaskCard = ({ task }: { task: Task }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <Flag className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
          <h3 className="font-semibold text-gray-900 text-sm">{task.title}</h3>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <p className="text-gray-600 text-sm mb-3">{task.description}</p>

      <div className="flex items-center space-x-2 mb-3">
        {task.tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
            {task.status === 'todo' ? 'Chưa làm'
              : task.status === 'in-progress' ? 'Đang làm'
                : task.status === 'review' ? 'Đánh giá' : 'Hoàn thành'}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-gray-500">
          <div className="flex items-center space-x-1">
            <MessageSquare className="w-4 h-4" />
            <span>{task.comments}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FolderOpen className="w-4 h-4" />
            <span>{task.attachments}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-sm text-gray-600">👤 {task.assignee}</span>
        <span className="text-sm text-gray-500">📅 {new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
      </div>
    </div>
  );

  const ProjectCard = ({ project }: { project: ProjectCardData }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-4 text-gray-900">
        <div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">{project.name}</h3>
          <p className="text-gray-600 text-sm">{project.description ?? '—'}</p>
        </div>
        <ProjectMore
  id={project.id}
  status={(project as any).status}
  onChanged={loadProjects}
/>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Tiến độ</span>
          <span className="text-sm text-gray-600">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {project.doneTasks}/{project.totalTasks}
          </div>
          <div className="text-sm text-gray-600">Nhiệm vụ</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{project.membersCount}</div>
          <div className="text-sm text-gray-600">Thành viên</div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-600">
          Tạo: {new Date(project.createdAt).toLocaleDateString('vi-VN')}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/projects/${project.id}`)}
            className="cursor-pointer px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 transition-colors"
          >
            Chi tiết
          </button>
          {userRole === 'Project Manager' && (
            <button
              onClick={() => router.push(`/projects/${project.id}/settings`)}
              className="cursor-pointer px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200 transition-colors"
            >
              Quản lý
            </button>
          )}
           <button
    onClick={() => { setSprintProjectId(project.id); setShowSprintModal(true); }}
    className="cursor-pointer px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-sm hover:bg-indigo-200 transition-colors"
  >
    Tạo sprint
  </button>

  {/* === NÚT SEED BACKLOG === */}
  <button
    onClick={() => seedBacklog(project.id)}
    className="cursor-pointer px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-sm hover:bg-amber-200 transition-colors"
  >
    Seed backlog
  </button>

           <button
    onClick={() => handleDeleteProject(project.id)}
    className="cursor-pointer px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
  >
    Xoá
  </button>
        </div>
      </div>
    </div>
  );

  // ----- UI -----
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="cursor-pointer flex items-center space-x-2" 
              onClick={() => router.push('/')}
              >
                <Rocket className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">DVTManagement</span>
              </div>
              <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                {userRole}
              </span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm dự án, nhiệm vụ..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                  <Bell className="w-6 h-6" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                  )}
                </button>
              </div>

              {/* Add Button */}
              {userRole === 'Project Manager' && (
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Tạo dự án</span>
                </button>
              )}

              {/* Profile */}
              <div
  className="flex items-center space-x-3 cursor-pointer group"
  onClick={() => router.push('/profile')}
  role="button"
  aria-label="Mở hồ sơ cá nhân"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && router.push('/profile')}
  title="Hồ sơ cá nhân"
>
  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600
                  flex items-center justify-center text-white font-semibold
                  ring-0 group-hover:ring-2 ring-blue-300 transition">
    A
  </div>
</div>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Home className="w-5 h-5" />
                  <span>Tổng quan</span>
                </button>

                <button
                  onClick={() => setActiveTab('projects')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'projects' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <FolderOpen className="w-5 h-5" />
                  <span>Dự án</span>
                </button>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'tasks' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Nhiệm vụ</span>
                </button>

                <button
                  onClick={() => setActiveTab('kanban')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'kanban' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Kanban className="w-5 h-5" />
                  <span>Kanban</span>
                </button>

                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'calendar' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span>Lịch</span>
                </button>

                <button
                  onClick={() => setActiveTab('team')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'team' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Users className="w-5 h-5" />
                  <span>Nhóm</span>
                </button>

                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Báo cáo</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Main */}
          <main className="flex-1">
              {activeTab === 'projects' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dự án của tôi</h1>
            <button
              onClick={() => setShowProjectForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo dự án</span>
            </button>
          </div>

          {loadingProjects ? (
            <div className="text-gray-500">Đang tải...</div>
          ) : errProjects ? (
            <div className="text-red-600">{errProjects}</div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-gray-600">
              Chưa có dự án nào. Hãy tạo dự án đầu tiên!
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}
        </div>
      )}

            {activeTab === 'tasks' && (
  <div className="text-gray-900">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Tổng Hợp Nhiệm Vụ</h1>
    </div>
     
    {/* Filters */}
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
      <input
        value={taskQ}
        onChange={(e) => { setTaskPage(1); setTaskQ(e.target.value); }}
        placeholder="Tìm theo tiêu đề/mô tả…"
        className="flex-1 min-w-[220px] border rounded-lg px-3 py-2"
      />
      <select
        value={taskProject}
        onChange={(e) => { setTaskPage(1); setTaskProject(e.target.value); }}
        className="border rounded-lg px-3 py-2"
      >
        <option value="">Tất cả dự án</option>
        {(tasksData?.projects ?? []).map(p => (
          <option key={p.id} value={p.id}>
            {(p.key ? `${p.key} — ` : '') + p.name}
          </option>
        ))}
      </select>
      <select
        value={taskStatus}
        onChange={(e) => { setTaskPage(1); setTaskStatus(e.target.value); }}
        className="border rounded-lg px-3 py-2"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="TODO">TODO</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="REVIEW">REVIEW</option>
        <option value="BLOCKED">BLOCKED</option>
        <option value="DONE">DONE</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>
    </div>

    {/* List */}
    {tasksLoading2 && <div className="text-gray-500">Đang tải...</div>}
    {tasksErr2 && <div className="text-red-600">{tasksErr2}</div>}

    {!tasksLoading2 && !tasksErr2 && (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Task</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Dự án</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Cột</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Hạn</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Assignees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(tasksData?.items ?? []).map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{t.title}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {t.project.key ? `${t.project.key} — ` : ''}{t.project.name}
                    </span>
                  </td>
                  <td className="px-6 py-3">{t.column?.name ?? 'Backlog'}</td>
                  <td className="px-6 py-3">
                    
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      {t.status === 'DONE' ? 'bg-green-100 text-green-800'
                        : t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800'
                        : t.status === 'REVIEW' ? 'bg-purple-100 text-purple-800'
                        : t.status === 'BLOCKED' ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'}">
                      {t.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                  </td>
                  
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {(t.assignees ?? []).map(a => a.user.name || a.user.email).join(', ') || '—'}
                  </td>
                  <td className="px-6 py-3">
        <button
          className="text-blue-600 hover:underline text-sm"
          onClick={() => { setAssignTask({ id: t.id, projectId: t.project.id }); setAssignOpen(true); }}
        >
          Giao việc
        </button>
      </td>
                </tr>
              ))}
              {(tasksData?.items.length ?? 0) === 0 && (
                <tr><td className="px-6 py-10 text-center text-gray-500" colSpan={6}>Không có task</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination đơn giản */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
          <div>
            Tổng: {tasksData?.total ?? 0}
          </div>
          <div className="space-x-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={taskPage <= 1}
              onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={(tasksData?.page ?? 1) * (tasksData?.pageSize ?? 20) >= (tasksData?.total ?? 0)}
              onClick={() => setTaskPage((p) => p + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}
            {activeTab === 'kanban' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Bảng Kanban</h1>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <Plus className="w-4 h-4" />
                    <span>Thêm cột</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {['Chưa làm', 'Đang làm', 'Đánh giá', 'Hoàn thành'].map(col => (
                    <div key={col} className="bg-gray-100 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4">{col}</h3>
                      <div className="space-y-3">
                        {tasks
                          .filter(task => {
                            if (col === 'Chưa làm') return task.status === 'todo';
                            if (col === 'Đang làm') return task.status === 'in-progress';
                            if (col === 'Đánh giá') return task.status === 'review';
                            if (col === 'Hoàn thành') return task.status === 'done';
                            return false;
                          })
                          .map(task => (
                            <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                              <h4 className="font-medium text-sm mb-2">{task.title}</h4>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>👤 {task.assignee.split(' ')[0]}</span>
                                <Flag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Thành viên nhóm</h1>
      <button
        onClick={() => setShowInviteModal(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <UserPlus className="w-4 h-4" />
        <span>Mời thành viên</span>
      </button>
    </div>

    {teamLoading && <div className="text-gray-500">Đang tải...</div>}
    {teamErr && <div className="text-red-600">{teamErr}</div>}

    {!teamLoading && !teamErr && teamData && (
      <div className="space-y-8">
        {/* A) Danh sách thành viên duy nhất */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tổng hợp thành viên</h2>
          {teamData.uniqueMembers.length === 0 ? (
            <div className="text-gray-600">Chưa có thành viên nào.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamData.uniqueMembers.map(u => (
                <div key={u.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                    {(u.name?.[0] || u.email[0]).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">{u.name || u.email}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Tham gia: {u.projects.map(p => p.key || '—').join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* B) Theo từng dự án */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thành viên theo dự án</h2>
          <div className="space-y-6">
            {teamData.projects.map(p => (
              <div key={p.id} className="border border-gray-200 rounded-lg">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">{p.key}</span>
                  </div>
                  <span className="text-sm text-gray-500">{p._count.members} thành viên</span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {p.members.map(m => (
                    <div key={m.user.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold">
                        {(m.user.name?.[0] || m.user.email[0]).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{m.user.name || m.user.email}</div>
                        <div className="text-xs text-gray-500">{m.user.email}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
)}


            {activeTab === 'dashboard' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Chào mừng trở lại! 👋</h1>
                  <p className="text-gray-600">Đây là tổng quan về các dự án và nhiệm vụ của bạn</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FolderOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                        <p className="text-gray-600 text-sm">Dự án đang thực hiện</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                        <p className="text-gray-600 text-sm">Nhiệm vụ</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">3</p>
                        <p className="text-gray-600 text-sm">Thành viên (demo)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">85%</p>
                        <p className="text-gray-600 text-sm">Tiến độ trung bình</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity (PHẦN BẠN BẢO BỊ DỞ) */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h2>
                  <div className="space-y-4">
                    {[
                      { action: 'Hoàn thành nhiệm vụ', item: 'Thiết kế UI/UX', time: '2 giờ trước', type: 'success' },
                      { action: 'Thêm bình luận', item: 'API Authentication', time: '4 giờ trước', type: 'comment' },
                      { action: 'Tạo nhiệm vụ mới', item: 'Database Migration', time: '1 ngày trước', type: 'create' }
                    ].map((activity, idx) => (
                      <div key={idx} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'success' ? 'bg-green-500'
                            : activity.type === 'comment' ? 'bg-blue-500'
                              : 'bg-purple-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-gray-900">
                            {activity.action}:{' '}
                            <span className="font-medium">{activity.item}</span>
                          </p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
  
              {assignTask && (
  <AssignTaskModal
    open={assignOpen}
    onClose={() => setAssignOpen(false)}
    onAssigned={() => { setAssignOpen(false); loadTasksAgg(); }} // reload list
    taskId={assignTask.id}
    projectId={assignTask.projectId}
    // có thể truyền defaultAssignees/start/due/estimate nếu đã có
  />
)}

            {activeTab === 'calendar' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Lịch</h1>
                <p className="text-gray-600">Placeholder – sẽ đồng bộ Google Calendar ở bước sau.</p>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Báo cáo</h1>
                <p className="text-gray-600">Placeholder – biểu đồ burn-up/burn-down sẽ thêm sau.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ===== Modals: chỉ UI demo, chưa nối API ===== */}
      <ProjectCreateModal
open={showProjectForm}
        onClose={() => setShowProjectForm(false)}
        onCreated={() => { setShowProjectForm(false); loadProjects();
          
        }} // refresh list // hoặc /dashboard nếu bạn chưa có trang chi tiết
/>

    <SprintCreateModal
  projectId={sprintProjectId || ""}  // truyền id dự án được chọn
  open={showSprintModal}
  onClose={() => setShowSprintModal(false)}
  onCreated={() => {
    setShowSprintModal(false);
    // bạn có thể chuyển tới trang quản lý sprint hoặc refresh list
    // router.push(`/projects/${sprintProjectId}`);
  }}
/>

         {/* Modal mời thành viên */}
      <InviteMemberModal
  open={showInviteModal}
  onClose={() => setShowInviteModal(false)}
  onInvited={() => { setShowInviteModal(false); loadTeam(); }}
  defaultProjectId={teamData?.projects?.[0]?.id}
  projectOptions={(teamData?.projects ?? []).map(p => ({ id: p.id, name: p.name, key: p.key ?? undefined }))}
/>
      
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 text-gray-900">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Thêm nhiệm vụ</h3>
              <button onClick={() => setShowTaskForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const t: Task = {
                  id: Date.now(),
                  title: String(fd.get('title') || ''),
                  description: String(fd.get('description') || ''),
                  status: 'todo',
                  priority: (String(fd.get('priority') || 'medium') as Priority),
                  assignee: String(fd.get('assignee') || 'Chưa phân công'),
                  deadline: String(fd.get('deadline') || new Date().toISOString().slice(0, 10)),
                  tags: (String(fd.get('tags') || '')).split(',').map(s => s.trim()).filter(Boolean),
                  comments: 0,
                  attachments: 0
                };
                setTasks(prev => [t, ...prev]);
                setShowTaskForm(false);
              }}
              className="space-y-3"
            >
              <input name="title" className="w-full border rounded-lg px-3 py-2" placeholder="Tiêu đề" required />
              <textarea name="description" className="w-full border rounded-lg px-3 py-2" placeholder="Mô tả" rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <input name="assignee" className="border rounded-lg px-3 py-2" placeholder="Người phụ trách" />
                <input name="deadline" type="date" className="border rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select name="priority" className="border rounded-lg px-3 py-2">
                  <option value="low">Ưu tiên thấp</option>
                  <option value="medium" defaultValue="medium">Ưu tiên vừa</option>
                  <option value="high">Ưu tiên cao</option>
                </select>
                <input name="tags" className="border rounded-lg px-3 py-2" placeholder="Tag (phân tách dấu phẩy)" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTaskForm(false)} className="px-4 py-2 border rounded-lg">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">
                  Thêm nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
