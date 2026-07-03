// @ts-nocheck
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getActiveElections,
  getElectionCandidateVoteTotals,
} from "../services/election";
import type { Election, ElectionCandidate } from "../types";

interface ElectionCandidateWithVotes extends ElectionCandidate {
  vote_count: number;
  user?: { full_name: string; email: string };
  student?: { full_name: string };
  position?: { position_name: string };
}

interface ElectionMonitorEntry {
  election: Election;
  candidates: ElectionCandidateWithVotes[];
  maxVotes: number;
}

const getBarColor = (rank: number) => {
  if (rank === 1) return "bg-emerald-500";
  if (rank === 2) return "bg-orange-500";
  return "bg-rose-500";
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

export function ElectionMonitoringPage() {
  const { user } = useAuth();
  const [monitorData, setMonitorData] = useState<ElectionMonitorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    async function loadMonitoringData() {
      setIsLoading(true);
      setError("");

      try {
        const elections = await getActiveElections(userId);
        if (elections.length === 0) {
          setMonitorData([]);
          return;
        }

        const results = await Promise.all(
          elections.map(async (election) => {
            const candidates = await getElectionCandidateVoteTotals(
              election.id,
            );
            const sorted = [...candidates].sort(
              (a, b) => b.vote_count - a.vote_count,
            );
            const maxVotes = Math.max(
              1,
              ...sorted.map((candidate) => candidate.vote_count),
            );
            return {
              election,
              candidates: sorted,
              maxVotes,
            };
          }),
        );

        setMonitorData(results);
      } catch (err) {
        console.error(err);
        setError(
          "Unable to load election monitoring data. Please refresh the page.",
        );
        setMonitorData([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadMonitoringData();
  }, [user?.id]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-600">
              Election Monitoring
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Live vote tracking for your elections
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              See each election with its candidates below, and compare live vote
              performance using color-ranked vote bars.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Highest vote candidate
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-56 items-center justify-center text-slate-500">
            Loading election monitoring...
          </div>
        ) : monitorData.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            <p>No active elections available for monitoring.</p>
            <p className="mt-2 text-sm">
              Publish an election and add candidates to begin live monitoring.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {monitorData.map(({ election, candidates, maxVotes }) => (
              <div key={election.id} className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">
                        {election.category} election
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                        {election.title}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {election.academic_year} · {election.voting_start} to{" "}
                        {election.voting_end}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      {candidates.length} candidates tracked
                    </div>
                  </div>
                </div>

                {candidates.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                    <p>
                      No approved candidates have been added to this election
                      yet.
                    </p>
                    <p className="mt-2 text-sm">
                      Candidates appear here once they are approved and start
                      receiving votes.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {candidates.map((candidate, index) => {
                      const rank = index + 1;
                      const barHeight = Math.max(
                        18,
                        Math.round((candidate.vote_count / maxVotes) * 100),
                      );
                      return (
                        <div
                          key={candidate.id}
                          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
                              {candidate.profile_image_url ? (
                                <img
                                  src={candidate.profile_image_url}
                                  alt={candidate.user?.full_name ?? "Candidate"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-600">
                                  {getInitials(
                                    candidate.user?.full_name ??
                                      candidate.student?.full_name ??
                                      "NA",
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                                {candidate.position?.position_name ??
                                  "Candidate"}
                              </p>
                              <h3 className="truncate text-base font-semibold text-slate-900">
                                {candidate.user?.full_name ??
                                  candidate.student?.full_name ??
                                  "Unknown"}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {candidate.user?.email ??
                                  candidate.student?.full_name}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex items-end gap-3">
                            <div className="flex h-32 w-10 flex-col justify-end overflow-hidden rounded-2xl bg-slate-100">
                              <div
                                className={`${getBarColor(rank)} w-full transition-all duration-300`}
                                style={{ height: `${barHeight}%` }}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">
                                {candidate.vote_count} vote
                                {candidate.vote_count === 1 ? "" : "s"}
                              </p>
                              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                                {rank === 1
                                  ? "Top performer"
                                  : rank === 2
                                    ? "Second place"
                                    : "Competitor"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
