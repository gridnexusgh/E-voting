// @ts-nocheck
import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Menu, X } from "lucide-react";
import { SlotManagementPage } from "./SlotManagementPage";
import { ElectionCreationPage } from "./ElectionCreationPage";
import { CandidateApprovalPage } from "./CandidateApprovalPage";
import { ApprovedCandidatesPage } from "./ApprovedCandidatesPage";
import { ElectionMonitoringPage } from "./ElectionMonitoringPage";
import { ElectionResultsPage } from "./ElectionResultsPage";
import { ElectionReportsPage } from "./ElectionReportsPage";
import { PaymentsPage } from "./PaymentsPage";
import {
  getActiveElections,
  getElectionStats,
  getPendingCandidates,
} from "../services/election";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: "fa-solid fa-house" },
  {
    id: "create-election",
    label: "Create Elections",
    icon: "fa-solid fa-square-plus",
  },
  {
    id: "positions",
    label: "Create Slots",
    icon: "fa-solid fa-list-check",
  },
  {
    id: "pending-approvals",
    label: "Pending Approvals",
    icon: "fa-solid fa-user-clock",
  },
  {
    id: "approved",
    label: "Approved Candidates",
    icon: "fa-solid fa-user-check",
  },
  {
    id: "monitoring",
    label: "Election Monitoring",
    icon: "fa-solid fa-chart-line",
  },
  { id: "results", label: "Results", icon: "fa-solid fa-trophy" },
  { id: "reports", label: "Reports", icon: "fa-solid fa-file-lines" },
  { id: "payments", label: "Payments", icon: "fa-solid fa-credit-card" },
];

export function ElectionOfficerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardStats, setDashboardStats] = useState({
    activeElections: 0,
    pendingApplications: 0,
    approvedCandidates: 0,
    votesCast: 0,
  });
  const [latestElectionName, setLatestElectionName] = useState<string>("No active election");
  const [latestElectionStatus, setLatestElectionStatus] = useState<string>("N/A");
  const [latestEligibleVoters, setLatestEligibleVoters] = useState<number>(0);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    async function loadDashboardData() {
      setDashboardLoading(true);
      setDashboardError("");

      try {
        const active = await getActiveElections(user.id);
        const electionIds = active.map((election) => election.id);

        const pendingCounts = await Promise.all(
          electionIds.map(async (electionId) => {
            const pending = await getPendingCandidates(electionId);
            return pending?.length ?? 0;
          }),
        );

        const statsList = await Promise.all(
          electionIds.map(async (electionId) => getElectionStats(electionId)),
        );

        const totals = statsList.reduce(
          (acc, stats) => {
            acc.approvedCandidates += stats.candidatesApproved;
            acc.votesCast += stats.totalVotesCast;
            return acc;
          },
          { approvedCandidates: 0, votesCast: 0 },
        );

        setDashboardStats({
          activeElections: active.length,
          pendingApplications: pendingCounts.reduce((sum, count) => sum + count, 0),
          approvedCandidates: totals.approvedCandidates,
          votesCast: totals.votesCast,
        });

        const latestElection = active[0];
        if (latestElection) {
          setLatestElectionName(latestElection.title);
          setLatestElectionStatus(latestElection.status.toUpperCase());
          setLatestEligibleVoters(latestElection.total_voters ?? 0);
        } else {
          setLatestElectionName("No active election");
          setLatestElectionStatus("N/A");
          setLatestEligibleVoters(0);
        }
      } catch (error) {
        console.error(error);
        setDashboardError("Unable to load dashboard metrics from backend.");
      } finally {
        setDashboardLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
  };

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">UEVS</h1>
            <p className="text-sm text-gray-500">Election Officer</p>
          </div>
          <button
            onClick={toggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-900 shadow-sm"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-blue-900 text-white p-4 shadow-xl transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:top-0 md:bottom-0 md:translate-x-0 md:w-64 md:p-6 md:shadow-none md:flex md:flex-col`}
      >
        <div className="mb-6 flex items-center justify-between md:block">
          <div>
            <h1 className="text-2xl font-bold">UEVS</h1>
            <p className="text-blue-200 text-sm">Election Officer</p>
          </div>
        </div>

        <nav className="space-y-2 mb-6 overflow-y-auto pr-1 md:mb-8 md:flex-1 md:min-h-0 md:overflow-y-auto md:pr-0">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                closeSidebar();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                activeTab === item.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              <span className="w-5 text-center text-sm">
                <i className={`${item.icon}`} />
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {activeTab === "dashboard" ? "Dashboard" : "Election Management"}
            </h2>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.full_name || "Officer"}
            </p>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {dashboardError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {dashboardError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Active Elections",
                  value: dashboardLoading ? "..." : String(dashboardStats.activeElections),
                  icon: "fa-solid fa-calendar-days",
                  iconBg: "bg-blue-100 text-blue-600",
                },
                {
                  title: "Pending Applications",
                  value: dashboardLoading ? "..." : String(dashboardStats.pendingApplications),
                  icon: "fa-solid fa-hourglass-half",
                  iconBg: "bg-orange-100 text-orange-600",
                },
                {
                  title: "Approved Candidates",
                  value: dashboardLoading ? "..." : String(dashboardStats.approvedCandidates),
                  icon: "fa-solid fa-user-check",
                  iconBg: "bg-emerald-100 text-emerald-600",
                },
                {
                  title: "Votes Cast",
                  value: dashboardLoading ? "..." : dashboardStats.votesCast.toLocaleString(),
                  icon: "fa-solid fa-chart-simple",
                  iconBg: "bg-violet-100 text-violet-600",
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-1">
                        {card.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {card.value}
                      </p>
                    </div>
                    <div className={`${card.iconBg} p-3 rounded-lg`}>
                      <i className={`${card.icon}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Election Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Election Name</p>
                  <p className="text-gray-900 font-semibold">
                    {dashboardLoading ? "Loading..." : latestElectionName}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Status</p>
                  <p className="text-green-600 font-semibold">{dashboardLoading ? "..." : latestElectionStatus}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Eligible Voters</p>
                  <p className="text-gray-900 font-semibold">{dashboardLoading ? "..." : latestEligibleVoters.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "create-election" ? (
          <ElectionCreationPage />
        ) : activeTab === "positions" ? (
          <SlotManagementPage />
        ) : activeTab === "pending-approvals" ? (
          <CandidateApprovalPage />
        ) : activeTab === "approved" ? (
          <ApprovedCandidatesPage />
        ) : activeTab === "monitoring" ? (
          <ElectionMonitoringPage />
        ) : activeTab === "results" ? (
          <ElectionResultsPage />
        ) : activeTab === "reports" ? (
          <ElectionReportsPage />
        ) : activeTab === "payments" ? (
          <PaymentsPage />
        ) : activeTab !== "dashboard" ? (
          <div className="bg-white rounded-xl shadow-md p-12 border border-gray-100 text-center">
            <i className="fa-solid fa-construction text-4xl text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-600">
              The {sidebarItems.find((item) => item.id === activeTab)?.label}{" "}
              module is under development.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
