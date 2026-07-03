import { useEffect, useState } from "react";
import { X, CheckCircle2, Loader2, Upload, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";

interface Slot {
  id: string;
  position_name: string;
  description?: string;
  application_fee?: number;
  application_opening?: string;
  application_closing?: string;
  election_title?: string;
  election_status?: string;
  position_status?: string;
  slot_state: "open" | "closed" | "upcoming" | "draft";
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

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

  function authorizePayment() {
    setStage("processing");
    setTimeout(() => {
      const ref = "HTU-" + Math.random().toString(36).slice(2, 10).toUpperCase();
      setSubmitted((s) => ({ ...s, [selected!.id]: ref }));
      setStage("done");
    }, 1500);
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

        const rawPositions = data ?? [];
        const totals = {
          noElection: 0,
          draftPosition: 0,
          draftElection: 0,
          facultyMismatch: 0,
          departmentMismatch: 0,
          statusMismatch: 0,
        };

        const visibleSlots = rawPositions.filter((position: any) => {
          const election = position.election;
          if (!election) {
            totals.noElection += 1;
            return false;
          }
          if (position.status === 'draft') {
            totals.draftPosition += 1;
            return false;
          }
          if (election.status === 'draft') {
            totals.draftElection += 1;
            return false;
          }
          if (election.category === 'faculty' && election.scope_id !== user.faculty_id) {
            totals.facultyMismatch += 1;
            return false;
          }
          if (election.category === 'department' && election.scope_id !== user.department_id) {
            totals.departmentMismatch += 1;
            return false;
          }
          if (!['published', 'active', 'closed', 'results_published'].includes(election.status)) {
            totals.statusMismatch += 1;
            return false;
          }
          return true;
        });

        const debugLines = [
          `Loaded ${rawPositions.length} enabled slot positions`,
          `Visible slots: ${visibleSlots.length}`,
        ];

        Object.entries(totals).forEach(([key, count]) => {
          if (count > 0) {
            debugLines.push(`${key}: ${count}`);
          }
        });

        console.groupCollapsed('StudentSlotsPage slot load debug');
        console.log('Student:', { id: user.id, faculty_id: user.faculty_id, department_id: user.department_id });
        console.log('Raw positions', rawPositions);
        console.log('Visible slots', visibleSlots);
        console.log('Filter totals', totals);
        console.groupEnd();
        setDebugInfo(debugLines);

      setSlots(
        visibleSlots.map((position: any) => {
          const election = position.election;
          const opening = position.application_opening ? new Date(position.application_opening) : null;
          const closing = position.application_closing ? new Date(position.application_closing) : null;
          let slot_state: Slot['slot_state'] = 'open';

          if (position.status === 'draft' || election?.status === 'draft') {
            slot_state = 'draft';
          } else if (
            position.status === 'closed' ||
            election?.status === 'closed' ||
            election?.status === 'results_published' ||
            (closing && now > closing)
          ) {
            slot_state = 'closed';
          } else if (opening && now < opening) {
            slot_state = 'upcoming';
          } else {
            slot_state = 'open';
          }

          return {
            id: position.id,
            position_name: position.position_name,
            description: position.description,
            application_fee: position.application_fee ?? 0,
            application_opening: position.application_opening,
            application_closing: position.application_closing,
            election_title: position.election?.title ?? 'Election slot',
            election_status: position.election?.status,
            position_status: position.status,
            slot_state,
          };
        }),
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

      {debugInfo.length > 0 && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Debug info</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            {debugInfo.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
      )}

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
            const isClosed = s.slot_state === 'closed' || s.slot_state === 'draft';
            const statusLabel =
              s.slot_state === 'draft'
                ? 'Draft'
                : s.slot_state === 'upcoming'
                ? 'Upcoming'
                : s.slot_state === 'closed'
                ? 'Closed'
                : 'Open';

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 flex flex-col"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-gray-900">{s.position_name}</h3>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                      statusLabel === 'Open'
                        ? 'bg-emerald-100 text-emerald-700'
                        : statusLabel === 'Upcoming'
                        ? 'bg-blue-100 text-blue-700'
                        : statusLabel === 'Draft'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
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
                    disabled={isClosed}
                    className={`mt-5 w-full font-semibold px-4 py-2.5 rounded-full transition ${
                      isClosed
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white hover:opacity-90'
                    }`}
                  >
                    {isClosed ? 'Unavailable' : 'Apply for Slot'}
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
