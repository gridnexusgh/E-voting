import { ReactNode } from "react";
import { Menu, Bell } from "lucide-react";
import htuLogo from "../../assets/HTU.png";

interface DashboardBrandingProps {
  title?: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
  rightContent?: ReactNode;
}

export function DashboardBranding({
  title = "HTU ELECTION",
  subtitle = "E-VOTING SYSTEM",
  onToggleSidebar,
  rightContent,
}: DashboardBrandingProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {onToggleSidebar ? (
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}

          <div className="flex items-center gap-3">
            <img
              src={htuLogo}
              alt="HTU Logo"
              className="h-12 w-12 rounded-2xl border border-slate-200 object-contain bg-white"
            />
            <div>
              <p className="text-lg font-semibold text-slate-900">{title}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{subtitle}</p>
            </div>
          </div>
        </div>

        {rightContent ? (
          <div className="flex items-center gap-3">{rightContent}</div>
        ) : (
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
