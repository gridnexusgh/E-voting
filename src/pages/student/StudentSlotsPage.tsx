import { useEffect, useState } from "react";
import { X, CheckCircle2, Loader2, Upload, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";

interface Slot {
  id: string;
  election_id: string;
  position_name: string;
  description?: string;
  application_fee?: number;
  application_opening?: string;
  application_closing?: string;
  election_title?: string;
}


type Stage = "form" | "payment" | "processing" | "done";

export function StudentSlotsPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Slot | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [submitted, setSubmitted] = useState<Record<string, string>>({});
  const [declaration, setDeclaration] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  function openSlot(s: Slot) {
    setSelected(s);
    setStage("form");
    setDeclaration("");
    setFile(null);
    setError("");
  }

  function close() {
    setSelected(null);
  }

  function submitForm() {
    if (declaration.trim().length < 20) {
      setError("Declaration must be at least 20 characters.");
      return;
    }
    if (!file) {
      setError("Please upload your student ID card.");
      return;
    }
    setError("");
    setStage("payment");
  }

  async function authorizePayment() {
    if (!selected || !user) return;
    setStage("processing");
    try {
      // Phase B: file the application into election_candidates
      const { data, error: insertError } = await supabase
        .from("election_candidates")
        .insert([
          {
            election_id: (selected as any).election_id,
            position_id: selected.id,
            user_id: user.id,
            student_record_id: user.student_record_id ?? null,
            application_status: "pending",
            payment_status: "successful",
            is_visible_for_voting: false,
            manifesto: declaration,
            submission_date: new Date().toISOString(),
          },
        ])
        .select("id")
        .single();

      if (insertError) throw insertError;

      const ref =
        "HTU-" + (data?.id ? String(data.id).slice(0, 8).toUpperCase() : Math.random().toString(36).slice(2, 10).toUpperCase());
      setSubmitted((s) => ({ ...s, [selected.id]: ref }));
      setStage("done");
    } catch (err: any) {
      const code = err?.code ?? "";
      const msg =
        code === "23505"
          ? "You have already applied for this position."
          : err?.message || "Unable to submit application. Please try again.";
      setError(msg);
      setStage("form");
    }
  }


  useEffect(() => {
    if (!user?.id) return;

    async function loadSlots() {
      setIsLoadingSlots(true);
      try {
        const { data, error } = await supabase
          .from('election_positions')
          .select('*, election:elections(id,title,category,scope_id,status)')
          .eq('is_enabled', true)
          .order('display_order', { ascending: true });

        if (error) {
          throw error;
        }

        const visibleSlots = (data ?? []).filter((position: any) => {
          const election = position.election;
          if (!election || !['published', 'active'].includes(election.status)) {
            return false;
          }
          if (election.category === 'university') return true;
          if (election.category === 'faculty') return election.scope_id === user.faculty_id;
          if (election.category === 'department') return election.scope_id === user.department_id;
          return false;
        });

        setSlots(
          visibleSlots.map((position: any) => ({
            id: position.id,
            position_name: position.position_name,
            description: position.description,
            application_fee: position.application_fee ?? 0,
            application_opening: position.application_opening,
            application_closing: position.application_closing,
            election_title: position.election?.title ?? 'Election slot',
          })),
        );
      } catch {
        setError('Unable to load open slots. Please try again.');
      } finally {
        setIsLoadingSlots(false);
      }
    }

    loadSlots();
  }, [user?.id]);

  return (
    <section className="space-y-6">
      <div className="bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold">Open Governance Slots</h2>
        <p className="text-blue-100 text-sm mt-1">
          Apply for a nomination slot published by the Election Officer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoadingSlots ? (
          <div className="col-span-full rounded-2xl border border-gray-100 bg-white p-10 text-center">
            <Loader2 className="mx-auto h-10 w-10 text-[#0C1E4E] animate-spin" />
            <p className="mt-4 text-gray-600">Loading available slots...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-gray-100 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-gray-900">No available slots yet</p>
            <p className="mt-2 text-sm text-gray-500">
              The election officer has not published any nomination slots in your area yet.
            </p>
          </div>
        ) : (
          slots.map((s) => {
            const applied = submitted[s.id];
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 flex flex-col"
              >
                <h3 className="text-lg font-bold text-gray-900">{s.position_name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Election: <span className="font-medium text-slate-700">{s.election_title}</span>
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  {s.description ?? 'No description available for this slot.'}
                </p>
                <p className="mt-4 text-sm text-gray-500">
                  Nomination fee:{" "}
                  <span className="font-semibold text-[#0C1E4E]">
                    GH₵ {s.application_fee?.toFixed(2) ?? '0.00'}
                  </span>
                </p>
                {applied ? (
                  <div className="mt-5 inline-flex items-center justify-center gap-2 bg-emerald-500 text-white font-semibold px-4 py-2 rounded-full text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    APPLICATION SUBMITTED
                  </div>
                ) : (
                  <button
                    onClick={() => openSlot(s)}
                    className="mt-5 bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white font-semibold px-4 py-2.5 rounded-full hover:opacity-90 transition"
                  >
                    Apply for Slot
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {stage === "form" && "Slot Application"}
                {stage === "payment" && "Payment Summary"}
                {stage === "processing" && "Processing"}
                {stage === "done" && "Application Submitted"}
              </h3>
              <button
                onClick={close}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {stage === "form" && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Full Name & Index ID
                    </label>
                    <input
                      readOnly
                      value={`${user?.full_name || "Student"} — ${user?.username || user?.id?.slice(0, 8) || "N/A"}`}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Declaration Statement
                    </label>
                    <textarea
                      value={declaration}
                      onChange={(e) => setDeclaration(e.target.value)}
                      rows={4}
                      placeholder="I hereby declare that all information provided is accurate..."
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0C1E4E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      Student ID Card Upload
                    </label>
                    <label className="mt-1 flex items-center gap-3 px-3 py-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#0C1E4E]">
                      <Upload className="w-5 h-5 text-[#0C1E4E]" />
                      <span className="text-sm text-gray-600">
                        {file ? file.name : "Click to upload ID card"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                  <button
                    onClick={submitForm}
                    className="w-full bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white font-semibold py-3 rounded-full hover:opacity-90"
                  >
                    Continue to Payment
                  </button>
                </>
              )}

              {stage === "payment" && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Position</span>
                        <span className="font-medium">{selected.position_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Applicant</span>
                      <span className="font-medium">{user?.full_name}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Nomination Fee</span>
                      <span className="font-bold text-[#0C1E4E]">
                          GH₵ {selected.application_fee?.toFixed(2) ?? '0.00'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={authorizePayment}
                    className="w-full bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white font-semibold py-3 rounded-full hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Authorize Payment & Submit
                  </button>
                </>
              )}

              {stage === "processing" && (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-[#0C1E4E]" />
                  <p className="text-gray-600">Processing payment...</p>
                </div>
              )}

              {stage === "done" && (
                <div className="py-6 text-center space-y-3">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">
                    Application Submitted
                  </h4>
                  <p className="text-sm text-gray-500">
                    Reference:{" "}
                    <span className="font-mono font-semibold text-[#0C1E4E]">
                      {submitted[selected.id]}
                    </span>
                  </p>
                  <button
                    onClick={close}
                    className="mt-2 bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white font-semibold px-6 py-2.5 rounded-full hover:opacity-90"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
