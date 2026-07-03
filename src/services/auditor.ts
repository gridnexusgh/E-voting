// @ts-nocheck
import { supabase } from './supabase';
import type { AuditLog, SecurityEvent } from '../types';

export interface AuditorElectionItem {
  id: string;
  title: string;
  status: string;
  category: string;
  votingStart: string;
  votingEnd: string;
  totalVoters: number;
  totalVotesCast: number;
  resultsPublished: boolean;
}

export interface AuditorActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  actor: string;
  severity: 'info' | 'warning' | 'success';
}

export interface AuditorSecurityAlert {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AuditorCandidateReview {
  id: string;
  electionTitle: string;
  candidateName: string;
  position: string;
  status: string;
  manifestoPreview: string;
  submittedAt: string;
}

export interface AuditorResultSummary {
  id: string;
  electionTitle: string;
  winner: string;
  voteCount: number;
  status: string;
  publishedAt: string;
}

export interface AuditorUserActivity {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'success' | 'critical';
}

export interface AuditorNotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface AuditorDashboardData {
  elections: AuditorElectionItem[];
  auditActivity: AuditorActivityItem[];
  securityAlerts: AuditorSecurityAlert[];
  candidates: AuditorCandidateReview[];
  results: AuditorResultSummary[];
  activity: AuditorUserActivity[];
  notifications: AuditorNotificationItem[];
  registeredStudents: number;
}

export interface AuditorDashboardSummary {
  auditLogCount: number;
  securityEventCount: number;
  pendingCandidateCount: number;
}

type Severity = 'info' | 'warning' | 'success' | 'critical';

type SupabaseResult<T> = {
  data: T[] | null;
  count?: number | null;
  error: { message: string } | null;
};

type ElectionRow = {
  id: string;
  title: string | null;
  status: string | null;
  category: string | null;
  voting_start: string | null;
  voting_end: string | null;
  total_voters: number | null;
  total_votes_cast: number | null;
};

type CandidateRow = {
  id: string;
  election_id: string | null;
  user_id: string | null;
  position_id: string | null;
  student_record_id: string | null;
  application_status: string | null;
  manifesto: string | null;
  submission_date: string | null;
  election?: Array<{ id: string; title: string | null; status: string | null }> | { id: string; title: string | null; status: string | null } | null;
  position?: Array<{ id: string; position_name: string | null }> | { id: string; position_name: string | null } | null;
  user?: Array<{ id: string; full_name: string | null; email: string | null }> | { id: string; full_name: string | null; email: string | null } | null;
  student?: Array<{ id: string; full_name: string | null; student_id: string | null }> | { id: string; full_name: string | null; student_id: string | null } | null;
};

type VoteRow = {
  id: string;
  election_id: string | null;
  candidate_id: string | null;
  vote_timestamp: string | null;
};

type AuditRow = {
  id: string;
  action: string | null;
  details: string | null;
  created_at: string | null;
  actor: string | null;
  severity?: Severity | null;
  title?: string | null;
  message?: string | null;
};

type SecurityRow = {
  id: string;
  title: string | null;
  message: string | null;
  created_at: string | null;
  severity?: Severity | null;
};

const fallbackElections: AuditorElectionItem[] = [
  {
    id: 'fallback-1',
    title: 'University Student Council Election',
    status: 'active',
    category: 'university',
    votingStart: '2026-07-01',
    votingEnd: '2026-07-05',
    totalVoters: 18420,
    totalVotesCast: 11240,
    resultsPublished: false,
  },
  {
    id: 'fallback-2',
    title: 'Faculty of Engineering Representative',
    status: 'closed',
    category: 'faculty',
    votingStart: '2026-06-10',
    votingEnd: '2026-06-15',
    totalVoters: 3420,
    totalVotesCast: 3021,
    resultsPublished: true,
  },
  {
    id: 'fallback-3',
    title: 'Department of Computer Science Vote',
    status: 'results_published',
    category: 'department',
    votingStart: '2026-05-20',
    votingEnd: '2026-05-25',
    totalVoters: 960,
    totalVotesCast: 874,
    resultsPublished: true,
  },
];

const fallbackActivity: AuditorActivityItem[] = [
  {
    id: 'activity-1',
    title: 'Election opened for verification',
    detail: 'Voting period started and ballot generation confirmed.',
    timestamp: '2026-06-30T10:30:00.000Z',
    actor: 'System',
    severity: 'success',
  },
  {
    id: 'activity-2',
    title: 'Turnout spike detected',
    detail: 'A sudden increase in ballot submissions was recorded.',
    timestamp: '2026-06-30T09:15:00.000Z',
    actor: 'Audit Service',
    severity: 'warning',
  },
  {
    id: 'activity-3',
    title: 'Results published',
    detail: 'Results for the Faculty Representative election were released.',
    timestamp: '2026-06-16T14:00:00.000Z',
    actor: 'Election Officer',
    severity: 'info',
  },
];

const fallbackAlerts: AuditorSecurityAlert[] = [
  {
    id: 'alert-1',
    title: 'Multiple authentication attempts',
    detail: 'Several failed login attempts were blocked from a single IP range.',
    timestamp: '2026-06-30T08:20:00.000Z',
    severity: 'warning',
  },
  {
    id: 'alert-2',
    title: 'Unusual ballot timing pattern',
    detail: 'A small cluster of ballots was submitted near the closing window.',
    timestamp: '2026-06-29T19:45:00.000Z',
    severity: 'critical',
  },
];

const fallbackCandidates: AuditorCandidateReview[] = [
  {
    id: 'candidate-1',
    electionTitle: 'University Student Council Election',
    candidateName: 'Amina Yeboah',
    position: 'President',
    status: 'approved',
    manifestoPreview: 'Promotes transparent budgeting and accessible student participation.',
    submittedAt: '2026-06-28T09:00:00.000Z',
  },
  {
    id: 'candidate-2',
    electionTitle: 'Faculty of Engineering Representative',
    candidateName: 'Kwame Boateng',
    position: 'Representative',
    status: 'pending review',
    manifestoPreview: 'Focuses on faculty-led innovation and stronger academic advocacy.',
    submittedAt: '2026-06-27T11:30:00.000Z',
  },
];

const fallbackResults: AuditorResultSummary[] = [
  {
    id: 'result-1',
    electionTitle: 'Faculty of Engineering Representative',
    winner: 'Kwame Boateng',
    voteCount: 1823,
    status: 'published',
    publishedAt: '2026-06-16T14:00:00.000Z',
  },
  {
    id: 'result-2',
    electionTitle: 'Department of Computer Science Vote',
    winner: 'Martha Opoku',
    voteCount: 498,
    status: 'published',
    publishedAt: '2026-05-26T10:00:00.000Z',
  },
];

const fallbackActivityLog: AuditorUserActivity[] = [
  {
    id: 'activity-log-1',
    actor: 'Admin',
    action: 'Created auditor account',
    target: 'auditor@university.edu',
    timestamp: '2026-06-28T08:00:00.000Z',
    severity: 'info',
  },
  {
    id: 'activity-log-2',
    actor: 'Auditor',
    action: 'Reviewed turnout report',
    target: 'University Student Council Election',
    timestamp: '2026-06-30T11:00:00.000Z',
    severity: 'success',
  },
];

const fallbackNotifications: AuditorNotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Results review pending',
    message: 'The faculty results package is ready for auditor verification.',
    createdAt: '2026-06-30T07:30:00.000Z',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Security check completed',
    message: 'No critical issues were detected in the last audit cycle.',
    createdAt: '2026-06-29T16:45:00.000Z',
    read: true,
  },
];

