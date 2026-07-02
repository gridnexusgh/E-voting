import { BarChart3, Star } from "lucide-react";

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
          <p className="font-semibold text-gray-900 truncate">
            {candidate.name}
          </p>
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
            const winnerId = [...p.candidates].sort(
              (a, b) => b.votes - a.votes,
            )[0]?.id;
            return (
              <div
                key={p.position}
                className="bg-white rounded-2xl border border-gray-100 shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {p.position}
                  </h3>
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

const samplePortfolios: ResultPortfolio[] = [
  {
    position: "President",
    candidates: [
      {
        id: "p1",
        name: "Ama Boateng",
        photo:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
        votes: 1284,
      },
      {
        id: "p2",
        name: "Kwame Mensah",
        photo:
          "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=200&h=200&fit=crop&crop=face",
        votes: 902,
      },
    ],
  },
  {
    position: "Secretary",
    candidates: [
      {
        id: "s1",
        name: "Efua Owusu",
        photo:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
        votes: 640,
      },
      {
        id: "s2",
        name: "Yaw Darko",
        photo:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
        votes: 812,
      },
    ],
  },
];

export function GeneralElectionResult() {
  return (
    <ResultsView
      title="General Election Result"
      subtitle="University-wide governance tally"
      published={false}
      portfolios={samplePortfolios}
    />
  );
}

export function FacultyElectionResult() {
  return (
    <ResultsView
      title="Faculty Election Result"
      subtitle="Faculty of Applied Science and Technology"
      published={true}
      portfolios={samplePortfolios}
    />
  );
}

export function DepartmentElectionResult() {
  return (
    <ResultsView
      title="Department Election Result"
      subtitle="Department of Computer Science"
      published={false}
      portfolios={samplePortfolios}
    />
  );
}
