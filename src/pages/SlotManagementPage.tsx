// @ts-nocheck
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getOfficerElections,
  getElectionPositions,
  getPositionCandidateStats,
  createPosition,
  updatePosition,
} from "../services/election";
import type { Election, ElectionPosition } from "../types";
import { Plus, Edit3, Save, CheckCircle2, ArrowRight } from "lucide-react";

interface SlotFormState {
  electionId: string;
  slotName: string;
  description: string;
  openingAt: string;
  closingAt: string;
  applicationFee: string;
  maxApplicants: string;
  enabled: boolean;
}

type SlotStatus = "draft" | "published" | "closed";

interface SlotRow extends ElectionPosition {
  election_title: string;
  opening_at: string;
  closing_at: string;
  fee: number;
  maxApplicants?: number;
  enabled: boolean;
  status: SlotStatus;
  applicantsCount: number;
  paymentSummary: {
    pending: number;
    successful: number;
    failed: number;
  };
}

const initialForm: SlotFormState = {
  electionId: "",
  slotName: "",
  description: "",
  openingAt: "",
  closingAt: "",
  applicationFee: "0.00",
  maxApplicants: "",
  enabled: true,
};

export function SlotManagementPage() {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [form, setForm] = useState<SlotFormState>(initialForm);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const visibleElections = elections.filter(isElectionVisibleToUser);
  const selectedVisibleElection = visibleElections.find(
    (election) => election.id === form.electionId,
  );

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    async function loadData() {
      try {
        const electionsData = await getOfficerElections(userId);
        setElections(electionsData);

        const slotRows: SlotRow[] = [];
        const positionIds: string[] = [];

        for (const election of electionsData) {
          const positions = await getElectionPositions(election.id);
          positions.forEach((position) => {
            positionIds.push(position.id);
            slotRows.push({
              ...position,
              election_title: election.title,
              opening_at: position.application_opening ?? "",
              closing_at: position.application_closing ?? "",
              fee:
                position.application_fee ??
                Number(election.slot_application_fee ?? 0),
              maxApplicants: position.max_applicants ?? undefined,
              enabled: position.is_enabled ?? true,
              status: position.status ?? "draft",
              applicantsCount: 0,
              paymentSummary: { pending: 0, successful: 0, failed: 0 },
            });
          });
        }

        if (positionIds.length > 0) {
          const stats = await getPositionCandidateStats(positionIds);
          const statsByPosition = new Map(
            stats.map((item) => [
              item.position_id,
              {
                applicantsCount: 0,
                pending: 0,
                successful: 0,
                failed: 0,
              },
            ]),
          );

          stats.forEach(({ position_id, payment_status }) => {
            const current = statsByPosition.get(position_id) ?? {
              applicantsCount: 0,
              pending: 0,
              successful: 0,
              failed: 0,
            };
            current.applicantsCount += 1;
            if (payment_status === "pending") current.pending += 1;
            if (payment_status === "successful") current.successful += 1;
            if (payment_status === "failed") current.failed += 1;
            statsByPosition.set(position_id, current);
          });

          setSlots(
            slotRows.map((slot) => {
              const stat = statsByPosition.get(slot.id);
              return stat
                ? {
                    ...slot,
                    applicantsCount: stat.applicantsCount,
                    paymentSummary: stat,
                  }
                : slot;
            }),
          );
        } else {
          setSlots(slotRows);
        }
      } catch {
        setError("Unable to load elections and slots. Please try again.");
      }
    }

    loadData();
  }, [user?.id]);

  const isSlotClosed = (slot: SlotRow) => {
    if (!slot.closing_at) return false;
    return new Date(slot.closing_at) <= new Date();
  };

  const resetForm = () => {
    setEditingSlotId(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
  };

  const handleFormChange = (
    field: keyof SlotFormState,
    value: string | boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditSlot = (slot: SlotRow) => {
    setEditingSlotId(slot.id);
    setForm({
      electionId:
        elections.find((election) => election.title === slot.election_title)
          ?.id ?? "",
      slotName: slot.position_name,
      description: slot.description ?? "",
      openingAt: slot.opening_at,
      closingAt: slot.closing_at,
      applicationFee: slot.fee.toFixed(2),
      maxApplicants: slot.maxApplicants?.toString() ?? "",
      enabled: slot.enabled,
    });
    setError("");
    setSuccess("");
  };

  const handleSaveSlot = async (publish = false) => {
    setError("");
    setSuccess("");

    if (!form.electionId || !form.slotName || !selectedVisibleElection) {
      setError("Please select a visible election and choose a position.");
      return;
    }

    if (
      form.closingAt &&
      form.openingAt &&
      new Date(form.closingAt) <= new Date(form.openingAt)
    ) {
      setError(
        "Closing date and time must be later than the opening date and time.",
      );
      return;
    }

    setIsSaving(true);

    try {
      if (editingSlotId) {
        const currentSlot = slots.find((item) => item.id === editingSlotId);
        const updates = {
          position_name: form.slotName,
          description: form.description,
          number_of_winners: form.maxApplicants
            ? Number(form.maxApplicants)
            : 1,
          application_opening: form.openingAt || undefined,
          application_closing: form.closingAt || undefined,
          application_fee: Number(form.applicationFee),
          max_applicants: form.maxApplicants
            ? Number(form.maxApplicants)
            : undefined,
          is_enabled: form.enabled,
          status: publish ? "published" : (currentSlot?.status ?? "draft"),
        };
        await updatePosition(editingSlotId, updates);

        setSlots((current) =>
          current.map((slot) =>
            slot.id === editingSlotId
              ? {
                  ...slot,
                  position_name: form.slotName,
                  description: form.description,
                  opening_at: form.openingAt,
                  closing_at: form.closingAt,
                  fee: Number(form.applicationFee),
                  maxApplicants: form.maxApplicants
                    ? Number(form.maxApplicants)
                    : undefined,
                  enabled: form.enabled,
                  status: publish ? "published" : slot.status,
                }
              : slot,
          ),
        );

        setSuccess(
          publish ? "Slot published successfully!" : "Slot draft updated.",
        );
      } else {
        const newPosition = await createPosition({
          election_id: form.electionId,
          position_name: form.slotName,
          description: form.description,
          number_of_winners: form.maxApplicants
            ? Number(form.maxApplicants)
            : 1,
          application_opening: form.openingAt || undefined,
          application_closing: form.closingAt || undefined,
          application_fee: Number(form.applicationFee),
          max_applicants: form.maxApplicants
            ? Number(form.maxApplicants)
            : undefined,
          is_enabled: form.enabled,
          status: publish ? "published" : "draft",
          display_order: undefined,
        });

        const election = elections.find((item) => item.id === form.electionId);
        if (!election) throw new Error("Election not found");

        const newSlot: SlotRow = {
          ...newPosition,
          election_title: election.title,
          opening_at: form.openingAt,
          closing_at: form.closingAt,
          fee: Number(form.applicationFee),
          maxApplicants: form.maxApplicants
            ? Number(form.maxApplicants)
            : undefined,
          enabled: form.enabled,
          status: publish ? "published" : "draft",
          applicantsCount: 0,
          paymentSummary: { pending: 0, successful: 0, failed: 0 },
        };

        setSlots((current) => [newSlot, ...current]);
        setSuccess(
          publish ? "Slot published successfully!" : "Slot saved as draft.",
        );
      }

      resetForm();
    } catch {
      setError("Unable to save slot. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (slotId: string) => {
    const slot = slots.find((position) => position.id === slotId);
    if (!slot) return;

    try {
      const updated = await updatePosition(slotId, {
        is_enabled: !slot.enabled,
      });
      setSlots((current) =>
        current.map((item) =>
          item.id === slotId
            ? { ...item, enabled: updated.is_enabled ?? !item.enabled }
            : item,
        ),
      );
    } catch {
      setError("Unable to update slot status. Please try again.");
    }
  };

  const slotStatusLabel = (slot: SlotRow) => {
    if (isSlotClosed(slot)) return "closed";
    return slot.status;
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-600">
              Create Election Slot
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Slot Management
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Create application slots, select the election and position, then
              publish or keep the slot as a draft.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <Plus className="h-4 w-4" />
            Create or manage slots for your election.
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="mb-6 space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Election
              </label>
              <select
                value={form.electionId}
                onChange={(event) =>
                  handleFormChange("electionId", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select an election</option>
                {visibleElections.map((election) => (
                  <option key={election.id} value={election.id}>
                    {election.title}
                  </option>
                ))}
              </select>
              <p className="text-sm text-slate-500">
                Only general elections or those matching your faculty/department
                are shown.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Position
              </label>
              <input
                type="text"
                value={form.slotName}
                onChange={(event) =>
                  handleFormChange("slotName", event.target.value)
                }
                placeholder="Enter position name"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Slot Description
              </label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  handleFormChange("description", event.target.value)
                }
                placeholder="Describe the responsibilities or eligibility for this slot"
                className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Opening Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.openingAt}
                  onChange={(event) =>
                    handleFormChange("openingAt", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Closing Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.closingAt}
                  onChange={(event) =>
                    handleFormChange("closingAt", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Application Fee
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.applicationFee}
                  onChange={(event) =>
                    handleFormChange("applicationFee", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Max Applicants (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxApplicants}
                  onChange={(event) =>
                    handleFormChange("maxApplicants", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Slot Status
                </p>
                <p className="text-sm text-slate-500">
                  {form.enabled ? "Enabled" : "Disabled"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleFormChange("enabled", !form.enabled)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  form.enabled
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {form.enabled ? "Enabled" : "Disabled"}
              </button>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {success && (
              <p className="mt-4 text-sm text-emerald-600">{success}</p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveSlot(false)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveSlot(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <CheckCircle2 className="h-4 w-4" />
                Publish Slot
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Slots created</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                  {slots.length}
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <ArrowRight className="h-4 w-4" />
                Active slot planning
              </div>
            </div>

            {slots.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                <p>No slots created yet.</p>
                <p className="mt-2 text-sm">
                  Use the form to create a new election slot and publish it for
                  students.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="rounded-3xl border border-slate-200 p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {slot.position_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {slot.election_title}
                        </p>
                      </div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white ${
                          slotStatusLabel(slot) === "draft"
                            ? "bg-slate-500"
                            : slotStatusLabel(slot) === "published"
                              ? "bg-blue-600"
                              : slotStatusLabel(slot) === "closed"
                                ? "bg-rose-500"
                                : "bg-slate-500"
                        }`}
                      >
                        {slotStatusLabel(slot)}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                          Applications
                        </p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">
                          {slot.applicantsCount}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                          Fee
                        </p>
                        <p className="mt-2 text-xl font-semibold text-slate-900">
                          ${slot.fee.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                          Deadline
                        </p>
                        <p className="mt-2 text-sm text-slate-900">
                          {slot.closing_at || "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={() => handleEditSlot(slot)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(slot.id)}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                          slot.enabled
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {slot.enabled ? "Deactivate" : "Activate"}
                      </button>
                      <span className="text-sm text-slate-500">
                        {slot.maxApplicants
                          ? `${slot.maxApplicants} max applicants`
                          : "No max applicants"}
                      </span>
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
