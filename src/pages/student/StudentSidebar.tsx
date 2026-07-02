import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import htuLogo from "../../assets/HTU.png";

interface StudentSidebarProps {
  collapsed: boolean;
  activeItem?: string;
  onSelect?: (item: string) => void;
}

export function StudentSidebar({
  collapsed,
  activeItem = "dashboard",
  onSelect,
}: StudentSidebarProps) {
  const { logout } = useAuth();
  const [resultsOpen, setResultsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const handleSelect = (item: string) => onSelect?.(item);

  const itemBase =
    "flex items-center rounded-lg font-medium transition-colors w-full";
  const paddedRow = collapsed
    ? "px-3 py-3 justify-center"
    : "px-4 py-3 justify-start";
  const activeClass = "bg-white text-blue-700 shadow-md";
  const idleClass = "text-blue-100 hover:bg-blue-800/60 hover:text-white";

  const menuLabel = (text: string) => (
    <span
      className={
        collapsed
          ? "opacity-0 w-0 overflow-hidden ml-0 whitespace-nowrap transition-all duration-300"
          : "opacity-100 w-auto ml-3 whitespace-nowrap transition-all duration-300"
      }
    >
      {text}
    </span>
  );

  return (
    <aside
      className={`flex flex-col overflow-hidden bg-[#1e40af] text-white z-40 transition-all duration-300 ease-in-out h-screen fixed md:sticky top-0 ${
        collapsed
          ? "-translate-x-full md:translate-x-0 md:w-16"
          : "translate-x-0 w-72 md:w-72 shadow-2xl md:shadow-none"
      }`}
    >
      {/* Brand header — hidden when collapsed */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-blue-800/40 transition-all duration-300 ${
          collapsed ? "hidden" : ""
        }`}
      >
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

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {!collapsed && (
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
                collapsed ? "" : "justify-between"
              }`}
              title="Election Results"
            >
              <span className="flex items-center">
                <FolderClosed className="w-5 h-5 flex-shrink-0" />
                {menuLabel("Election Results")}
              </span>
              {!collapsed &&
                (resultsOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                ))}
            </button>
            {!collapsed && resultsOpen && (
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
              collapsed ? "" : "justify-between"
            }`}
            title="Slots"
          >
            <span className="flex items-center">
              <Award className="w-5 h-5 flex-shrink-0" />
              {menuLabel("Slots")}
            </span>
            {!collapsed && (
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
          {!collapsed && (
            <p className="text-xs text-blue-300 tracking-widest mb-3 px-2">
              ACCOUNT
            </p>
          )}
          <div className="space-y-1">
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              className={`${itemBase} ${paddedRow} ${idleClass} ${
                collapsed ? "" : "justify-between"
              }`}
              title="Settings"
            >
              <span className="flex items-center">
                <Settings className="w-5 h-5 flex-shrink-0" />
                {menuLabel("Settings")}
              </span>
              {!collapsed &&
                (settingsOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                ))}
            </button>
            {!collapsed && settingsOpen && (
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
          onClick={logout}
          className={`${itemBase} ${paddedRow} ${idleClass}`}
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {menuLabel("Sign Out")}
        </button>
      </div>
    </aside>
  );
}
