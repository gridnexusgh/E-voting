import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getOfficerElections, getElectionPayments } from "../services/election";
import { Download } from "lucide-react";
import type { Election, ElectionPayment } from "../types";

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
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")]
    .concat(
      rows.map((row) =>
        headers.map((k) => escapeCsvValue(row[k] as any)).join(","),
      ),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function PaymentsPage() {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [payments, setPayments] = useState<ElectionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    async function load() {
      setIsLoading(true);
      try {
        const list = await getOfficerElections(userId);
        setElections(list);
        if (list.length > 0) setSelectedElectionId(list[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedElectionId) return;
    let mounted = true;
    async function loadPayments() {
      setIsLoading(true);
      try {
        const p = await getElectionPayments(selectedElectionId);
        if (mounted) setPayments(p as ElectionPayment[]);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadPayments();
    return () => {
      mounted = false;
    };
  }, [selectedElectionId]);

  const totalRevenue = useMemo(
    () => payments.reduce((s, p) => s + (p.amount || 0), 0),
    [payments],
  );

  const formatGhs = (v: number | undefined) => {
    try {
      return new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
      }).format(v ?? 0);
    } catch {
      return `₵${(v ?? 0).toLocaleString()}`;
    }
  };

  function handleExport() {
    if (!payments.length) return;
    setIsExporting(true);
    try {
      const rows = payments.map((p) => ({
        payment_id: p.id,
        candidate_id: p.candidate_id,
        candidate_name: (p as any)?.candidate?.user?.full_name ?? "",
        position: (p as any)?.candidate?.position?.position_name ?? "",
        amount: p.amount,
        status: p.payment_status,
        transaction_id: p.transaction_id || "",
        created_at: p.created_at,
      }));
      downloadCsv(`${selectedElectionId}_payments.csv`, rows);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-600">
              Payments
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Slot payments and revenue
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Track payments collected for slot applications and export payment
              records.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
            Revenue tracking
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="text-sm text-slate-500">Select election</label>
            <select
              value={selectedElectionId}
              onChange={(e) => setSelectedElectionId(e.target.value)}
              className="w-full mt-2 rounded-2xl border border-slate-300 bg-white px-4 py-2"
            >
              {elections.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.title} • {el.academic_year}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total revenue collected</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatGhs(totalRevenue)}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {payments.length} payments
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Payments</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={isExporting || payments.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-slate-500">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No payments for this election.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2">Candidate</th>
                    <th className="py-2">Position</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Transaction</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-3">
                        {(p as any)?.candidate?.user?.full_name ??
                          p.candidate_id}
                      </td>
                      <td className="py-3">
                        {(p as any)?.candidate?.position?.position_name ?? "-"}
                      </td>
                      <td className="py-3">{formatGhs(p.amount || 0)}</td>
                      <td className="py-3">{p.payment_status}</td>
                      <td className="py-3">{p.transaction_id ?? "-"}</td>
                      <td className="py-3">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
