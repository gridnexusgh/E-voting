import { NavLink, Outlet } from 'react-router-dom';
import { Menu, X, Users, Building2, Grid, FilePlus, FileText, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { DashboardBranding } from '../../components/layout/DashboardBranding';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const profileName = user?.full_name || 'Administrator';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = [
    { to: '/admin', label: 'Overview', icon: ShieldCheck },
    { to: '/admin/faculties', label: 'Faculty Management', icon: Building2 },
    { to: '/admin/departments', label: 'Department Management', icon: Grid },
    { to: '/admin/students/import', label: 'Student Import', icon: FilePlus },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/audit', label: 'Audit Overview', icon: FileText },
    { to: '/admin/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-slate-300/40">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Admin Console</p>
              <p className="text-xs text-slate-500">{profileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-6 w-6 text-slate-900" /> : <Menu className="h-6 w-6 text-slate-900" />}
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-30 bg-slate-900/20" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.12)] transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-slate-300/40">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">Admin Console</p>
                <p className="text-xs text-slate-500">{profileName}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-4 lg:py-6 px-3 overflow-y-auto pt-20 lg:pt-6 space-y-1">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/admin'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_10px_30px_-20px_rgba(37,99,235,0.35)]'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 text-left">{l.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{profileName}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 hover:bg-slate-100 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 pt-16 lg:pt-0">
        

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
