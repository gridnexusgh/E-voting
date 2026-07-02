import { useState, useEffect, useRef } from "react";
import { ArrowRight, CheckCircle2, Info, User as UserIcon } from "lucide-react";
import confetti from "canvas-confetti";

// ============================================================
// 1. Data Architecture
// ============================================================
export interface Candidate {
  id: string;
  name: string;
  avatarUrl?: string;
  slogan: string;
}

export interface Portfolio {
  id: string;
  title: string;
  candidates: Candidate[];
}

const MOCK_PORTFOLIOS: Portfolio[] = [
  {
    id: "src-president",
    title: "SRC Presidential Election",
    candidates: [
      { id: "p1", name: "Adebayo Ibrahim", slogan: "For Transparent Leadership" },
      { id: "p2", name: "Chioma Okafor", slogan: "For Transparent Leadership" },
      { id: "p3", name: "David Nwosu", slogan: "For Transparent Leadership" },
    ],
  },
  {
    id: "gen-sec",
    title: "General Secretary Election",
    candidates: [
      { id: "g1", name: "Amina Yusuf", slogan: "Service Above Self" },
      { id: "g2", name: "Kwame Mensah", slogan: "Documentation with Integrity" },
    ],
  },
  {
    id: "fin-sec",
    title: "Financial Secretary / Treasurer Election",
    candidates: [
      { id: "f1", name: "Ngozi Achebe", slogan: "Accountability First" },
      { id: "f2", name: "Samuel Boateng", slogan: "Every Cedi Counts" },
      { id: "f3", name: "Faith Owusu", slogan: "Transparent Books" },
      { id: "f4", name: "Michael Asante", slogan: "Fiscal Discipline" },
    ],
  },
  {
    id: "org-sec",
    title: "Organizing Secretary Election",
    candidates: [
      { id: "o1", name: "Zainab Adeola", slogan: "Events that Matter" },
      { id: "o2", name: "Kojo Antwi", slogan: "Structure and Purpose" },
    ],
  },
  {
    id: "pro",
    title: "PRO Election",
    candidates: [
      { id: "r1", name: "Linda Osei", slogan: "Your Voice, Amplified" },
      { id: "r2", name: "Emmanuel Tetteh", slogan: "Clear Communication" },
      { id: "r3", name: "Grace Appiah", slogan: "Story of the Students" },
    ],
  },
];

type VotingState = "idle" | "sliding" | "success" | "completed";

interface VotingBallotPageProps {
  portfolios?: Portfolio[];
  onExit?: () => void;
}

export function VotingBallotPage({
  portfolios = MOCK_PORTFOLIOS,
  onExit,
}: VotingBallotPageProps) {
  const [currentPortfolioIndex, setCurrentPortfolioIndex] = useState(0);
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(
    null
  );
  const [votingState, setVotingState] = useState<VotingState>("idle");
  const [votedCandidate, setVotedCandidate] = useState<Candidate | null>(null);
  const ballotBoxRef = useRef<HTMLDivElement | null>(null);

  const activePortfolio = portfolios[currentPortfolioIndex];

  // ============================================================
  // Empty state
  // ============================================================
  if (!portfolios || portfolios.length === 0 || !activePortfolio) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md w-full p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-5">
            <Info className="w-8 h-8 text-[#0E1E38]" />
          </div>
          <h2 className="text-xl font-bold text-[#0E1E38]">
            No Active Elections Available
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Please check back later when elections are available.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Handlers
  // ============================================================
  const fireConfetti = () => {
    const rect = ballotBoxRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 4) / window.innerHeight,
        }
      : { x: 0.5, y: 0.6 };

    confetti({
      particleCount: 120,
      spread: 90,
      startVelocity: 45,
      origin,
      colors: ["#0E1E38", "#0C1E4E", "#1e40af", "#60a5fa", "#ffffff"],
    });
  };

  const handleDragStart = (candidate: Candidate) => {
    if (votingState !== "idle") return;
    setDraggedCandidate(candidate);
  };

  const handleDragEnd = () => {
    setDraggedCandidate(null);
  };

  const handleBallotDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedCandidate || votingState !== "idle") return;

    const chosen = draggedCandidate;
    setVotedCandidate(chosen);
    setDraggedCandidate(null);
    setVotingState("sliding");

    // Wait for the slide-into-box animation to complete (500ms)
    window.setTimeout(() => {
      fireConfetti();
      setVotingState("success");
    }, 500);
  };

  const handleNext = () => {
    const isLast = currentPortfolioIndex >= portfolios.length - 1;
    setVotedCandidate(null);
    if (isLast) {
      setVotingState("completed");
    } else {
      setCurrentPortfolioIndex((i) => i + 1);
      setVotingState("idle");
    }
  };

  // ============================================================
  // Completed state
  // ============================================================
  if (votingState === "completed") {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-lg w-full p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#0E1E38]">
            Voting Complete
          </h2>
          <p className="mt-3 text-slate-500">
            You have successfully cast your vote for every position in this
            election. Thank you for participating in the HTU General Election.
          </p>
          {onExit && (
            <button
              onClick={onExit}
              className="mt-6 inline-flex items-center gap-2 bg-[#0E1E38] hover:bg-[#0C1E4E] text-white font-semibold px-6 py-3 rounded-full shadow-sm transition-colors"
            >
              Return to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // Main ballot UI
  // ============================================================
  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 space-y-10">
      <style>{`
        @keyframes slideIntoBox {
          0%   { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(82px); opacity: 1; }
        }
        .animate-slide-into-box {
          animation: slideIntoBox 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      {/* Header greeting */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-5">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0E1E38] text-center">
          Welcome to the HTU General Election
        </h1>
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-[#0C1E4E]">INSTRUCTIONS:</span>{" "}
          Drag the card of your preferred candidate and drop it into the ballot
          box slot below to cast your vote. You must vote for each position
          sequentially.
        </div>
      </div>

      {/* Portfolio title */}
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] text-slate-400 font-medium">
          POSITION {currentPortfolioIndex + 1} OF {portfolios.length}
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0E1E38] uppercase tracking-wide">
          {activePortfolio.title}
        </h2>
      </div>

      {/* Candidate deck */}
      <div className="flex flex-wrap justify-center gap-5">
...
        })}
      </div>

      {/* Ballot box */}
      <div className="flex justify-center mt-16">
        <div className="relative">
          {/* Masked overlay: clips the ballot as it crosses the slot line */}
          {votingState === "sliding" && votedCandidate && (
            <div
              className="absolute left-1/2 -translate-x-1/2 overflow-hidden pointer-events-none z-20"
              style={{ top: "-60px", height: "82px", width: "10rem" }}
            >
              <div
                className="absolute top-0 left-0 w-40 h-12 rounded-sm bg-white shadow-lg flex items-center justify-center text-[11px] font-semibold text-[#0E1E38] animate-slide-into-box"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(180deg, #ffffff 0 6px, #f1f5f9 6px 7px)",
                  borderTop: "2px solid #e2e8f0",
                }}
              >
                <span className="px-2 truncate">{votedCandidate.name}</span>
              </div>
            </div>
          )}

          <div
            ref={ballotBoxRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleBallotDrop}
            className={`bg-[#0E1E38] rounded-2xl w-80 h-44 shadow-lg flex flex-col items-center justify-center relative overflow-hidden transition-all duration-200 ${
              draggedCandidate ? "ring-4 ring-blue-300 scale-[1.02]" : ""
            }`}
          >
            {/* Slot line */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-40 h-1.5 bg-white/90 rounded-full shadow-inner z-10" />

            <p className="text-white font-bold tracking-[0.25em] text-lg mt-4">
              DROP HERE
            </p>
            <p className="text-blue-200/70 text-[10px] tracking-widest mt-2">
              HTU DIGITAL BALLOT BOX
            </p>
          </div>
        </div>
      </div>

      {/* Success flash */}
      {votingState === "success" && (
        <SuccessFlash candidateName={votedCandidate?.name || ""} />
      )}

      {/* Next button */}
      {votingState === "success" && (
        <div className="fixed bottom-8 right-8 z-30">
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 bg-[#0E1E38] hover:bg-[#0C1E4E] text-white font-semibold px-8 py-3 rounded-full shadow-xl transition-colors"
          >
            {currentPortfolioIndex >= portfolios.length - 1
              ? "Finish"
              : "Next"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function SuccessFlash({ candidateName }: { candidateName: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 20);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div
      className={`fixed inset-x-0 top-24 flex justify-center z-40 pointer-events-none transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-white border border-emerald-100 shadow-lg rounded-xl px-6 py-4 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        <div>
          <p className="font-bold text-[#0E1E38]">Vote Cast Successfully!</p>
          {candidateName && (
            <p className="text-xs text-slate-500">
              Your vote for {candidateName} has been recorded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default VotingBallotPage;
