"use client";

import NavBar from "../../components/NavBar";
import { useAuth } from "../../hooks/useAuth";
import { api }     from "../../lib/api";
import { useState } from "react";

export default function ChangePasswordPage() {
  const { token, ready } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Show/hide toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!ready) return null;

  // Password strength checker
  const strength = (pw: string): { score: number; label: string; color: string } => {
    if (!pw) return { score: 0, label: "", color: "#1a1a1a" };
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: "Weak",   color: "#e06060" };
    if (score <= 3) return { score, label: "Fair",   color: "#e8b84a" };
    return              { score, label: "Strong", color: "#50c878" };
  };

  const pwStrength = strength(newPassword);

  const validate = (): string | null => {
    if (!currentPassword.trim()) return "Current password is required.";
    if (!newPassword.trim())     return "New password is required.";
    if (newPassword.length < 8)  return "New password must be at least 8 characters.";
    if (newPassword === currentPassword) return "New password must be different from current password.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async () => {
    if (!token) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      await api.put("/user/password", token, {
        currentPassword,
        newPassword,
      });
      setSuccessMsg("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      // backend returns 401 for wrong current password
      if (e.message?.includes("401")) {
        setError("Current password is incorrect.");
      } else {
        setError(e.message || "Failed to change password.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cp-root { min-height: 100vh; background: #0a0a0a; color: #f0ede6; font-family: 'DM Sans', sans-serif; }
        .cp-body { max-width: 520px; margin: 0 auto; padding: 48px 40px; }

        .page-header { margin-bottom: 40px; }
        .page-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
        .page-sub { font-size: 14px; color: #555; }

        /* Card */
        .form-card {
          background: #111; border: 1px solid #1e1e1e;
          border-radius: 16px; padding: 32px 28px; margin-bottom: 16px;
        }
        .form-card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; margin-bottom: 24px; }

        /* Field */
        .field { margin-bottom: 20px; }
        .field label {
          display: block; font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase; color: #555; margin-bottom: 8px;
        }

        .input-wrap { position: relative; }

        .field input {
          width: 100%; background: #0a0a0a; border: 1px solid #222; border-radius: 8px;
          padding: 12px 44px 12px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #f0ede6; outline: none; transition: border-color 0.2s;
        }
        .field input:focus { border-color: #c9a84c; }
        .field input::placeholder { color: #2a2a2a; }
        .field input.error-input { border-color: rgba(220,80,80,0.5); }

        .show-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: transparent; border: none; color: #333; cursor: pointer;
          font-size: 13px; transition: color 0.15s; padding: 0; line-height: 1;
        }
        .show-toggle:hover { color: #888; }

        /* Strength bar */
        .strength-row {
          display: flex; align-items: center; gap: 8px; margin-top: 8px;
        }
        .strength-bars { display: flex; gap: 3px; }
        .strength-bar {
          width: 28px; height: 3px; border-radius: 2px; background: #1a1a1a;
          transition: background 0.2s;
        }
        .strength-label { font-size: 11px; margin-left: 2px; }

        /* Match indicator */
        .match-hint { margin-top: 6px; font-size: 11px; }
        .match-ok  { color: #50c878; }
        .match-err { color: #e06060; }

        /* Divider */
        .divider { height: 1px; background: #181818; margin: 4px 0 20px; }

        /* Actions */
        .form-actions { display: flex; align-items: center; gap: 12px; margin-top: 8px; }

        .btn-save {
          background: #c9a84c; color: #0a0a0a; border: none; border-radius: 8px;
          padding: 13px 28px; font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: opacity 0.15s;
        }
        .btn-save:hover { opacity: 0.88; }
        .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Messages */
        .error-banner {
          background: rgba(220,80,80,0.08); border: 1px solid rgba(220,80,80,0.2);
          border-radius: 10px; padding: 12px 16px; font-size: 13px;
          color: #e06060; margin-bottom: 20px;
        }
        .success-banner {
          background: rgba(80,200,120,0.08); border: 1px solid rgba(80,200,120,0.2);
          border-radius: 10px; padding: 14px 18px; font-size: 13px;
          color: #50c878; display: flex; align-items: center; gap: 10px;
          animation: fadeIn 0.2s;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        /* Tips card */
        .tips-card {
          background: #0d0d0d; border: 1px solid #161616;
          border-radius: 12px; padding: 18px 20px; font-size: 12px;
          color: #333; line-height: 1.8;
        }
        .tips-card strong { color: #555; font-weight: 500; display: block; margin-bottom: 6px; }
        .tips-card ul { padding-left: 16px; }
        .tips-card li { margin-bottom: 2px; }

        .loading-wrap { display: flex; align-items: center; justify-content: center; min-height: 400px; font-size: 14px; color: #444; }

        @media (max-width: 600px) { .cp-body { padding: 32px 20px; } }
      `}</style>

      <div className="cp-root">
        <NavBar />

        <div className="cp-body">
          <div className="page-header">
            <h1 className="page-title">Change password</h1>
            <p className="page-sub">Update your account password</p>
          </div>

          {error      && <div className="error-banner">{error}</div>}
          {successMsg && (
            <div className="success-banner">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {!successMsg && (
            <div className="form-card">
              <div className="form-card-title">Update password</div>

              {/* Current password */}
              <div className="field">
                <label>Current password</label>
                <div className="input-wrap">
                  <input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Your current password"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                  />
                  <button className="show-toggle" type="button" onClick={() => setShowCurrent(v => !v)}>
                    {showCurrent ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="divider" />

              {/* New password */}
              <div className="field">
                <label>New password</label>
                <div className="input-wrap">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  />
                  <button className="show-toggle" type="button" onClick={() => setShowNew(v => !v)}>
                    {showNew ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Strength indicator */}
                {newPassword && (
                  <div className="strength-row">
                    <div className="strength-bars">
                      {[1,2,3,4,5].map((n) => (
                        <div
                          key={n}
                          className="strength-bar"
                          style={{ background: n <= pwStrength.score ? pwStrength.color : "#1a1a1a" }}
                        />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: pwStrength.color }}>
                      {pwStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="field">
                <label>Confirm new password</label>
                <div className="input-wrap">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    className={
                      confirmPassword && newPassword !== confirmPassword ? "error-input" : ""
                    }
                  />
                  <button className="show-toggle" type="button" onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Match hint */}
                {confirmPassword && (
                  <div className={`match-hint ${newPassword === confirmPassword ? "match-ok" : "match-err"}`}>
                    {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  className="btn-save"
                  disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                  onClick={handleSubmit}
                >
                  {saving ? "Saving..." : "Change password"}
                </button>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="tips-card">
            <strong>Password tips</strong>
            <ul>
              <li>Use at least 8 characters</li>
              <li>Mix uppercase letters, numbers, and symbols</li>
              <li>Avoid reusing passwords from other sites</li>
              <li>You will stay logged in after changing your password</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