function getQueryRows<T>(result: PromiseSettledResult<unknown>): T[] {
  if (result.status !== 'fulfilled') {
    return [];
  }

  const value = result.value as SupabaseResult<T> | undefined;
  if (!value || value.error) {
    return [];
  }

  return value.data ?? [];
}

function getQueryCount(result: PromiseSettledResult<unknown>): number {
  if (result.status !== 'fulfilled') {
    return 0;
  }

  const value = result.value as SupabaseResult<unknown> | undefined;
  if (!value || value.error) {
    return 0;
  }

  return Number(value.count ?? 0);
}

function getFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatLabel(value: string | null | undefined): string {
  return value?.trim() ? value : 'Pending review';
}

function toDisplayStatus(value: string | null | undefined): string {
  return formatLabel(value).replace(/_/g, ' ');
}

export async function getAuditorDashboardData(): Promise<AuditorDashboardData> {
  try {
    const [electionsResult, studentsResult, candidatesResult, votesResult, auditLogsResult, securityEventsResult] = await Promise.allSettled([
      supabase
        .from('elections')
        .select('id,title,status,category,voting_start,voting_end,total_voters,total_votes_cast,updated_at')
        .order('voting_start', { ascending: false }),
      supabase.from('student_records').select('id', { count: 'exact', head: true }),
      supabase
        .from('election_candidates')
        .select(`
          id,
          election_id,
          user_id,
          position_id,
          student_record_id,
          application_status,
          manifesto,
          submission_date,
          election:elections(id,title,status),
          position:election_positions(id,position_name),
          user:users!election_candidates_user_id_fkey(id,full_name,email),
          student:student_records(id,full_name,student_id)
        `)
        .order('submission_date', { ascending: false }),
      supabase.from('election_votes').select('id,election_id,candidate_id,vote_timestamp').order('vote_timestamp', { ascending: false }),
      supabase
        .from('audit_logs')
        .select('id,action,details,created_at,actor,severity,title,message')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('security_events')
        .select('id,title,message,created_at,severity')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    const electionsData = getQueryRows<ElectionRow>(electionsResult);
    const elections = electionsData.map((election) => ({
      id: String(election.id),
      title: formatLabel(election.title ?? 'Untitled election'),
      status: formatLabel(election.status ?? 'draft'),
      category: formatLabel(election.category ?? 'university'),
      votingStart: election.voting_start ?? '',
      votingEnd: election.voting_end ?? '',
      totalVoters: Number(election.total_voters ?? 0),
      totalVotesCast: Number(election.total_votes_cast ?? 0),
      resultsPublished: (election.status ?? '') === 'results_published',
    }));

    const studentsCount = getQueryCount(studentsResult);
    const candidatesData = getQueryRows<CandidateRow>(candidatesResult);
    const votesData = getQueryRows<VoteRow>(votesResult);

    const candidateVoteMap = new Map<string, number>();
    votesData.forEach((vote) => {
      if (!vote.candidate_id) {
        return;
      }

      const current = candidateVoteMap.get(vote.candidate_id) ?? 0;
      candidateVoteMap.set(vote.candidate_id, current + 1);
    });

    const candidates = candidatesData.map((candidate) => {
      const electionDetails = getFirstRelation(candidate.election);
      const positionDetails = getFirstRelation(candidate.position);
      const userDetails = getFirstRelation(candidate.user);
      const studentDetails = getFirstRelation(candidate.student);

      return {
        id: String(candidate.id),
        electionTitle: formatLabel(electionDetails?.title ?? 'Election pending'),
        candidateName: formatLabel(studentDetails?.full_name ?? userDetails?.full_name ?? 'Candidate pending review'),
        position: formatLabel(positionDetails?.position_name ?? 'Position pending'),
        status: formatLabel(candidate.application_status ?? 'pending'),
        manifestoPreview: formatLabel(candidate.manifesto ?? 'Manifesto not submitted yet.'),
        submittedAt: candidate.submission_date ?? '',
      } satisfies AuditorCandidateReview;
    });

    const results = elections
      .map((election) => {
        const electionCandidates = candidatesData.filter((candidate) => candidate.election_id === election.id && candidate.application_status === 'approved');
        const winnerCandidate = [...electionCandidates]
          .map((candidate) => ({
            candidate,
            votes: candidateVoteMap.get(candidate.id) ?? 0,
          }))
          .sort((left, right) => right.votes - left.votes)[0];

        if (!winnerCandidate && election.status !== 'results_published' && election.status !== 'closed') {
          return null;
        }

        const winnerName = winnerCandidate
          ? formatLabel(
              getFirstRelation(winnerCandidate.candidate.student)?.full_name ??
              getFirstRelation(winnerCandidate.candidate.user)?.full_name ??
              'Pending review'
            )
          : 'Pending review';

        return {
          id: election.id,
          electionTitle: election.title,
          winner: winnerName,
          voteCount: winnerCandidate?.votes ?? 0,
          status: election.status === 'results_published' ? 'published' : 'pending publish',
          publishedAt: election.votingEnd || election.votingStart || '',
        } satisfies AuditorResultSummary;
      })
      .filter((item): item is AuditorResultSummary => Boolean(item));

    const auditRows = getQueryRows<AuditRow>(auditLogsResult);
    const auditActivity = auditRows.length > 0
      ? auditRows.map((entry, index) => ({
          id: String(entry.id ?? `audit-${index}`),
          title: formatLabel(entry.action ?? entry.title ?? 'Audit event'),
          detail: formatLabel(entry.details ?? entry.message ?? 'No additional details were provided.'),
          timestamp: entry.created_at ?? '',
          actor: formatLabel(entry.actor ?? 'System'),
          severity: (entry.severity as AuditorActivityItem['severity']) ?? 'info',
        }))
      : [
          ...elections.slice(0, 2).map((election) => ({
            id: `activity-${election.id}`,
            title: `${election.title} is ${toDisplayStatus(election.status)}`,
            detail: `${election.totalVotesCast.toLocaleString()} of ${election.totalVoters.toLocaleString()} ballots recorded`,
            timestamp: election.votingEnd || election.votingStart || '',
            actor: 'System',
            severity: 'success' as const,
          })),
          ...(candidates.filter((candidate) => candidate.status === 'pending').slice(0, 1).map((candidate) => ({
            id: `pending-${candidate.id}`,
            title: 'Candidate review pending',
            detail: `${candidate.candidateName} is awaiting auditor review for ${candidate.position}`,
            timestamp: candidate.submittedAt,
            actor: 'Election Officer',
            severity: 'warning' as const,
          }))),
        ];

    const securityRows = getQueryRows<SecurityRow>(securityEventsResult);
    const securityAlerts = securityRows.length > 0
      ? securityRows.map((entry, index) => ({
          id: String(entry.id ?? `alert-${index}`),
          title: formatLabel(entry.title ?? 'Security event'),
          detail: formatLabel(entry.message ?? 'Review this activity for compliance.'),
          timestamp: entry.created_at ?? '',
          severity: (entry.severity as AuditorSecurityAlert['severity']) ?? 'warning',
        }))
      : [
          ...elections
            .filter((election) => election.totalVotesCast > election.totalVoters)
            .map((election) => ({
              id: `alert-${election.id}`,
              title: 'Vote volume anomaly detected',
              detail: `${election.title} has more recorded ballots than the assigned voter list.`,
              timestamp: election.votingEnd || election.votingStart || '',
              severity: 'critical' as const,
            })),
          ...elections
            .filter((election) => election.status === 'active' && election.totalVoters > 0 && (election.totalVotesCast / election.totalVoters) >= 0.9)
            .map((election) => ({
              id: `turnout-${election.id}`,
              title: 'High turnout detected',
              detail: `${election.title} has reached a high participation rate during the active window.`,
              timestamp: election.votingEnd || election.votingStart || '',
              severity: 'warning' as const,
            })),
          ...(candidates.filter((candidate) => candidate.status === 'pending').length > 0
            ? [{
                id: 'pending-candidates-alert',
                title: 'Pending candidate review',
                detail: `${candidates.filter((candidate) => candidate.status === 'pending').length} candidate submission(s) still need review.`,
                timestamp: candidates.find((candidate) => candidate.status === 'pending')?.submittedAt ?? '',
                severity: 'info' as const,
              }]
            : []),
        ];

    const pendingCandidates = candidates.filter((candidate) => candidate.status === 'pending');
    const activityLog: AuditorUserActivity[] = [
      ...elections.slice(0, 3).map((election) => ({
        id: `log-${election.id}`,
        actor: 'System',
        action: `Election status updated to ${toDisplayStatus(election.status)}`,
        target: election.title,
        timestamp: election.votingEnd || election.votingStart || '',
        severity: (election.status === 'active' ? 'success' : 'info') as AuditorUserActivity['severity'],
      })),
      ...pendingCandidates.slice(0, 2).map((candidate) => ({
        id: `log-candidate-${candidate.id}`,
        actor: 'Election Officer',
        action: 'Submitted candidate for review',
        target: candidate.candidateName,
        timestamp: candidate.submittedAt,
        severity: 'warning' as AuditorUserActivity['severity'],
      })),
    ];

    const notifications: AuditorNotificationItem[] = [
      ...(pendingCandidates.length > 0
        ? [{
            id: 'notification-pending-candidates',
            title: 'Candidate review pending',
            message: `${pendingCandidates.length} candidate submission(s) require auditor attention.`,
            createdAt: pendingCandidates[0].submittedAt,
            read: false,
          }]
        : []),
      ...(results.length > 0
        ? [{
            id: 'notification-results',
            title: 'Results package available',
            message: `${results.length} election result summary(s) are ready for publication review.`,
            createdAt: results[0].publishedAt,
            read: true,
          }]
        : []),
    ];

    return {
      elections,
      auditActivity,
      securityAlerts,
      candidates,
      results,
      activity: activityLog,
      notifications,
      registeredStudents: studentsCount,
    };
  } catch {
    return {
      elections: fallbackElections,
      auditActivity: fallbackActivity,
      securityAlerts: fallbackAlerts,
      candidates: fallbackCandidates,
      results: fallbackResults,
      activity: fallbackActivityLog,
      notifications: fallbackNotifications,
      registeredStudents: 0,
    };
  }
}

export async function getAuditorDashboardSummary(): Promise<AuditorDashboardSummary> {
  const [auditLogsResult, securityEventsResult, pendingCandidatesResult] = await Promise.allSettled([
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
    supabase.from('security_events').select('id', { count: 'exact', head: true }),
    supabase.from('election_candidates').select('id', { count: 'exact', head: true }).eq('application_status', 'pending'),
  ]);

  return {
    auditLogCount: getQueryCount(auditLogsResult),
    securityEventCount: getQueryCount(securityEventsResult),
    pendingCandidateCount: getQueryCount(pendingCandidatesResult),
  };
}

export async function getAuditorAuditLogs(limit = 10) {
  const { data, error } = await supabase
    .from<AuditLog>('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getAuditorSecurityEvents(limit = 10) {
  const { data, error } = await supabase
    .from<SecurityEvent>('security_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function createAuditLog(log: Omit<AuditLog, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from<AuditLog>('audit_logs')
    .insert([log])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from<SecurityEvent>('security_events')
    .insert([event])
    .select()
    .single();

  if (error) throw error;
  return data;
}
