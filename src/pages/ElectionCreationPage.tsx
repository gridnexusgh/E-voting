// @ts-nocheck
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  createElection,
  getDepartmentsByFacultyId,
  getFaculties,
} from "../services/election";
import type { Department, ElectionCategory, Faculty } from "../types";

interface ElectionFormState {
  title: string;
  description: string;
  academicYear: string;
  category: ElectionCategory;
  facultyId: string;
  departmentId: string;
  votingStart: string;
  votingEnd: string;
}

const initialForm: ElectionFormState = {
  title: "",
  description: "",
  academicYear: "",
  category: "university",
  facultyId: "",
  departmentId: "",
  votingStart: "",
  votingEnd: "",
};

const categoryOptions: Array<{ value: ElectionCategory; label: string }> = [
  { value: "university", label: "University (General Election)" },
  { value: "faculty", label: "Faculty Election" },
  { value: "department", label: "Department Election" },
];

export function ElectionCreationPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<ElectionFormState>(initialForm);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFaculties() {
      try {
        const facultyData = await getFaculties();
        setFaculties(facultyData);
      } catch {
        setError("Unable to load faculties. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }

    loadFaculties();
  }, []);

  useEffect(() => {
    if (form.category === "department" && form.facultyId) {
      async function loadDepartments() {
        try {
          const departmentData = await getDepartmentsByFacultyId(
            form.facultyId,
          );
          setDepartments(departmentData);
        } catch {
          setError("Unable to load departments for the selected faculty.");
        }
      }

      loadDepartments();
    } else {
      setDepartments([]);
      setForm((prev) => ({ ...prev, departmentId: "" }));
    }
  }, [form.category, form.facultyId]);

  const handleChange = (
    field: keyof ElectionFormState,
    value: string | boolean,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCategoryChange = (value: ElectionCategory) => {
    setForm((current) => ({
      ...current,
      category: value,
      facultyId: value === "university" ? "" : current.facultyId,
      departmentId: value !== "department" ? "" : current.departmentId,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!user?.id) {
      setError("Unable to create election without a signed-in user.");
      return;
    }

    if (!form.title.trim()) {
      setError("Election title is required.");
      return;
    }

    if (!form.academicYear.trim()) {
      setError("Academic year is required.");
      return;
    }

    if (!form.votingStart || !form.votingEnd) {
      setError("Voting start and end dates are required.");
      return;
    }

    if (new Date(form.votingEnd) <= new Date(form.votingStart)) {
      setError("Voting end must be after the voting start date.");
      return;
    }

    if (form.category === "faculty" && !form.facultyId) {
      setError("Please select a faculty for this election.");
      return;
    }

    if (
      form.category === "department" &&
      (!form.facultyId || !form.departmentId)
    ) {
      setError(
        "Please select both a faculty and a department for this election.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const scopeId =
        form.category === "university"
          ? undefined
          : form.category === "faculty"
            ? form.facultyId
            : form.departmentId;

      await createElection({
        officer_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        academic_year: form.academicYear.trim(),
        category: form.category,
        scope_id: scopeId,
        nomination_start: undefined,
        nomination_end: undefined,
        voting_start: form.votingStart,
        voting_end: form.votingEnd,
        slot_application_fee: 0,
        enable_payment: false,
        total_voters: 0,
        total_votes_cast: 0,
        status: "draft",
      });

      setSuccess(
        "Election created successfully. You can now add slots and positions.",
      );
      setForm(initialForm);
      setDepartments([]);
    } catch {
      setError("Failed to create the election. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-8 shadow-lg border border-slate-200 sm:p-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-600">
              Create Election
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Add a new election
            </h1>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {form.category === "university" && "University-wide election"}
            {form.category === "faculty" && "Faculty-level election"}
            {form.category === "department" && "Department-level election"}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Election Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="SRC General Election 2026"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Academic Year
              </label>
              <input
                type="text"
                value={form.academicYear}
                onChange={(e) => handleChange("academicYear", e.target.value)}
                placeholder="2025 / 2026"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="block text-sm font-medium text-slate-700">
                  Election Type
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {categoryOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleCategoryChange(option.value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        form.category === option.value
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:bg-blue-50"
                      }`}
                    >
                      <span className="font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Voting Start
                  </label>
                  <input
                    type="datetime-local"
                    value={form.votingStart}
                    onChange={(e) =>
                      handleChange("votingStart", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Voting End
                  </label>
                  <input
                    type="datetime-local"
                    value={form.votingEnd}
                    onChange={(e) => handleChange("votingEnd", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            {(form.category === "faculty" ||
              form.category === "department") && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Faculty
                </label>
                <select
                  value={form.facultyId}
                  onChange={(e) => handleChange("facultyId", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select a faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.category === "department" && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Department
                </label>
                <select
                  value={form.departmentId}
                  onChange={(e) => handleChange("departmentId", e.target.value)}
                  disabled={!form.facultyId}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Select a department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Optional election overview or special instructions"
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setForm(initialForm)}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSaving ? "Saving..." : "Create Election"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
