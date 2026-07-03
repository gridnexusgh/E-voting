import { type LucideIcon } from 'lucide-react';

interface AuditorNavCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  onClick?: () => void;
}

export function AuditorNavCard({ title, description, icon: Icon, accent, onClick }: AuditorNavCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className={`flex-shrink-0 rounded-xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 truncate">{description}</p>
        </div>
      </div>
    </button>
  );
}
