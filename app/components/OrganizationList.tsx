import React, { useEffect, useState } from "react";
import { Plus, Users, Settings, Building } from "lucide-react";
import OrganizationCreateModal from "./OrganizationCreateModal";
import OrganizationMembersModal from "./OrganizationMembersModal";

type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
  projectCount: number;
  joinedAt: string;
};

const OrganizationList = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  useEffect(() => {
    loadOrgs();
  }, []);

  async function loadOrgs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/organizations");
      if (!res.ok) throw new Error("Failed to load organizations");
      const data = await res.json();
      setOrgs(data.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenMembers = (org: Organization) => {
    setSelectedOrg(org);
    setMembersOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổ chức của tôi</h1>
          <p className="text-gray-500">Quản lý các tổ chức và thành viên</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo tổ chức mới</span>
        </button>
      </div>

      {loading && <div className="text-gray-500">Đang tải...</div>}
      {error && (
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
      )}

      {!loading && !error && orgs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Chưa tham gia tổ chức nào
          </h3>
          <p className="text-gray-500 mt-2 mb-6">
            Hãy tạo tổ chức đầu tiên của bạn để bắt đầu làm việc nhóm
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tạo tổ chức ngay
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgs.map((org) => (
          <div
            key={org.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  {org.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {org.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      org.role === "OWNER"
                        ? "bg-yellow-100 text-yellow-800"
                        : org.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {org.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 border-t border-b border-gray-100 py-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {org.memberCount}
                </div>
                <div className="text-xs text-gray-500">Thành viên</div>
              </div>
              <div className="text-center border-l border-gray-100">
                <div className="text-xl font-bold text-gray-900">
                  {org.projectCount}
                </div>
                <div className="text-xs text-gray-500">Dự án</div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleOpenMembers(org)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <Users className="w-4 h-4" />
                <span>Thành viên</span>
              </button>

              {/* Future feature: Settings */}
              {/* <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                <Settings className="w-5 h-5" />
              </button> */}
            </div>
          </div>
        ))}
      </div>

      <OrganizationCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          loadOrgs();
        }}
      />

      {selectedOrg && (
        <OrganizationMembersModal
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
          orgId={selectedOrg.id}
          orgName={selectedOrg.name}
          currentUserRole={selectedOrg.role}
        />
      )}
    </div>
  );
};

export default OrganizationList;
