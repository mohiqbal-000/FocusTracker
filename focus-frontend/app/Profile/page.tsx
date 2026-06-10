"use client";

import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";
import { api }     from "../lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  id: number;
  email: string;
  displayName: string | null;
  timezone: string;
  avatarUrl: string | null;
  timezoneOffset: string;
};

// Common IANA timezones for the picker
const TIMEZONES = [
  { label: "UTC",                  value: "UTC" },
  { label: "India (IST)",          value: "Asia/Kolkata" },
  { label: "Dubai (GST)",          value: "Asia/Dubai" },
  { label: "Singapore (SGT)",      value: "Asia/Singapore" },
  { label: "London (GMT/BST)",     value: "Europe/London" },
  { label: "Paris (CET/CEST)",     value: "Europe/Paris" },
  { label: "New York (ET)",        value: "America/New_York" },
  { label: "Chicago (CT)",         value: "America/Chicago" },
  { label: "Denver (MT)",          value: "America/Denver" },
  { label: "Los Angeles (PT)",     value: "America/Los_Angeles" },
  { label: "São Paulo (BRT)",      value: "America/Sao_Paulo" },
  { label: "Tokyo (JST)",          value: "Asia/Tokyo" },
  { label: "Sydney (AEST/AEDT)",   value: "Australia/Sydney" },
];

