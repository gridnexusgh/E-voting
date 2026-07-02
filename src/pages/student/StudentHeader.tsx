import { Menu, Bell } from "lucide-react";
import htuLogo from "../../assets/HTU.png";

interface StudentHeaderProps {
  onToggleSidebar: () => void;
}

export function StudentHeader({ onToggleSidebar }: StudentHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] border-b border-white/10 shadow-lg text-white backdrop-blur">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold tracking-wide text-lg">
            HTU ELECTION
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full hover:bg-white/10 text-slate-200 transition-colors"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#0C1E4E]" />
          </button>
          <img
            src={htuLogo}
            alt="HTU Emblem"
            className="w-10 h-10 rounded-full object-contain bg-white/10 p-1 border border-white/10"
          />
        </div>
      </div>
    </header>

  );
}
