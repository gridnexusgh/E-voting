import { Menu, Bell } from "lucide-react";
import htuLogo from "../../assets/HTU.png";

interface StudentHeaderProps {
  onToggleSidebar: () => void;
}

export function StudentHeader({ onToggleSidebar }: StudentHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-blue-700 font-bold tracking-wide text-lg">
            HTU ELECTION
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
          <img
            src={htuLogo}
            alt="HTU Emblem"
            className="w-10 h-10 rounded-full object-contain"
          />
        </div>
      </div>
    </header>
  );
}
