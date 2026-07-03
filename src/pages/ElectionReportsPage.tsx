// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getOfficerElections,
  getCandidatesForElection,
  getCompletedElections,
  tallyElectionResults,
} from "../services/election";
import type { Election, ElectionCandidate } from "../types";

interface CandidateWithRelations extends ElectionCandidate {
  user?: { full_name: string; email: string };
  position?: { position_name: string };
}

function escapeCsvValue(value: string | number | undefined) {
  const stringValue =
    value === undefined || value === null ? "" : String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadCsv(
  filename: string,
  rows: Array<Record<string, string | number>>,
) {
  if (rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")]
    .concat(
      rows.map((row) =>
        headers
          .map((key) => escapeCsvValue(row[key] as string | number | undefined))
          .join(","),
      ),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function ElectionReportsPage() {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    async function loadElections() {
      setIsLoading(true);
      setError("");

      try {
        const officerElections = await getOfficerElections(userId);
        setElections(officerElections);
        if (officerElections.length > 0) {
          setSelectedElectionId(officerElections[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your elections for reporting.");
      } finally {
        setIsLoading(false);
      }
    }

    loadElections();
  }, [user?.id]);

  const selectedElection = useMemo(
    () => elections.find((item) => item.id === selectedElectionId),
    [elections, selectedElectionId],
  );

  const completedElectionCount = useMemo(
    () =>
      elections.filter(
        (election) =>
          election.status === "closed" ||
          election.status === "results_published",
      ).length,
    [elections],
  );

  async function handleExportResults() {
    if (!selectedElectionId) return;
    setReportLoading(true);

    try {
      const tally = await tallyElectionResults(selectedElectionId);
      const rows = tally.flatMap((position) =>
        position.candidates.map((candidate) => ({
          election: selectedElection?.title ?? "",
          academic_year: selectedElection?.academic_year ?? "",
          position: position.position,
          candidate_name: candidate.name,
          votes: candidate.votes,
          percentage: `${candidate.percentage}%`,
          winner: candidate.isWinner ? "Yes" : "No",
        })),
      );

      downloadCsv(
        `${selectedElection?.title.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "_") || "election"}_results.csv`,
        rows,
      );
    } catch (err) {
      console.error(err);
      setError("Unable to export election results. Please try again.");
    } finally {
      setReportLoading(false);
    }
  }

  async function handleExportCandidates() {
    if (!selectedElectionId) return;
    setReportLoading(true);

    try {
      const candidates = (await getCandidatesForElection(
        selectedElectionId,
        true,
      )) as CandidateWithRelations[];
      const rows = candidates.map((candidate) => ({
        election: selectedElection?.title ?? "",
        position: candidate.position?.position_name ?? "Unknown",
        candidate_name: candidate.user?.full_name ?? "Unknown",
        candidate_email: candidate.user?.email ?? "",
        application_status: candidate.application_status,
        payment_status: candidate.payment_status,
        submission_date: candidate.submission_date,
      }));

      downloadCsv(
        `${selectedElection?.title.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "_") || "election"}_candidates.csv`,
        rows,
      );
    } catch (err) {
      console.error(err);
      setError("Unable to export candidate report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  }

  async function handleExportSummary() {
    if (!selectedElectionId) return;
    setReportLoading(true);

    try {
      const completedElections = await getCompletedElections(user?.id ?? "");
      const rows = completedElections.map((election) => ({
        election: election.title,
        academic_year: election.academic_year,
        category: election.category,
        status: election.status,
        voting_start: election.voting_start,
        voting_end: election.voting_end,
        total_voters: election.total_voters,
        total_votes_cast: election.total_votes_cast,
      }));

      downloadCsv(`completed_elections_summary.csv`, rows);
    } catch (err) {
      console.error(err);
      setError("Unable to export election summary. Please try again.");
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-600">
              Reports
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Election reports generation
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Export election summaries, candidate approval records, and final
              results for auditing and compliance.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
            Available for your officer elections
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-slate-500">
            Loading report options...
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                  Your elections
                </p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {elections.length}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Total elections under your supervision.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                  Completed reports
                </p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {completedElectionCount}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Closed / results-published elections.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
                  Selected election
                </p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {selectedElection?.title ?? "None"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Choose an election before exporting data.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Select election
              </label>
              <div className="relative">
                <select
                  value={selectedElectionId}
                  onChange={(event) =>
                    setSelectedElectionId(event.target.value)
                  }
                  className="appearance-none w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {elections.length === 0 ? (
                    <option value="">No elections available</option>
                  ) : (
                    elections.map((election) => (
                      <option key={election.id} value={election.id}>
                        {election.title} • {election.academic_year}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <button
                type="button"
                onClick={handleExportResults}
                disabled={!selectedElectionId || reportLoading}
                className="rounded-3xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {reportLoading
                  ? "Generating results..."
                  : "Export Final Results CSV"}
              </button>
              <button
                type="button"
                onClick={handleExportCandidates}
                disabled={!selectedElectionId || reportLoading}
                className="rounded-3xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {reportLoading
                  ? "Generating candidate report..."
                  : "Export Candidate Approval CSV"}
              </button>
              <button
                type="button"
                onClick={handleExportSummary}
                disabled={elections.length === 0 || reportLoading}
                className="rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {reportLoading
                  ? "Generating summary..."
                  : "Export Completed Elections Summary"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