export default function ProfilePage() {
  const router = useRouter();

  const { token, ready } = useAuth();

  const [profile, setProfile]       = useState<Profile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form fields — seeded from profile on load
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone]       = useState("UTC");
  const [avatarUrl, setAvatarUrl]     = useState("");

  // Track whether any field has changed
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    api.get<Profile>("/user/profile", token)
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName ?? "");
        setTimezone(p.timezone ?? "UTC");
        setAvatarUrl(p.avatarUrl ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready, token]);

  if (!ready) return null;

  const handleSave = async () => {
    if (!token || !dirty) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const updated = await api.put<Profile>("/user/profile", token, {
        displayName: displayName.trim() || null,
        timezone,
        avatarUrl: avatarUrl.trim() || null,
      });
      setProfile(updated);
      setDirty(false);
      setSuccessMsg("Profile saved.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const onChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setDirty(true);
    setSuccessMsg("");
  };

  const initials = (profile?.displayName || profile?.email || "?")
    .slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .prof-root { min-height: 100vh; background: #0a0a0a; color: #f0ede6; font-family: 'DM Sans', sans-serif; }
        .prof-body { max-width: 680px; margin: 0 auto; padding: 48px 40px; }

        .page-header { margin-bottom: 40px; }
        .page-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
        .page-sub { font-size: 14px; color: #555; }

        /* Avatar row */
        .avatar-row {
          display: flex;
          align-items: center;
          gap: 20px;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .avatar-circle {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: #1e1e1e;
          border: 2px solid #2a2a2a;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #c9a84c;
          flex-shrink: 0;
          overflow: hidden;
        }

        .avatar-circle img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        .avatar-info { flex: 1; }
        .avatar-name { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 3px; }
        .avatar-email { font-size: 13px; color: #555; }
        .avatar-offset { font-size: 11px; color: #333; margin-top: 4px; font-family: 'DM Mono', monospace; }

        /* Form card */
        .form-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 28px 24px;
          margin-bottom: 20px;
        }

        .form-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #f0ede6;
        }

        .field { margin-bottom: 18px; }
        .field:last-child { margin-bottom: 0; }

        .field label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 8px;
        }

        .field input, .field select {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #222;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #f0ede6;
          outline: none;
          transition: border-color 0.2s;
          appearance: none;
        }

        .field input:focus, .field select:focus { border-color: #c9a84c; }
        .field input::placeholder { color: #2a2a2a; }
        .field select option { background: #1a1a1a; }

        .field-hint { margin-top: 6px; font-size: 11px; color: #333; }

        /* Read-only field */
        .field-readonly {
          width: 100%;
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          color: #444;
          cursor: not-allowed;
        }

        /* Actions */
        .form-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-save {
          background: #c9a84c;
          color: #0a0a0a;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-save:hover { opacity: 0.88; }
        .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-cancel {
          background: transparent;
          border: 1px solid #222;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #555;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-cancel:hover { border-color: #444; color: #888; }

        /* Messages */
        .success-msg {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #4ade80;
          margin-left: 4px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .error-banner {
          background: rgba(220,80,80,0.08);
          border: 1px solid rgba(220,80,80,0.2);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          color: #e06060;
          margin-bottom: 20px;
        }

        /* Timezone info card */
        .tz-info {
          background: #0d0d0d;
          border: 1px solid #181818;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
          font-size: 12px;
          color: #444;
          line-height: 1.6;
        }

        .tz-info strong { color: #c9a84c; font-weight: 500; }

        /* Loading */
        .loading-wrap { display: flex; align-items: center; justify-content: center; min-height: 400px; font-size: 14px; color: #444; }

        @media (max-width: 600px) {
          .prof-body { padding: 32px 20px; }
          .avatar-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="prof-root">
        <NavBar />

        <div className="prof-body">
          {loading ? (
            <div className="loading-wrap">Loading profile...</div>
          ) : (
            <>
              <div className="page-header">
                <h1 className="page-title">Profile</h1>
                <p className="page-sub">Manage your display name, timezone, and avatar</p>
              </div>

              {error && <div className="error-banner">{error}</div>}

              {/* Avatar / identity row */}
              {profile && (
                <div className="avatar-row">
                  <div className="avatar-circle">
                    {avatarUrl.trim() ? (
                      <img src={avatarUrl} alt="avatar" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="avatar-info">
                    <div className="avatar-name">{displayName || profile.email}</div>
                    <div className="avatar-email">{profile.email}</div>
                    <div className="avatar-offset">{profile.timezoneOffset} · {timezone}</div>
                  </div>
                </div>
              )}

              {/* Profile form */}
              <div className="form-card">
                <div className="form-card-title">Edit profile</div>

                <div className="field">
                  <label>Email</label>
                  <div className="field-readonly">{profile?.email}</div>
                  <p className="field-hint">Email cannot be changed.</p>
                </div>

                <div className="field">
                  <label>Display name</label>
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="How you want to be called"
                    value={displayName}
                    onChange={onChange(setDisplayName)}
                  />
                </div>

                <div className="field">
                  <label>Timezone</label>
                  <select value={timezone} onChange={onChange(setTimezone)}>
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <p className="field-hint">
                    Used to calculate your daily stats and streak correctly.
                  </p>
                </div>

                <div className="field">
                  <label>Avatar URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.png"
                    value={avatarUrl}
                    onChange={onChange(setAvatarUrl)}
                  />
                  <p className="field-hint">Paste a public image URL. Leave empty to use initials.</p>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-save"
                    disabled={saving || !dirty}
                    onClick={handleSave}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>

                  {dirty && (
                    <button
                      className="btn-cancel"
                      onClick={() => {
                        if (!profile) return;
                        setDisplayName(profile.displayName ?? "");
                        setTimezone(profile.timezone ?? "UTC");
                        setAvatarUrl(profile.avatarUrl ?? "");
                        setDirty(false);
                        setError("");
                      }}
                    >
                      Discard
                    </button>
                  )}

                  {successMsg && (
                    <span className="success-msg">✓ {successMsg}</span>
                  )}
                </div>
              </div>

              {/* Timezone explanation */}
              <div className="tz-info">
                <strong>Why timezone matters:</strong> Your daily stats, streak, and best-hours
                heatmap all use your local date. Without the correct timezone, a session at
                11 PM may count toward the wrong day, breaking your streak.
              </div>
              <div
  style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:12,
           padding:"16px 20px", cursor:"pointer", marginTop:12 }}
  onClick={() => router.push("/Profile/daily-goal")}
>
  <div style={{ fontSize:14, color:"#888" }}>
    🎯 Daily goal settings
    <span style={{ float:"right", color:"#333" }}>→</span>
  </div>
  <div style={{ fontSize:12, color:"#333", marginTop:4 }}>
    Set a daily focus target for the dashboard progress bar
  </div>
</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
