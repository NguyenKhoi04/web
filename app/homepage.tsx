// apps/web/app/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from "next/navigation";
import { Menu, X, ChevronRight, Play, Users, Calendar, BarChart3, Bell, GitBranch, Rocket } from 'lucide-react';
import NotificationBell from "@/app/components/NotificationBell";

const ProjectHubHomepage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [counters, setCounters] = useState({ projects: 0, companies: 0, uptime: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const animateCounters = () => {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const stepDuration = duration / steps;

      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;

        setCounters({
          projects: Math.floor(1000 * progress),
          companies: Math.floor(50 * progress),
          uptime: parseFloat((99.9 * progress).toFixed(1))
        });

        if (step >= steps) {
          clearInterval(timer);
          setCounters({
            projects: 1000,
            companies: 50,
            uptime: 99.9
          });
        }
      }, stepDuration);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsElement = document.getElementById('stats');
    if (statsElement) {
      observer.observe(statsElement);
    }

    return () => {
      if (statsElement) observer.unobserve(statsElement);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const features = [
    {
      icon: <BarChart3 className="w-12 h-12 text-blue-500" />,
      title: "Kanban & Gantt",
      description: "Theo dõi tiến độ dự án trực quan với bảng Kanban linh hoạt và biểu đồ Gantt chi tiết cho quản lý thời gian hiệu quả."
    },
    {
      icon: <Bell className="w-12 h-12 text-green-500" />,
      title: "Thông báo Real-time",
      description: "Nhận thông báo tức thì qua Push, Email, Slack, Zalo với âm thanh tùy chỉnh. Không bỏ lỡ cập nhật quan trọng nào."
    },
    {
      icon: <Users className="w-12 h-12 text-purple-500" />,
      title: "Quản lý Nhóm",
      description: "Phân quyền linh hoạt cho từng thành viên, tạo nhóm làm việc và theo dõi hiệu suất đội ngũ một cách chi tiết."
    },
    {
      icon: <GitBranch className="w-12 h-12 text-orange-500" />,
      title: "Tích hợp Git & DevOps",
      description: "Kết nối trực tiếp với repository Git, quản lý môi trường test/staging và theo dõi deployment tự động."
    },
    {
      icon: <Calendar className="w-12 h-12 text-indigo-500" />,
      title: "Lịch thông minh",
      description: "Đồng bộ Google Calendar, đặt milestone, nhắc hạn tự động và quản lý thời gian cá nhân trong dự án."
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-pink-500" />,
      title: "Báo cáo & Phân tích",
      description: "Biểu đồ burn-down/burn-up, thống kê hiệu suất, phát hiện điểm nghẽn và tối ưu quy trình làm việc."
    }
  ];

  const displayName =
    session?.user?.name ||
    session?.user?.email?.split('@')[0] ||
    undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white/95 backdrop-blur-md shadow-lg'
        : 'bg-white/10 backdrop-blur-md'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Rocket className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold text-white">DVTManagement</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-white hover:text-white/80 transition-colors font-medium"
              >
                Tính năng
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-white hover:text-white/80 transition-colors font-medium"
              >
                Giá cả
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-white hover:text-white/80 transition-colors font-medium"
              >
                Giới thiệu
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-white hover:text-white/80 transition-colors font-medium"
              >
                Liên hệ
              </button>
            </nav>

            {/* Auth Buttons */}
            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {status === 'loading' ? (
                <button className="px-6 py-2 border rounded" disabled>Đang tải…</button>
              ) : session ? (
                <div className="flex items-center gap-3 font-bold">
                  <span className="text-sm">Xin Chào: <b>{displayName}</b></span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="cursor-pointer font-bold px-4 py-2 border rounded hover:bg-white hover:text-purple-600 transition-all duration-300"
                  >
                    Đăng Xuất
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/sign-in')}
                  className="cursor-pointer px-6 py-2 text-white border-2 border-white rounded-full hover:bg-white hover:text-purple-600 transition-all duration-300"
                >
                  Đăng nhập
                </button>
              )}


              <NotificationBell />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/20">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection('features')}
                  className="cursor-pointer text-white hover:text-white/80 transition-colors text-left"
                >
                  Tính năng
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="cursor-pointertext-white hover:text-white/80 transition-colors text-left"
                >
                  Giá cả
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="cursor-pointertext-white hover:text-white/80 transition-colors text-left"
                >
                  Giới thiệu
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="cursor-pointer text-white hover:text-white/80 transition-colors text-left"
                >
                  Liên hệ
                </button>
                <div className="flex flex-col space-y-2 pt-4">
                  <button className="px-6 py-2 text-white border-2 border-white rounded-full hover:bg-white hover:text-purple-600 transition-all duration-300">
                    Đăng nhập
                  </button>
                  <button className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-300">
                    Dùng thử miễn phí
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-bounce mb-8">
            <Rocket className="w-16 h-16 text-white mx-auto" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 mb-6">
            Quản lý Dự án CNTT Hiện đại
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Nền tảng toàn diện giúp đội ngũ CNTT quản lý dự án hiệu quả với Kanban, Gantt, thông báo real-time và tích hợp đa dạng
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={() => router.push('/dashboard')} className="cursor-pointer group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
              <Rocket className="w-5 h-5" />
              <span className="font-semibold">Bắt đầu ngay</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Khám phá những tính năng mạnh mẽ giúp đội ngũ của bạn làm việc hiệu quả hơn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 mb-2">
                {counters.projects}+
              </h3>
              <p className="text-white/90 text-lg font-medium">Dự án đã hoàn thành</p>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 mb-2">
                {counters.companies}+
              </h3>
              <p className="text-white/90 text-lg font-medium">Công ty tin dùng</p>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 mb-2">
                {counters.uptime}%
              </h3>
              <p className="text-white/90 text-lg font-medium">Uptime đảm bảo</p>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 mb-2">
                24/7
              </h3>
              <p className="text-white/90 text-lg font-medium">Hỗ trợ kỹ thuật</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Sẵn sàng tăng hiệu suất dự án?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Tham gia cùng hàng ngàn đội ngũ CNTT đang sử dụng DVTManagement để quản lý dự án hiệu quả hơn
          </p>
          <button className="group inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
            <span>🎯</span>
            <span>Dùng thử 30 ngày miễn phí</span>
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Rocket className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold">DVTManagement</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Nền tảng quản lý dự án CNTT hiện đại, giúp đội ngũ làm việc hiệu quả và đạt mục tiêu nhanh hơn.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-4">Sản phẩm</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Quản lý dự án</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Theo dõi thời gian</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Báo cáo phân tích</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">API tích hợp</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-4">Hỗ trợ</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Tài liệu</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Video hướng dẫn</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Liên hệ hỗ trợ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Cộng đồng</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-blue-400 mb-4">Công ty</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Về chúng tôi</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Tuyển dụng</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2025 DVTManagement. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProjectHubHomepage;