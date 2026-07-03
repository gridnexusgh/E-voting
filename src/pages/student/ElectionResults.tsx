import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { BarChart3, Star } from "lucide-react";
import {
  getCompletedStudentElections,
  tallyElectionResults,
} from "../../services/election";

export interface ResultCandidate {
  id: string;
  name: string;
  photo: string;
  votes: number;
}

export interface ResultPortfolio {
  position: string;
  candidates: ResultCandidate[];
}

interface ResultsViewProps {
  title: string;
  subtitle: string;
  published: boolean;
  portfolios?: ResultPortfolio[];
}

function PendingState({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="relative max-w-lg w-full bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-10 text-center">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0C1E4E] to-[#0E1E38] flex items-center justify-center shadow-lg">
          <BarChart3 className="w-10 h-10 text-white/90" />
        </div>
        <h3 className="mt-6 text-xl font-bold text-gray-900">
          Results Pending Official Publication
        </h3>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          The Election Officer has not finalized or released the final tallies
          for {title}. Please check back later.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
      <p className="text-sm font-semibold">Unable to load election results</p>
      <p className="mt-2 text-sm text-red-700">{message}</p>
    </div>
  );
}

function CandidateRow({
  candidate,
  total,
  isWinner,
}: {
  candidate: ResultCandidate;
  total: number;
  isWinner: boolean;
}) {
  const pct = total > 0 ? Math.round((candidate.votes / total) * 100) : 0;
  return (
    <div
      className={`relative flex items-center gap-4 p-4 rounded-xl border ${
        isWinner
          ? "border-emerald-300 bg-emerald-50/40"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="relative">
        <img
          src={candidate.photo}
          alt={candidate.name}
          className="w-14 h-14 rounded-full object-cover border-2 border-[#0C1E4E]"
        />
        {isWinner && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
            <Star className="w-3.5 h-3.5" fill="white" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-gray-900 truncate">{candidate.name}</p>
          <p className="text-lg font-extrabold text-[#0C1E4E]">
            {candidate.votes.toLocaleString()}
          </p>
        </div>
        <div className="mt-2 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              isWinner
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : "bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">{pct}% of votes</p>
      </div>
    </div>
  );
}

export function ResultsView({
  title,
  subtitle,
  published,
  portfolios = [],
}: ResultsViewProps) {
  return (
    <section className="space-y-6">
      <div className="bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-blue-100 text-sm mt-1">{subtitle}</p>
      </div>

      {!published ? (
        <PendingState title={title} />
      ) : (
        <div className="space-y-6">
          {portfolios.map((p) => {
            const total = p.candidates.reduce((s, c) => s + c.votes, 0);
            const winnerId = [...p.candidates].sort((a, b) => b.votes - a.votes)[0]?.id;
            return (
              <div
                key={p.position}
                className="bg-white rounded-2xl border border-gray-100 shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{p.position}</h3>
                  <span className="text-xs text-gray-500">
                    {total.toLocaleString()} total votes
                  </span>
                </div>
                <div className="space-y-3">
                  {p.candidates.map((c) => (
                    <CandidateRow
                      key={c.id}
                      candidate={c}
                      total={total}
                      isWinner={c.id === winnerId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface LiveStudentElectionResultProps {
  category: "university" | "faculty" | "department";
  title: string;
  subtitle: string;
}

function LiveStudentElectionResult({ category, title, subtitle }: LiveStudentElectionResultProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [published, setPublished] = useState(false);
  const [portfolios, setPortfolios] = useState<ResultPortfolio[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function loadElectionResults() {
      if (!user) return;
      setIsLoading(true);
      setError("");
      setPortfolios([]);

      try {
        const elections = await getCompletedStudentElections(
          user.faculty_id,
          user.department_id,
        );

        const visibleElections = elections.filter((election) => {
          if (category === "university") return election.category === "university";
          if (category === "faculty") return (
            election.category === "faculty" &&
            election.scope_id === user.faculty_id
          );
          if (category === "department") return (
            election.category === "department" &&
            election.scope_id === user.department_id
          );
          return false;
        });

        if (!visibleElections.length) {
          setError(
            "No completed election results available for this category.",
          );
          return;
        }

        const latestElection = visibleElections[0];
        setPublished(latestElection.status === "results_published");

        const tally = await tallyElectionResults(latestElection.id);
        const portfolios = tally.map((position) => ({
          position: position.position,
          candidates: position.candidates.map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            votes: candidate.votes,
            photo:
              candidate.profile_image_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                candidate.name,
              )}&background=2563EB&color=ffffff`,
          })),
        }));

        if (active) {
          setPortfolios(portfolios);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError("Unable to load election results. Please refresh the page.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadElectionResults();

    return () => {
      active = false;
    };
  }, [category, user]);

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
        Loading student information...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
        Loading election results...
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <ResultsView
      title={title}
      subtitle={subtitle}
      published={published}
      portfolios={portfolios}
    />
  );
}

export function GeneralElectionResult() {
  return (
    <LiveStudentElectionResult
      category="university"
      title="General Election Result"
      subtitle="University-wide governance tally"
    />
  );
}

export function FacultyElectionResult() {
  return (
    <LiveStudentElectionResult
      category="faculty"
      title="Faculty Election Result"
      subtitle="Faculty-level final tally"
    />
  );
}

export function DepartmentElectionResult() {
  return (
    <LiveStudentElectionResult
      category="department"
      title="Department Election Result"
      subtitle="Department-level final tally"
    />
  );
}
