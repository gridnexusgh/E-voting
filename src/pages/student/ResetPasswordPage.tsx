import { useState } from "react";
import { ShieldCheck, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function ResetPasswordPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function verifyIdentity() {
    if (!email || !currentPassword) {
      setError("Both fields are required.");
      return;
    }
    setError("");
    setVerifying(true);
    setTimeout(() => {
      setToken("tkn_" + Math.random().toString(36).slice(2, 12));
      setVerifying(false);
      setTimeout(() => setStep(2), 400);
    }, 1200);
  }

  function saveNewPassword() {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setSaving(true);
    setTimeout(async () => {
      await logout();
      navigate("/login", { replace: true });
    }, 1500);
  }

  return (
    <section className="max-w-xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <KeyRound className="w-6 h-6" /> Reset Password
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          Two-step secure identity verification before updating your credentials.
        </p>
      </div>

      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-md p-6 overflow-hidden">
        <div
          className={`transition-all duration-500 ${
            step === 1
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-6 hidden"
          }`}
        >
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0C1E4E]" /> Step 1 — Verify
            Identity
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">
                Student Institutional Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0C1E4E] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">
                Current Account Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0C1E4E] focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {token && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" /> Identity verified. Token{" "}
                <span className="font-mono">{token}</span>
              </div>
            )}
            <button
              onClick={verifyIdentity}
              disabled={verifying}
              className="w-full bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white font-semibold py-3 rounded-full hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify Identity
            </button>
          </div>
        </div>

        <div
          className={`transition-all duration-500 ${
            step === 2
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-6 hidden"
          }`}
        >
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#0C1E4E]" /> Step 2 — New Password
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">
                Enter New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0C1E4E] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0C1E4E] focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={saveNewPassword}
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#0C1E4E] to-[#0E1E38] text-white font-semibold py-3 rounded-full hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Updating & Revoking Sessions..." : "Save and Update Password"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
