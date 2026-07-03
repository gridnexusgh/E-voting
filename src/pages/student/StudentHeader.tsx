import { DashboardBranding } from "../../components/layout/DashboardBranding";

interface StudentHeaderProps {
  onToggleSidebar: () => void;
}

export function StudentHeader({ onToggleSidebar }: StudentHeaderProps) {
  return (
    <DashboardBranding
      title="HTU ELECTION"
      subtitle="E-VOTING SYSTEM"
      onToggleSidebar={onToggleSidebar}
    />
  );
}
