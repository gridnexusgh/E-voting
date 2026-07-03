// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getOfficerElections,
  getPendingCandidates,
  approveCandidateCandidate,
  rejectCandidate,
} from "../services/election";
import type { Election, ElectionCandidate } from "../types";

interface PendingCandidate extends ElectionCandidate {
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  position: {
    id: string;
    position_name: string;
  };
  student?: {
    id: string;
    student_id: string;
    full_name: string;
  };
}

export function CandidateApprovalPage() {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [pendingCandidates, setPendingCandidates] = useState<
    PendingCandidate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>(
    {},
  );
  const [processingCandidateId, setProcessingCandidateId] = useState<
    string | null
  >(null);

  const isElectionVisibleToUser = (election: Election) => {
    if (!user) return false;
    if (election.category === "university") return true;
    if (election.category === "faculty" && user.faculty_id) {
      return election.scope_id === user.faculty_id;
    }
    if (election.category === "department" && user.department_id) {
      return election.scope_id === user.department_id;
    }
    return false;
  };

  const visibleElections = useMemo(
    () => elections.filter(isElectionVisibleToUser),
    [elections, user],
  );

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    async function loadElections() {
      setLoading(true);
      setActionError("");
      try {
        const officerElections = await getOfficerElections(userId);
        setElections(officerElections || []);
        const firstElectionId = officerElections
          .filter(isElectionVisibleToUser)
          .map((election) => election.id)[0];
        setSelectedElectionId(firstElectionId ?? "");
      } catch {
        setActionError("Unable to load elections. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    loadElections();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedElectionId || !user?.id) {
      setPendingCandidates([]);
      return;
    }

    async function loadPendingCandidates() {
      setLoadingCandidates(true);
      setActionError("");
      try {
        const data = await getPendingCandidates(selectedElectionId);
        setPendingCandidates(data || []);
      } catch {
        setActionError(
          "Unable to load pending candidates for the selected election.",
        );
      } finally {
        setLoadingCandidates(false);
      }
    }

    loadPendingCandidates();
  }, [selectedElectionId, user?.id]);

  const handleApprove = async (candidateId: string) => {
    if (!user?.id) return;
    setActionError("");
    setActionSuccess("");
    setProcessingCandidateId(candidateId);

    try {
      await approveCandidateCandidate(candidateId, user.id);
      setPendingCandidates((current) =>
        current.filter((candidate) => candidate.id !== candidateId),
      );
      setActionSuccess("Candidate approved successfully.");
    } catch {
      setActionError("Unable to approve the candidate. Please try again.");
    } finally {
      setProcessingCandidateId(null);
    }
  };

  const handleReject = async (candidateId: string) => {
    const reason = rejectReasons[candidateId]?.trim() ?? "";
    if (!reason) {
      setActionError("A rejection reason is required.");
      return;
    }
    setActionError("");
    setActionSuccess("");
    setProcessingCandidateId(candidateId);

    try {
      await rejectCandidate(candidateId, reason);
      setPendingCandidates((current) =>
        current.filter((candidate) => candidate.id !== candidateId),
      );
      setRejectReasons((current) => {
        const next = { ...current };
        delete next[candidateId];
        return next;
      });
      setActionSuccess("Candidate rejected successfully.");
    } catch {
      setActionError("Unable to reject the candidate. Please try again.");
    } finally {
      setProcessingCandidateId(null);
    }
  };

  const selectedElection = visibleElections.find(
    (election) => election.id === selectedElectionId,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-600">
              Candidate Review
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Vet pending candidate applications
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Approve or reject candidate applications for elections within your
              assigned scope.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span>Only relevant elections are shown.</span>
          </div>
        </div>

        {actionError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionSuccess}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <label className="block text-sm font-medium text-slate-700">
              Select Election
            </label>
            <select
              value={selectedElectionId}
              onChange={(event) => setSelectedElectionId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select an election</option>
              {visibleElections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.title}
                </option>
              ))}
            </select>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Pending applications
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {loadingCandidates
                    ? "..."
                    : pendingCandidates.length.toString()}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Selected scope
                </p>
                <p className="mt-2 text-sm text-slate-900">
                  {selectedElection
                    ? `${selectedElection.category} election`
                    : "No election selected"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            {loading ? (
              <div className="flex h-48 items-center justify-center text-slate-500">
                Loading elections...
              </div>
            ) : visibleElections.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                <p>No elections are available for your scope yet.</p>
                <p className="mt-2 text-sm">
                  Create an election or contact your administrator if this is
                  unexpected.
                </p>
              </div>
            ) : !selectedElectionId ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                <p>Select an election to review candidate applications.</p>
              </div>
            ) : loadingCandidates ? (
              <div className="flex h-48 items-center justify-center text-slate-500">
                Loading pending candidates...
              </div>
            ) : pendingCandidates.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                <p>No pending candidate applications found.</p>
                <p className="mt-2 text-sm">
                  Once candidates submit their applications, they will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-3xl border border-slate-200 p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">
                          {candidate.position.position_name}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">
                          {candidate.student?.full_name ||
                            candidate.user.full_name}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {candidate.student?.student_id ||
                            candidate.user.email}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-sm text-slate-500">Submitted</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {new Date(candidate.submission_date).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {candidate.manifesto && (
                      <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900 mb-2">
                          Manifesto
                        </p>
                        <p>{candidate.manifesto}</p>
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          Rejection Reason
                        </label>
                        <textarea
                          value={rejectReasons[candidate.id] ?? ""}
                          onChange={(event) =>
                            setRejectReasons((current) => ({
                              ...current,
                              [candidate.id]: event.target.value,
                            }))
                          }
                          placeholder="Enter a reason if you need to reject this candidate"
                          rows={3}
                          className="mt-2 min-h-[96px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          disabled={processingCandidateId === candidate.id}
                          onClick={() => handleApprove(candidate.id)}
                          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={processingCandidateId === candidate.id}
                          onClick={() => handleReject(candidate.id)}
                          className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
