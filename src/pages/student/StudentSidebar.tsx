import { useEffect, useState } from "react";
import {
  Home,
  Vote as VoteIcon,
  FolderClosed,
  Award,
  Megaphone,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Circle,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import htuLogo from "../../assets/HTU.png";

interface StudentSidebarProps {
  collapsed: boolean;
  activeItem?: string;
  onSelect?: (item: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function StudentSidebar({
  collapsed,
  activeItem = "dashboard",
  onSelect,
  mobileOpen = false,
  onMobileClose,
}: StudentSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Detect mobile viewport so we can override `collapsed` visual state
  // while the sidebar is used as a slide-out drawer.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const effectiveCollapsed = isMobile ? false : collapsed;

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* noop */
      }
      window.location.href = "/login";
      navigate("/login", { replace: true });
    }
  };

  const [resultsOpen, setResultsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const handleSelect = (item: string) => {
    onSelect?.(item);
    // Auto-dismiss the drawer on mobile so the content is instantly visible.
    if (isMobile) onMobileClose?.();
  };

  const itemBase =
    "flex items-center rounded-lg font-medium transition-colors w-full";
  const paddedRow = effectiveCollapsed
    ? "px-3 py-3 justify-center"
    : "px-4 py-3 justify-start";
  const activeClass = "bg-white/10 text-white rounded-xl shadow-md";
  const idleClass = "text-blue-100 hover:bg-white/5 hover:text-white";

  const menuLabel = (text: string) => (
    <span
      className={
        effectiveCollapsed
          ? "opacity-0 w-0 overflow-hidden ml-0 whitespace-nowrap transition-all duration-300"
          : "opacity-100 w-auto ml-3 whitespace-nowrap transition-all duration-300"
      }
    >
      {text}
    </span>
  );

  // Responsive container classes:
  // - Mobile: full-height slide-out drawer, controlled by `mobileOpen`.
  // - Desktop (md+): sticky column, width driven by `collapsed`.
  const containerClass = isMobile
    ? `fixed inset-y-0 left-0 z-50 w-64 shadow-2xl transform transition-transform duration-300 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`
    : `sticky top-0 transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-72"
      }`;

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`flex flex-col overflow-hidden bg-gradient-to-b from-[#0C1E4E] to-[#0E1E38] text-white h-screen ${containerClass}`}
      >
        {/* Brand header */}
        {!effectiveCollapsed && (
          <div className="flex items-center justify-between gap-3 px-4 py-5 border-b border-blue-800/40">
            <div className="flex items-center gap-3">
              <img
                src={htuLogo}
                alt="HTU"
                className="w-12 h-12 rounded-xl bg-white p-1 shadow flex-shrink-0"
              />
              <div className="leading-tight whitespace-nowrap">
                <p className="text-xl font-extrabold tracking-wide">HTU</p>
                <p className="text-[11px] text-blue-200 tracking-widest">
                  E-VOTING SYSTEM
                </p>
              </div>
            </div>

            {/* Explicit close button on mobile */}
            <button
              onClick={onMobileClose}
              className="md:hidden p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {!effectiveCollapsed && (
            <p className="text-xs text-blue-300 tracking-widest mb-3 px-2">
              MAIN MENU
            </p>
          )}

          <nav className="space-y-1">
            <button
              onClick={() => handleSelect("dashboard")}
              className={`${itemBase} ${paddedRow} ${
                activeItem === "dashboard" ? activeClass : idleClass
              }`}
              title="Dashboard"
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {menuLabel("Dashboard")}
            </button>

            <button
              onClick={() => handleSelect("vote")}
              className={`${itemBase} ${paddedRow} ${
                activeItem === "vote" ? activeClass : idleClass
              }`}
              title="Vote"
            >
              <VoteIcon className="w-5 h-5 flex-shrink-0" />
              {menuLabel("Vote")}
            </button>

            {/* Election Results dropdown */}
            <div>
              <button
                onClick={() => setResultsOpen((o) => !o)}
                className={`${itemBase} ${paddedRow} ${idleClass} ${
                  effectiveCollapsed ? "" : "justify-between"
                }`}
                title="Election Results"
              >
                <span className="flex items-center">
                  <FolderClosed className="w-5 h-5 flex-shrink-0" />
                  {menuLabel("Election Results")}
                </span>
                {!effectiveCollapsed &&
                  (resultsOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  ))}
              </button>
              {!effectiveCollapsed && resultsOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  {[
                    ["general", "General Election Result"],
                    ["faculty", "Faculty Election Result"],
                    ["department", "Department Election Result"],
                  ].map(([key, text]) => (
                    <button
                      key={key}
                      onClick={() => handleSelect(key)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-blue-100 hover:bg-blue-800/60 hover:text-white transition-colors"
                    >
                      <Circle className="w-2 h-2" />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleSelect("slots")}
              className={`${itemBase} ${paddedRow} ${idleClass} ${
                effectiveCollapsed ? "" : "justify-between"
              }`}
              title="Slots"
            >
              <span className="flex items-center">
                <Award className="w-5 h-5 flex-shrink-0" />
                {menuLabel("Slots")}
              </span>
              {!effectiveCollapsed && (
                <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded">
                  CLOSED
                </span>
              )}
            </button>

            <button
              onClick={() => handleSelect("announcement")}
              className={`${itemBase} ${paddedRow} ${idleClass}`}
              title="Announcement"
            >
              <Megaphone className="w-5 h-5 flex-shrink-0" />
              {menuLabel("Announcement")}
            </button>
          </nav>

          {/* Account */}
          <div className="mt-8">
            {!effectiveCollapsed && (
              <p className="text-xs text-blue-300 tracking-widest mb-3 px-2">
                ACCOUNT
              </p>
            )}
            <div className="space-y-1">
              <button
                onClick={() => setSettingsOpen((o) => !o)}
                className={`${itemBase} ${paddedRow} ${idleClass} ${
                  effectiveCollapsed ? "" : "justify-between"
                }`}
                title="Settings"
              >
                <span className="flex items-center">
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  {menuLabel("Settings")}
                </span>
                {!effectiveCollapsed &&
                  (settingsOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  ))}
              </button>
              {!effectiveCollapsed && settingsOpen && (
                <div className="ml-6 mt-1 space-y-1">
                  <button
                    onClick={() => handleSelect("reset-password")}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-blue-100 hover:bg-blue-800/60 hover:text-white transition-colors"
                  >
                    <Circle className="w-2 h-2" />
                    <span>Reset Password</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="p-3 border-t border-blue-800/40">
          <button
            onClick={handleSignOut}
            className={`${itemBase} ${paddedRow} ${idleClass}`}
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {menuLabel("Sign Out")}
          </button>
        </div>
      </aside>
    </>
  );
}
