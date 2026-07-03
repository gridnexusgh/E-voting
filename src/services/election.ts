// @ts-nocheck
import { supabase } from './supabase';
import type {
  Election,
  ElectionPosition,
  ElectionCandidate,
  ElectionPayment,
  ElectionVoter,
  ElectionVote,
  ElectionStats,
  PaymentStatus,
  Faculty,
  Department,
} from '../types';

// Elections
export async function getOfficerElections(officerId: string) {
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .eq('officer_id', officerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Election[];
}

export async function getFaculties() {
  const { data, error } = await supabase
    .from('faculties')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Faculty[];
}

export async function getDepartmentsByFacultyId(facultyId: string) {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('faculty_id', facultyId)
    .order('name');

  if (error) throw error;
  return data as Department[];
}

export async function getElectionById(electionId: string) {
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .eq('id', electionId)
    .single();

  if (error) throw error;
  return data as Election;
}

export async function createElection(election: Omit<Election, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('elections')
    .insert([election])
    .select()
    .single();

  if (error) throw error;
  return data as Election;
}

export async function updateElection(electionId: string, updates: Partial<Election>) {
  const { data, error } = await supabase
    .from('elections')
    .update(updates)
    .eq('id', electionId)
    .select()
    .single();

  if (error) throw error;
  return data as Election;
}

export async function publishElection(electionId: string) {
  return updateElection(electionId, { status: 'published' });
}

export async function activateElection(electionId: string) {
  return updateElection(electionId, { status: 'active' });
}

export async function pauseElection(electionId: string) {
  return updateElection(electionId, { status: 'paused' });
}

export async function resumeElection(electionId: string) {
  return updateElection(electionId, { status: 'active' });
}

export async function closeElection(electionId: string) {
  return updateElection(electionId, { status: 'closed' });
}

// Positions
export async function getElectionPositions(electionId: string) {
  const { data, error } = await supabase
    .from('election_positions')
    .select('*')
    .eq('election_id', electionId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as ElectionPosition[];
}

export async function getStudentElections() {
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .in('status', ['active', 'published'])
    .order('voting_start', { ascending: true });

  if (error) throw error;
  return data as Election[];
}

interface ElectionCandidateVoteTotal extends ElectionCandidate {
  vote_count: number;
}

export async function getElectionCandidateVoteTotals(electionId: string) {
  const { data, error } = await supabase
    .from('election_candidates')
    .select(`
      *,
      user:users(id, full_name, email),
      position:election_positions(id, position_name)
    `)
    .eq('election_id', electionId)
    .eq('application_status', 'approved');

  if (error) throw error;

  const candidates = (data ?? []) as ElectionCandidate[];
  const voteCounts = await Promise.all(
    candidates.map(async (candidate) => {
      const { count, error: countError } = await supabase
        .from('election_votes')
        .select('id', { count: 'exact', head: true })
        .eq('candidate_id', candidate.id)
        .eq('election_id', electionId);
      if (countError) throw countError;
      return {
        ...candidate,
        vote_count: count ?? 0,
      };
    }),
  );

  return voteCounts as ElectionCandidateVoteTotal[];
}

export async function createPosition(position: Omit<ElectionPosition, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('election_positions')
    .insert([position])
    .select()
    .single();

  if (error) throw error;
  return data as ElectionPosition;
}

export async function updatePosition(positionId: string, updates: Partial<ElectionPosition>) {
  const { data, error } = await supabase
    .from('election_positions')
    .update(updates)
    .eq('id', positionId)
    .select()
    .single();

  if (error) throw error;
  return data as ElectionPosition;
}

export async function getPositionCandidateStats(positionIds: string[]) {
  if (positionIds.length === 0) return [];

  const { data, error } = await supabase
    .from('election_candidates')
    .select('position_id, payment_status')
    .in('position_id', positionIds);

  if (error) throw error;
  return data as { position_id: string; payment_status: PaymentStatus }[];
}

export async function deletePosition(positionId: string) {
  const { error } = await supabase
    .from('election_positions')
    .delete()
    .eq('id', positionId);

  if (error) throw error;
}

// Candidates
export async function getCandidatesForElection(electionId: string, includeRejected = false) {
  let query = supabase
    .from('election_candidates')
    .select(`
      *,
      user:users(id, full_name, email),
      position:election_positions(id, position_name),
      student:student_records(id, student_id, full_name)
    `)
    .eq('election_id', electionId);

  if (!includeRejected) {
    query = query.eq('application_status', 'approved');
  }

  const { data, error } = await query.order('submission_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPendingCandidates(electionId: string) {
  const { data, error } = await supabase
    .from('election_candidates')
    .select(`
      *,
      user:users(id, full_name, email),
      position:election_positions(id, position_name),
      student:student_records(id, student_id, full_name)
    `)
    .eq('election_id', electionId)
    .eq('application_status', 'pending')
    .order('submission_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function approveCandidateCandidate(
  candidateId: string,
  approvingOfficerId: string
) {
  const { data, error } = await supabase
    .from('election_candidates')
    .update({
      application_status: 'approved',
      approval_date: new Date().toISOString(),
      approved_by: approvingOfficerId,
    })
    .eq('id', candidateId)
    .select()
    .single();

  if (error) throw error;
  return data as ElectionCandidate;
}

export async function rejectCandidate(candidateId: string, rejectionReason: string) {
  const { data, error } = await supabase
    .from('election_candidates')
    .update({
      application_status: 'rejected',
      rejection_reason: rejectionReason,
    })
    .eq('id', candidateId)
    .select()
    .single();

  if (error) throw error;
  return data as ElectionCandidate;
}

export async function publishCandidatesForVoting(candidateIds: string[]) {
  const { data, error } = await supabase
    .from('election_candidates')
    .update({ is_visible_for_voting: true })
    .in('id', candidateIds)
    .select();

  if (error) throw error;
  return data;
}

// Payments
export async function getElectionPayments(electionId: string) {
  const { data, error } = await supabase
    .from('election_payments')
    .select(`
      *,
      candidate:election_candidates(
        id,
        user:users(full_name, email),
        position:election_positions(position_name)
      )
    `)
    .eq('election_id', electionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPaymentsByCandidateId(candidateId: string) {
  const { data, error } = await supabase
    .from('election_payments')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ElectionPayment[];
}

export async function createPayment(payment: Omit<ElectionPayment, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('election_payments')
    .insert([payment])
    .select()
    .single();

  if (error) throw error;
  return data as ElectionPayment;
}

export async function updatePaymentStatus(
  paymentId: string,
  status: 'pending' | 'successful' | 'failed',
  transactionId?: string
) {
  const updates: any = {
    payment_status: status,
  };

  if (status === 'successful') {
    updates.paid_at = new Date().toISOString();
  }

  if (transactionId) {
    updates.transaction_id = transactionId;
  }

  const { data, error } = await supabase
    .from('election_payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;
  return data as ElectionPayment;
}

// Student Voters
export async function addStudentVoters(
  electionId: string,
  studentIds: string[]
) {
  const voters = studentIds.map((studentId) => ({
    election_id: electionId,
    student_record_id: studentId,
  }));

  const { data, error } = await supabase
    .from('election_student_voters')
    .insert(voters)
    .select();

  if (error) throw error;
  return data as ElectionVoter[];
}

export async function getElectionVoters(electionId: string) {
  const { data, error } = await supabase
    .from('election_student_voters')
    .select(`
      *,
      student:student_records(id, student_id, full_name, email)
    `)
    .eq('election_id', electionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Votes
export async function recordVote(
  electionId: string,
  candidateId: string,
  positionId: string
) {
  const { data: voteData, error: voteError } = await supabase.auth.getSession();

  if (voteError) throw voteError;

  const { data, error } = await supabase
    .from('election_votes')
    .insert([{
      election_id: electionId,
      candidate_id: candidateId,
      position_id: positionId,
      voter_id: voteData?.session?.user?.id,
    }])
    .select()
    .single();

  if (error) throw error;

  // Mark voter as voted
  await supabase
    .from('election_student_voters')
    .update({ has_voted: true, voted_at: new Date().toISOString() })
    .eq('election_id', electionId)
    .eq('user_id', voteData?.session?.user?.id);

  return data as ElectionVote;
}

export async function getElectionResults(electionId: string) {
  const { data, error } = await supabase
    .from('election_votes')
    .select(`
      *,
      candidate:election_candidates(
        id,
        user:users(full_name),
        position:election_positions(position_name)
      )
    `)
    .eq('election_id', electionId);

  if (error) throw error;
  return data;
}

export async function publishResults(electionId: string) {
  return updateElection(electionId, { status: 'results_published' });
}

export interface TallyCandidateResult {
  id: string;
  name: string;
  profile_image_url?: string;
  votes: number;
  percentage: number;
  isWinner: boolean;
}

export interface TallyPositionResult {
  positionId: string;
  position: string;
  candidates: TallyCandidateResult[];
}

// Aggregate raw votes by position and candidate. Returns a tally suitable for
// display on the Results Publishing page (and for CSV export).
export async function tallyElectionResults(electionId: string): Promise<TallyPositionResult[]> {
  const { data, error } = await supabase
    .from('election_votes')
    .select(`
      position_id,
      candidate_id,
      candidate:election_candidates(
        id,
        profile_image_url,
        user:users(full_name),
        position:election_positions(id, position_name)
      )
    `)
    .eq('election_id', electionId);

  if (error) throw error;

  type VoteRow = {
    position_id: string;
    candidate_id: string;
    candidate: {
      id: string;
      user: { full_name: string } | null;
      position: { id: string; position_name: string } | null;
    } | null;
  };

  const rows = (data ?? []) as unknown as VoteRow[];

  // Group by position
  const byPosition = new Map<
    string,
    { name: string; candidates: Map<string, { id: string; name: string; votes: number }> }
  >();

  for (const row of rows) {
    const positionId = row.position_id;
    const positionName = row.candidate?.position?.position_name ?? 'Unknown Position';
    const candidateId = row.candidate_id;
    const candidateName = row.candidate?.user?.full_name ?? 'Unknown Candidate';

    if (!byPosition.has(positionId)) {
      byPosition.set(positionId, { name: positionName, candidates: new Map() });
    }
    const bucket = byPosition.get(positionId)!;
    const existing = bucket.candidates.get(candidateId);
    if (existing) {
      existing.votes += 1;
    } else {
      bucket.candidates.set(candidateId, {
        id: candidateId,
        name: candidateName,
        votes: 1,
      });
    }
  }

  const tally: TallyPositionResult[] = [];
  byPosition.forEach((bucket, positionId) => {
    const total = Array.from(bucket.candidates.values()).reduce((s, c) => s + c.votes, 0);
    const sorted = Array.from(bucket.candidates.values()).sort((a, b) => b.votes - a.votes);
    const topVotes = sorted[0]?.votes ?? 0;
    tally.push({
      positionId,
      position: bucket.name,
      candidates: sorted.map((c) => ({
        id: c.id,
        name: c.name,
        votes: c.votes,
        percentage: total > 0 ? Math.round((c.votes / total) * 100) : 0,
        isWinner: c.votes > 0 && c.votes === topVotes,
      })),
    });
  });

  tally.sort((a, b) => a.position.localeCompare(b.position));
  return tally;
}

// Statistics
export async function getElectionStats(electionId: string): Promise<ElectionStats> {
  await getElectionById(electionId);

  const [voters, votes, candidates, payments] = await Promise.all([
    supabase
      .from('election_student_voters')
      .select('id', { count: 'exact' })
      .eq('election_id', electionId),
    supabase
      .from('election_votes')
      .select('id', { count: 'exact' })
      .eq('election_id', electionId),
    supabase
      .from('election_candidates')
      .select('application_status', { count: 'exact' })
      .eq('election_id', electionId),
    supabase
      .from('election_payments')
      .select('payment_status')
      .eq('election_id', electionId),
  ]);

  const approvedCandidates = candidates.data?.filter((c) => c.application_status === 'approved').length || 0;
  const rejectedCandidates = candidates.data?.filter((c) => c.application_status === 'rejected').length || 0;
  const totalVoters = voters.count || 0;
  const totalVotesCast = votes.count || 0;
  const turnoutPercentage = totalVoters > 0 ? (totalVotesCast / totalVoters) * 100 : 0;

  const paymentStats = payments.data || [];
  const pendingPayments = paymentStats.filter((p) => p.payment_status === 'pending').length;
  const successfulPayments = paymentStats.filter((p) => p.payment_status === 'successful').length;
  const failedPayments = paymentStats.filter((p) => p.payment_status === 'failed').length;

  return {
    totalVoters,
    totalVotesCast,
    turnoutPercentage: Math.round(turnoutPercentage * 100) / 100,
    candidatesApproved: approvedCandidates,
    candidatesRejected: rejectedCandidates,
    pendingPayments,
    successfulPayments,
    failedPayments,
  };
}

// Active elections (for dashboard display)
export async function getActiveElections(officerId: string) {
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .eq('officer_id', officerId)
    .in('status', ['active', 'published'])
    .order('voting_end', { ascending: true });

  if (error) throw error;
  return data as Election[];
}

export async function getUpcomingElections(officerId: string) {
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .eq('officer_id', officerId)
    .eq('status', 'draft')
    .order('voting_start', { ascending: true });

  if (error) throw error;
  return data as Election[];
}

export async function getCompletedElections(officerId: string) {
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .eq('officer_id', officerId)
    .in('status', ['closed', 'results_published'])
    .order('voting_end', { ascending: false });

  if (error) throw error;
  return data as Election[];
}

export async function getCompletedStudentElections(
  facultyId?: string,
  departmentId?: string,
) {
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .in('status', ['closed', 'results_published'])
    .order('voting_end', { ascending: false });

  if (error) throw error;
  const elections = (data ?? []) as Election[];

  return elections.filter((election) => {
    if (election.category === 'university') return true;
    if (election.category === 'faculty') return facultyId && election.scope_id === facultyId;
    if (election.category === 'department') return departmentId && election.scope_id === departmentId;
    return false;
  });
}

// CSV upload helper
export async function parseStudentCSV(csvContent: string): Promise<Array<{ student_id: string; full_name: string; email: string; faculty_id?: string; department_id?: string }>> {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const students = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const student: any = {};

    headers.forEach((header, index) => {
      student[header] = values[index] || undefined;
    });

    return student;
  });

  return students;
}
