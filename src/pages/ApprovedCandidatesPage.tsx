import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getCandidatesForElection,
  getOfficerElections,
} from "../services/election";
import type { Election, ElectionCandidate } from "../types";

interface ApprovedCandidate extends ElectionCandidate {
  user?: { full_name: string; email: string };
  position?: { position_name: string };
  student?: { full_name: string };
}

export function ApprovedCandidatesPage() {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [approvedCandidates, setApprovedCandidates] = useState<
    ApprovedCandidate[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCandidatesLoading, setIsCandidatesLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    async function loadElections() {
      setIsLoading(true);
      setError("");

      try {
        const list = await getOfficerElections(userId);
        setElections(list);
        if (list.length > 0) {
          setSelectedElectionId(list[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your elections. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }

    loadElections();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedElectionId) {
      setApprovedCandidates([]);
      return;
    }

    let mounted = true;
    async function loadCandidates() {
      setIsCandidatesLoading(true);
      setError("");

      try {
        const candidates = await getCandidatesForElection(selectedElectionId);
        if (mounted) {
          setApprovedCandidates(candidates as ApprovedCandidate[]);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError("Unable to load approved candidates. Please try again.");
        }
      } finally {
        if (mounted) setIsCandidatesLoading(false);
      }
    }

    loadCandidates();
    return () => {
      mounted = false;
    };
  }, [selectedElectionId]);

  const selectedElection = useMemo(
    () => elections.find((item) => item.id === selectedElectionId),
    [elections, selectedElectionId],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-600">
              Approved Candidates
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Approved candidates for your elections
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              View candidates that have already been approved and are eligible
              for voting.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Responsive candidate list
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <label className="block text-sm font-medium text-slate-700">
              Select election
            </label>
            <select
              value={selectedElectionId}
              onChange={(event) => setSelectedElectionId(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select an election</option>
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.title} • {election.academic_year}
                </option>
              ))}
            </select>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Elections
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {elections.length}
                </p>
              </div>
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Approved candidates
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {isCandidatesLoading ? "..." : approvedCandidates.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            {isLoading ? (
              <div className="flex h-56 items-center justify-center text-slate-500">
                Loading your elections...
              </div>
            ) : !selectedElectionId ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                <p>Select an election to see approved candidates.</p>
              </div>
            ) : isCandidatesLoading ? (
              <div className="flex h-56 items-center justify-center text-slate-500">
                Loading approved candidates...
              </div>
            ) : approvedCandidates.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                <p>No approved candidates found for this election.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Approved candidates appear here once they have been accepted.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                      Election
                    </p>
                    <p className="mt-3 text-base font-semibold text-slate-900">
                      {selectedElection?.title}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedElection?.academic_year}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                      Category
                    </p>
                    <p className="mt-3 text-base font-semibold text-slate-900">
                      {selectedElection?.category}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                      Status
                    </p>
                    <p className="mt-3 text-base font-semibold text-slate-900">
                      {selectedElection?.status.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {approvedCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
                          {candidate.user?.full_name
                            ? candidate.user.full_name
                                .split(" ")
                                .slice(0, 2)
                                .map((part) => part[0].toUpperCase())
                                .join("")
                            : candidate.student?.full_name
                                .split(" ")
                                .slice(0, 2)
                                .map((part) => part[0].toUpperCase())
                                .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {candidate.user?.full_name ||
                              candidate.student?.full_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {candidate.user?.email || "Student candidate"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3 text-sm text-slate-600">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                            Position
                          </p>
                          <p className="mt-1 font-medium text-slate-900">
                            {candidate.position?.position_name ?? "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                            Status
                          </p>
                          <p className="mt-1 font-medium text-emerald-700">
                            Approved
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
