// app/profile/page.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";

const Schema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên"),
  title: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  timezone: z.string().min(1),
  image: z.string().url("URL ảnh không hợp lệ").optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  links: z.object({
    github: z.string().url().optional().or(z.literal("")),
    linkedin: z.string().url().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
  }).partial().optional(),
});

type FormInput = z.infer<typeof Schema>;

export default function ProfilePage() {
  const router = useRouter();
  const { status } = useSession(); // chỉ để biết đã đăng nhập chưa
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, reset, watch } =
    useForm<FormInput>({
      resolver: zodResolver(Schema),
      defaultValues: {
        name: "",
        title: "",
        phone: "",
        timezone: "Asia/Ho_Chi_Minh",
        image: "",
        bio: "",
        links: { github: "", linkedin: "", website: "" },
      },
    });

  // Lấy dữ liệu ban đầu
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        // Bạn có thể dùng bất kỳ endpoint GET nào đang có để trả user hiện tại
        // ví dụ /api/me (tự tạo) hoặc /api/profile/me
        const r = await fetch("/api/profile/me", { cache: "no-store" });
        if (r.ok) {
          const u = await r.json();
          reset({
            name: u.name ?? "",
            title: u.title ?? "",
            phone: u.phone ?? "",
            timezone: u.timezone ?? "Asia/Ho_Chi_Minh",
            image: u.image ?? "",
            bio: u.bio ?? "",
            links: u.links ?? { github: "", linkedin: "", website: "" },
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [status, router, reset]);

  const onSubmit = (values: FormInput) => {
    startTransition(async () => {
      const r = await fetch("/app-actions/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (r.ok) {
        alert("Đã lưu hồ sơ");
      } else {
        alert("Lưu thất bại");
      }
    });
  };

  const avatar = watch("image");

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto p-6 lg:p-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-48"></div>
                  <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-64"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto p-6 lg:p-8">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại Dashboard
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Hồ sơ cá nhân
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Cập nhật thông tin hiển thị của bạn
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden shadow-lg ring-4 ring-white dark:ring-slate-700">
                  {avatar
                    ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center text-white font-semibold text-lg">
                      {watch("name")?.charAt(0)?.toUpperCase() || "A"}
                    </div>}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-slate-700"></div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ảnh đại diện (URL)
                </label>
                <input
                  {...register("image")}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {errors.image && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {errors.image.message}
                </p>}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Thông tin cá nhân
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Tên hiển thị *
                </label>
                <input
                  {...register("name")}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠</span> {errors.name.message}
                </p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Chức danh
                </label>
                <input
                  {...register("title")}
                  placeholder="PM / Developer / QA..."
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Số điện thoại
                </label>
                <input
                  {...register("phone")}
                  placeholder="+84 xxx xxx xxx"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Múi giờ
                </label>
                <select
                  {...register("timezone")}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                  <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Giới thiệu (bio)
              </label>
              <textarea
                {...register("bio")}
                rows={4}
                placeholder="Chia sẻ một chút về bản thân bạn..."
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Liên kết xã hội
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </label>
                <input
                  {...register("links.github")}
                  placeholder="https://github.com/username"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </label>
                <input
                  {...register("links.linkedin")}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  Website
                </label>
                <input
                  {...register("links.website")}
                  placeholder="https://yourwebsite.com"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex justify-end gap-4">
              <button
                type="reset"
                className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium"
              >
                Hủy
              </button>
              <button
                disabled={isPending}
                type="submit"
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang lưu...
                  </span>
                ) : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}