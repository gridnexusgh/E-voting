import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, CheckCircle2, Info, User as UserIcon, AlertTriangle, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";

// ============================================================
// 1. Data Architecture
// ============================================================
export interface Candidate {
  id: string;              // election_candidates.id
  name: string;
  avatarUrl?: string;
  slogan: string;
}

export interface Portfolio {
  id: string;              // election_positions.id
  electionId: string;      // elections.id (parent)
  title: string;           // position_name
  candidates: Candidate[];
}

type VotingState = "idle" | "sliding" | "success" | "completed";

interface VotingBallotPageProps {
  portfolios?: Portfolio[];
  onExit?: () => void;
}

export function VotingBallotPage({
  portfolios: portfoliosProp,
  onExit,
}: VotingBallotPageProps) {
  const { user } = useAuth();

  // Live-loaded portfolios (only used when caller doesn't pass an override).
  const [livePortfolios, setLivePortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const portfolios = portfoliosProp ?? livePortfolios;

  const [currentPortfolioIndex, setCurrentPortfolioIndex] = useState(0);
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);
  const [votingState, setVotingState] = useState<VotingState>("idle");
  const [votedCandidate, setVotedCandidate] = useState<Candidate | null>(null);
  const [fraudAlert, setFraudAlert] = useState<string>("");
  const ballotBoxRef = useRef<HTMLDivElement | null>(null);

  const activePortfolio = portfolios[currentPortfolioIndex];

  // ============================================================
  // Live fetch: elections + positions + approved candidates,
  // scoped by student faculty / department (Phase C & D gate).
  // ============================================================
  const fetchScopedElections = useCallback(async () => {
    if (portfoliosProp || !user) return;
    setIsLoading(true);
    try {
      const { data: elections, error: eErr } = await supabase
        .from("elections")
        .select("id, title, category, scope_id, status")
        .eq("status", "active");
      if (eErr) throw eErr;

      const visibleElections = (elections ?? []).filter((el: any) => {
        if (el.category === "university") return true;
        if (el.category === "faculty") return el.scope_id === user.faculty_id;
        if (el.category === "department") return el.scope_id === user.department_id;
        return false;
      });

      if (visibleElections.length === 0) {
        setLivePortfolios([]);
        return;
      }

      const electionIds = visibleElections.map((e: any) => e.id);

      const { data: positions, error: pErr } = await supabase
        .from("election_positions")
        .select("id, election_id, position_name, display_order")
        .in("election_id", electionIds)
        .eq("is_enabled", true)
        .order("display_order", { ascending: true });
      if (pErr) throw pErr;

      if (!positions || positions.length === 0) {
        setLivePortfolios([]);
        return;
      }

      const positionIds = positions.map((p: any) => p.id);

      const { data: candidates, error: cErr } = await supabase
        .from("election_candidates")
        .select("id, position_id, manifesto, profile_image_url, application_status, is_visible_for_voting, user:users(full_name)")
        .in("position_id", positionIds)
        .eq("application_status", "approved")
        .eq("is_visible_for_voting", true);
      if (cErr) throw cErr;

      // Assemble portfolios; drop positions without any approved candidates.
      const built: Portfolio[] = positions
        .map((p: any) => {
          const posCands = (candidates ?? []).filter((c: any) => c.position_id === p.id);
          return {
            id: p.id,
            electionId: p.election_id,
            title: p.position_name,
            candidates: posCands.map((c: any) => ({
              id: c.id,
              name: c.user?.full_name ?? "Candidate",
              avatarUrl: c.profile_image_url,
              slogan: c.manifesto ?? "",
            })),
          };
        })
        .filter((portfolio) => portfolio.candidates.length > 0);

      setLivePortfolios(built);
    } catch {
      setLivePortfolios([]);
    } finally {
      setIsLoading(false);
    }
  }, [portfoliosProp, user]);

  useEffect(() => {
    if (portfoliosProp) {
      setIsLoading(false);
      return;
    }
    fetchScopedElections();

    // Real-time master engine: monitor elections / positions / candidates
    // simultaneously so Officer approvals stream instantly into the ballot.
    const channel = supabase
      .channel("master-election-engine")
      .on("postgres_changes", { event: "*", schema: "public", table: "elections" }, fetchScopedElections)
      .on("postgres_changes", { event: "*", schema: "public", table: "election_positions" }, fetchScopedElections)
      .on("postgres_changes", { event: "*", schema: "public", table: "election_candidates" }, fetchScopedElections)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchScopedElections, portfoliosProp]);

  // ============================================================
  // Loading state
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md w-full p-10 text-center">
          <Loader2 className="mx-auto h-10 w-10 text-[#0E1E38] animate-spin" />
          <p className="mt-4 text-slate-600">Loading your ballot…</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Empty state (no active elections OR no approved candidates yet)
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

  const persistVote = async (chosen: Candidate) => {
    try {
      const { error } = await supabase.from("election_votes").insert([
        {
          election_id: activePortfolio.electionId,
          position_id: activePortfolio.id,
          candidate_id: chosen.id,
          voter_id: user?.id ?? null,
        },
      ]);
      if (error) throw error;
      setFraudAlert("");
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "23505") {
        setFraudAlert(
          "Double vote blocked: our records show you have already voted for this position.",
        );
      } else {
        setFraudAlert(err?.message || "We could not record your vote. Please retry.");
      }
    }
  };

  const handleBallotDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedCandidate || votingState !== "idle") return;

    const chosen = draggedCandidate;
    setVotedCandidate(chosen);
    setDraggedCandidate(null);
    setVotingState("sliding");

    // Fire-and-forget DB insert while the envelope slides.
    void persistVote(chosen);

    // Wait for the slide-into-box animation to complete.
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
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 pb-12 space-y-10">
      <style>{`
        @keyframes slideIntoBox {
          0%   { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(82px); opacity: 1; }
        }
        .animate-slide-into-box {
          animation: slideIntoBox 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {/* Anti-fraud red banner */}
      {fraudAlert && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-700 text-sm">Security Alert</p>
            <p className="text-sm text-red-600">{fraudAlert}</p>
          </div>
          <button
            onClick={() => setFraudAlert("")}
            className="text-red-500 hover:text-red-700 text-xs font-semibold"
          >
            DISMISS
          </button>
        </div>
      )}

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
        {activePortfolio.candidates.map((candidate) => {
          const isDragging = draggedCandidate?.id === candidate.id;
          const isVoted = votedCandidate?.id === candidate.id;
          const hide = isVoted && votingState !== "idle";
          return (
            <div
              key={candidate.id}
              draggable={votingState === "idle"}
              onDragStart={() => handleDragStart(candidate)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col items-center justify-between text-center transition-all duration-200 hover:shadow-md hover:scale-[1.02] w-52 ${
                votingState === "idle"
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-not-allowed opacity-70"
              } ${isDragging ? "opacity-40" : ""} ${
                hide ? "invisible" : ""
              }`}
            >
              <div className="w-20 h-20 rounded-full border-2 border-[#0E1E38]/20 bg-slate-50 overflow-hidden flex items-center justify-center">
                {candidate.avatarUrl ? (
                  <img
                    src={candidate.avatarUrl}
                    alt={candidate.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <h3 className="mt-4 font-bold text-[#0E1E38] text-base">
                {candidate.name}
              </h3>
              <p className="mt-1 text-xs italic text-slate-500">
                {candidate.slogan}
              </p>
            </div>
          );
        })}
      </div>

      {/* Forced spacer between candidate deck and ballot box */}
      <div className="w-full clear-both" style={{ height: '70px' }} />

      {/* Ballot box */}
      <div className="flex justify-center">

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
