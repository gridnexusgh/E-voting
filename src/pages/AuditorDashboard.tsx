// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  LogOut,
  Calendar,
  Users,
  FileText,
  Shield,
  Eye,
  Settings,
  AlertTriangle,
  TrendingUp,
  Search,
  Menu,
  X,
  LayoutDashboard,
  BarChart3,
  Activity,
  Lock,
  UserCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAuditorDashboardData,
  getAuditorDashboardSummary,
  type AuditorActivityItem,
  type AuditorCandidateReview,
  type AuditorDashboardSummary,
  type AuditorElectionItem,
  type AuditorNotificationItem,
  type AuditorResultSummary,
  type AuditorSecurityAlert,
  type AuditorUserActivity,
} from '../services/auditor';
import { AuditorNavCard } from '../components/auditor/AuditorNavCard';

const statusStyles: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  closed: 'bg-slate-100 text-slate-700',
  results_published: 'bg-indigo-100 text-indigo-700',
  draft: 'bg-amber-100 text-amber-700',
  published: 'bg-sky-100 text-sky-700',
};

const severityStyles: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

type AuditorView = 'overview' | 'elections' | 'candidates' | 'results' | 'reports' | 'activity' | 'security' | 'notifications' | 'profile';

export function AuditorDashboard() {
  const { user, logout } = useAuth();
  const [elections, setElections] = useState<AuditorElectionItem[]>([]);
  const [auditActivity, setAuditActivity] = useState<AuditorActivityItem[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<AuditorSecurityAlert[]>([]);
  const [candidates, setCandidates] = useState<AuditorCandidateReview[]>([]);
  const [results, setResults] = useState<AuditorResultSummary[]>([]);
  const [activityLog, setActivityLog] = useState<AuditorUserActivity[]>([]);
  const [notifications, setNotifications] = useState<AuditorNotificationItem[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState(0);
  const [summary, setSummary] = useState<AuditorDashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<AuditorView>('overview');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [data, summaryData] = await Promise.all([getAuditorDashboardData(), getAuditorDashboardSummary()]);
      setElections(data.elections);
      setAuditActivity(data.auditActivity);
      setSecurityAlerts(data.securityAlerts);
      setCandidates(data.candidates);
      setResults(data.results);
      setActivityLog(data.activity);
      setNotifications(data.notifications);
      setRegisteredStudents(data.registeredStudents);
      setSummary(summaryData);
      setIsLoading(false);
    }

    loadData();
  }, []);

  async function refreshSummary() {
    try {
      setSummaryLoading(true);
      const s = await getAuditorDashboardSummary();
      setSummary(s);
    } catch (err) {
      // ignore - non-fatal, dashboard will keep showing previous data
      // could add toast notification here
    } finally {
      setSummaryLoading(false);
    }
  }

  const filteredElections = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return elections;
    return elections.filter((election) => election.title.toLowerCase().includes(term));
  }, [elections, searchQuery]);

  const completedElections = elections.filter((election) => election.status === 'closed' || election.status === 'results_published').length;
  const activeElections = elections.filter((election) => election.status === 'active').length;
  const totalVotesCast = elections.reduce((sum, election) => sum + election.totalVotesCast, 0);
  const totalVoters = elections.reduce((sum, election) => sum + election.totalVoters, 0);
  const turnoutPercentage = totalVoters > 0 ? Math.round((totalVotesCast / totalVoters) * 100) : 0;
  const auditLogCount = summary?.auditLogCount ?? auditActivity.length;
  const securityEventCount = summary?.securityEventCount ?? securityAlerts.length;
  const pendingCandidateCount = summary?.pendingCandidateCount ?? candidates.filter((candidate) => candidate.status.toLowerCase() === 'pending').length;

  const navItems: Array<{ key: AuditorView; label: string; icon: typeof LayoutDashboard; description: string }> = [
    { key: 'overview', label: 'Dashboard', icon: LayoutDashboard, description: 'At-a-glance monitoring' },
    { key: 'elections', label: 'Elections', icon: BarChart3, description: 'Review active and completed elections' },
    { key: 'candidates', label: 'Candidates', icon: Users, description: 'Inspect candidate submissions and review status' },
    { key: 'results', label: 'Published Results', icon: BarChart3, description: 'View announced outcomes and vote tallies' },
    { key: 'reports', label: 'Reports', icon: FileText, description: 'Audit reports and export-ready summaries' },
    { key: 'activity', label: 'User Activity', icon: Activity, description: 'Track auditor and system actions' },
    { key: 'security', label: 'Security', icon: Lock, description: 'Alerts and integrity checks' },
    { key: 'notifications', label: 'Notifications', icon: Bell, description: 'Pending review items and reminders' },
    { key: 'profile', label: 'Profile', icon: UserCircle, description: 'Own account and password settings' },
  ];

  const renderContent = () => {
    if (activeView === 'elections') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Election monitoring</h2>
                <p className="text-sm text-gray-600">Inspect all election lifecycle states, turnout status, and integrity checkpoints.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-green-500"
                  placeholder="Search election"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-sm text-gray-500">Loading election data…</div>
            ) : filteredElections.map((election) => (
              <div key={election.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{election.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[election.status] || 'bg-gray-100 text-gray-700'}`}>
                        {election.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{election.category} election • {election.resultsPublished ? 'Results published' : 'Results pending'}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{election.totalVotesCast.toLocaleString()} / {election.totalVoters.toLocaleString()} votes</p>
                    <p className="mt-1">Voting window: {election.votingStart ? new Date(election.votingStart).toLocaleDateString() : 'TBD'} to {election.votingEnd ? new Date(election.votingEnd).toLocaleDateString() : 'TBD'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeView === 'candidates') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Candidate information</h2>
            <p className="text-sm text-gray-600 mt-1">Review submitted candidates and verify that approvals match campaign and eligibility expectations.</p>
          </div>
          <div className="grid gap-4">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{candidate.candidateName}</p>
                    <p className="text-sm text-gray-600">{candidate.position} • {candidate.electionTitle}</p>
                    <p className="text-sm text-gray-600 mt-2">{candidate.manifestoPreview}</p>
                  </div>
                  <div className="text-sm text-gray-600 lg:text-right">
                    <p className="font-medium text-gray-900">Status: {candidate.status}</p>
                    <p className="mt-1">Submitted {new Date(candidate.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeView === 'results') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Published results</h2>
            <p className="text-sm text-gray-600 mt-1">Review official results released by election officers and confirm publication status.</p>
          </div>
          <div className="grid gap-4">
            {results.map((result) => (
              <div key={result.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{result.electionTitle}</p>
                    <p className="text-sm text-gray-600">Winner: {result.winner}</p>
                  </div>
                  <div className="text-sm text-gray-600 lg:text-right">
                    <p>{result.voteCount.toLocaleString()} votes</p>
                    <p className="mt-1">Status: {result.status} • {new Date(result.publishedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeView === 'reports') {
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-violet-600" />
              <h2 className="text-xl font-bold text-gray-900">Compliance reports</h2>
            </div>
            <p className="text-sm text-gray-600">Generate and review reports on election integrity, turnout, and vote verification.</p>
            <div className="mt-6 rounded-xl bg-violet-50 border border-violet-200 p-4 text-sm text-violet-700">
              Export-ready summaries can be prepared for university oversight committees.
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-900">Turnout summaries</h2>
            </div>
            <p className="text-sm text-gray-600">Track how participation changes across university, faculty, and department elections.</p>
            <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
              Current average turnout is {turnoutPercentage}% across monitored elections.
            </div>
          </div>
        </div>
      );
    }

    if (activeView === 'activity') {
      return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">User activity logs</h2>
          <p className="text-sm text-gray-600 mt-1">Track actions taken by auditors, administrators, and system processes.</p>
          <div className="mt-6 space-y-3">
            {activityLog.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{entry.action}</p>
                    <p className="text-sm text-gray-600">{entry.target}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-gray-500">{entry.actor}</span>
                </div>
                <p className="text-xs mt-2 text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeView === 'security') {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-gray-900">Security monitoring</h2>
            </div>
            <div className="space-y-3">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className={`rounded-xl border p-3 ${severityStyles[alert.severity] || severityStyles.warning}`}>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm mt-1">{alert.detail}</p>
                  <p className="text-xs mt-2 opacity-80">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Audit trails</h2>
            </div>
            <div className="space-y-3">
              {auditActivity.map((entry) => (
                <div key={entry.id} className={`rounded-xl border p-3 ${severityStyles[entry.severity] || severityStyles.info}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{entry.title}</p>
                      <p className="text-sm mt-1">{entry.detail}</p>
                    </div>
                    <span className="text-xs uppercase tracking-wide">{entry.actor}</span>
                  </div>
                  <p className="text-xs mt-2 opacity-80">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeView === 'notifications') {
      return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-600 mt-1">Stay informed about pending review items and important audit events.</p>
          <div className="mt-6 space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className={`rounded-xl border p-4 ${notification.read ? 'bg-gray-50 border-gray-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeView === 'profile') {
      return (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.full_name || 'Auditor'}</h2>
                <p className="text-sm text-gray-600">Read-only auditor account</p>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Auditors can view elections, candidates, results, reports, logs, notifications, and their own profile. They cannot create, edit, delete, or publish results.
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account controls</h2>
            <div className="space-y-3">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">Change password</p>
                <p className="text-sm text-gray-600">Use the shared authentication flow to update your temporary password after first sign-in.</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">Session security</p>
                <p className="text-sm text-gray-600">All auditor actions are logged and monitored for accountability.</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">Account source</p>
                <p className="text-sm text-gray-600">This account is created by the system administrator and assigned the auditor role.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 p-6 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-100">UEVS Auditor</p>
              <h2 className="mt-2 text-2xl font-semibold">Oversight and compliance workspace</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50/90">
                Monitor election lifecycles, validate candidate submissions, inspect published results, and review security evidence without changing official voting data.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">Role scope</p>
              <p className="mt-1 text-sm font-medium text-white">Read-only oversight • evidence review • compliance monitoring</p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
          <div className="rounded-[16px] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)] border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{elections.length}</p>
                <p className="text-sm text-slate-500">Elections under review</p>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)] border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{registeredStudents}</p>
                <p className="text-sm text-slate-500">Registered students</p>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)] border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{auditActivity.length}</p>
                <p className="text-sm text-slate-500">Recent audit events</p>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)] border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{turnoutPercentage}%</p>
                <p className="text-sm text-slate-500">Average turnout</p>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)] border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{auditLogCount}</p>
                <p className="text-sm text-slate-500">Audit log entries</p>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)] border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{securityEventCount}</p>
                <p className="text-sm text-slate-500">Security alerts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Auditor workspace</h2>
                <p className="text-sm text-gray-600">Monitor elections, review candidates, inspect results, and oversee reporting activities.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <AuditorNavCard
                title="Election monitoring"
                description="Review active and completed ballots, voter turnout, and election status."
                icon={BarChart3}
                accent="bg-emerald-100 text-emerald-700"
                onClick={() => setActiveView('elections')}
              />
              <AuditorNavCard
                title="Candidate information"
                description="Inspect submitted candidate profiles and approval status."
                icon={Users}
                accent="bg-sky-100 text-sky-700"
                onClick={() => setActiveView('candidates')}
              />
              <AuditorNavCard
                title="Published results"
                description="Review released winners and vote counts for completed elections."
                icon={BarChart3}
                accent="bg-violet-100 text-violet-700"
                onClick={() => setActiveView('results')}
              />
              <AuditorNavCard
                title="Security & audit"
                description="Investigate security alerts, audit trails, and suspicious activity."
                icon={Shield}
                accent="bg-amber-100 text-amber-700"
                onClick={() => setActiveView('security')}
              />
              <AuditorNavCard
                title="Compliance reports"
                description="View reports and export-ready summaries for oversight review."
                icon={FileText}
                accent="bg-indigo-100 text-indigo-700"
                onClick={() => setActiveView('reports')}
              />
              <AuditorNavCard
                title="Notifications"
                description="Review pending reminders and critical watch items."
                icon={Bell}
                accent="bg-rose-100 text-rose-700"
                onClick={() => setActiveView('notifications')}
              />
              <AuditorNavCard
                title="Profile & access"
                description="Manage your own settings while preserving read-only permissions."
                icon={UserCircle}
                accent="bg-lime-100 text-lime-700"
                onClick={() => setActiveView('profile')}
              />
              <AuditorNavCard
                title="User activity"
                description="Inspect the latest actions performed by auditors and system roles."
                icon={Activity}
                accent="bg-cyan-100 text-cyan-700"
                onClick={() => setActiveView('activity')}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)]">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Auditor responsibilities</h2>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />Monitor election status, turnout, and lifecycle milestones.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />Review candidate submissions and approval evidence.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />Inspect results publication readiness and audit logs.</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />Track alerts, compliance reports, and system notifications.</li>
              </ul>
            </div>

            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)]">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Recent audit activity</h2>
              </div>
              <div className="space-y-3">
                {auditActivity.slice(0, 3).map((entry) => (
                  <div key={entry.id} className={`rounded-xl border p-3 ${severityStyles[entry.severity] || severityStyles.info}`}>
                    <p className="font-semibold">{entry.title}</p>
                    <p className="text-sm mt-1">{entry.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.25)]">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h2 className="text-xl font-bold text-gray-900">Priority alerts</h2>
              </div>
              <div className="space-y-3">
                {securityAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className={`rounded-xl border p-3 ${severityStyles[alert.severity] || severityStyles.warning}`}>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-sm mt-1">{alert.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Auditor Portal</p>
              <p className="text-[11px] text-gray-500 leading-tight">{user?.full_name}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Toggle navigation">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-30 bg-gray-900/50" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-[#1E3A8A] text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">UEVS Auditor</p>
                <p className="text-xs text-slate-200/90">Read-only oversight portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-4 lg:py-6 px-3 overflow-y-auto pt-20 lg:pt-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveView(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${active ? 'bg-[#2563EB] text-white font-semibold shadow-[0_10px_30px_-20px_rgba(37,99,235,0.7)]' : 'text-slate-200 hover:bg-white/10 hover:text-white font-medium'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'rotate-90' : ''}`} />
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-200/80">Auditor</p>
              </div>
              <button className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors" aria-label="Notifications">
                <Bell className="w-5 h-5" />
              </button>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm font-medium">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 pt-16 lg:pt-0">
        <div className="bg-white border-b border-slate-200/80 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{activeView === 'overview' ? 'Auditor Dashboard' : navItems.find((item) => item.key === activeView)?.label}</h1>
              <p className="text-gray-600 mt-1 text-sm">{activeView === 'overview' ? 'Monitor elections, review audit evidence, and oversee security events.' : navItems.find((item) => item.key === activeView)?.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
                <Eye className="w-4 h-4" />
                <span>Read-only access</span>
              </div>
              <button
                onClick={refreshSummary}
                disabled={summaryLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
                title="Refresh summary"
              >
                <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">{renderContent()}</div>
      </main>
    </div>
  );
}
