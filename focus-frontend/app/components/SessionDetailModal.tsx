"use client";

import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";
import { api }     from "../lib/api";
import { useEffect, useState } from "react";

type SessionDetail = {
  id: number;
  startTime: string;
  endTime: string;
  duration: number;
  note?: string;
  tag?: { id: number; name: string; color: string | null };
};

type SessionDetailModalProps = {
  sessionId: number;
  onClose: () => void;
  onNoteUpdated?: (id: number, note: string | undefined) => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Standalone modal — import this into any page that lists sessions
//
// Usage:
//   const [openId, setOpenId] = useState<number | null>(null);
//
//   // In JSX, trigger on any history row click:
//   <div onClick={() => setOpenId(h.id)}>...</div>
//
//   // Then render the modal:
//   {openId !== null && (
//     <SessionDetailModal
//       sessionId={openId}
//       onClose={() => setOpenId(null)}
//       onNoteUpdated={(id, note) => {
//         // update local history in place
//         setHistory(prev => prev.map(h => h.id === id ? { ...h, note } : h));
//       }}
//     />
//   )}
// ─────────────────────────────────────────────────────────────────────────────
export function SessionDetailModal({
  sessionId,
  onClose,
  onNoteUpdated,
}: SessionDetailModalProps) {
  const { token } = useAuth();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Note editing
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft]     = useState("");
  const [noteSaving, setNoteSaving]   = useState(false);
  const [noteError, setNoteError]     = useState("");

  useEffect(() => {
    if (!token) return;
    api.get<SessionDetail>(`/focus/${sessionId}`, token)
      .then((s) => {
        setSession(s);
        setNoteDraft(s.note ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId, token]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const saveNote = async () => {
    if (!token || !session) return;
    setNoteSaving(true);
    setNoteError("");
    try {
      if (noteDraft.trim() === "") {
        await api.del(`/focus/${session.id}/note`, token);
        const updated = { ...session, note: undefined };
        setSession(updated);
        onNoteUpdated?.(session.id, undefined);
      } else {
        await api.put(`/focus/${session.id}/note`, token, { note: noteDraft.trim() });
        const updated = { ...session, note: noteDraft.trim() };
        setSession(updated);
        onNoteUpdated?.(session.id, noteDraft.trim());
      }
      setEditingNote(false);
    } catch (e: any) {
      setNoteError(e.message || "Failed to save note");
    } finally {
      setNoteSaving(false);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit",
    });

  const fmtHours = (m: number) => {
    if (m === 0) return "0m";
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  };

  return (
    <>
      <style>{\`
        .sd-backdrop {
          position: fixed; inset: 0; z-index: 500;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: sdFadeIn 0.15s ease;
        }
        @keyframes sdFadeIn { from { opacity:0 } to { opacity:1 } }

        .sd-modal {
          background: #111;
          border: 1px solid #222;
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          animation: sdSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1);
          position: relative;
        }
        @keyframes sdSlideUp { from { opacity:0; transform:translateY(16px) scale(0.97) } to { opacity:1; transform:none } }

        .sd-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 24px 0;
          margin-bottom: 20px;
        }

        .sd-header-left { display: flex; flex-direction: column; gap: 3px; }

        .sd-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 800; color: #f0ede6;
        }

        .sd-date { font-size: 13px; color: #555; }

        .sd-close {
          background: #1a1a1a; border: 1px solid #2a2a2a;
          border-radius: 8px; width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #555; cursor: pointer;
          transition: all 0.15s; flex-shrink: 0;
        }
        .sd-close:hover { border-color: #444; color: #f0ede6; }

        /* Stat strip */
        .sd-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: #1a1a1a;
          margin: 0 24px 20px;
          border-radius: 12px; overflow: hidden;
        }

        .sd-stat {
          background: #141414;
          padding: 14px 16px;
          display: flex; flex-direction: column; gap: 3px;
        }

        .sd-stat-label {
          font-size: 9px; letter-spacing: 0.14em;
          text-transform: uppercase; color: #444;
        }

        .sd-stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 18px; font-weight: 800; color: #f0ede6; line-height: 1;
        }

        .sd-stat-sub { font-size: 10px; color: #444; }

        /* Tag pill */
        .sd-tag-row { padding: 0 24px 16px; }
        .sd-tag-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #444; margin-bottom: 8px; }
        .sd-tag-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px;
          font-size: 12px; font-weight: 500;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }
        .sd-tag-dot { width: 7px; height: 7px; border-radius: 50%; }
        .sd-no-tag { font-size: 12px; color: #333; font-style: italic; }

        /* Divider */
        .sd-divider { height: 1px; background: #1a1a1a; margin: 0 24px 20px; }

        /* Note section */
        .sd-note-section { padding: 0 24px 24px; }
        .sd-note-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
        }
        .sd-note-title { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #444; }

        .sd-note-btn {
          background: transparent; border: 1px solid #222; border-radius: 6px;
          padding: 4px 10px; font-size: 11px; font-family: 'DM Sans', sans-serif;
          color: #555; cursor: pointer; transition: all 0.15s;
        }
        .sd-note-btn:hover { border-color: #c9a84c; color: #c9a84c; }

        .sd-note-text {
          font-size: 13px; color: #888; line-height: 1.7;
          background: #0d0d0d; border: 1px solid #181818;
          border-radius: 10px; padding: 14px 16px;
        }

        .sd-note-empty { font-size: 13px; color: #333; font-style: italic; }

        .sd-note-textarea {
          width: 100%; background: #0a0a0a; border: 1px solid #c9a84c;
          border-radius: 8px; padding: 12px 14px; font-size: 13px;
          font-family: 'DM Sans', sans-serif; color: #f0ede6;
          outline: none; resize: none; line-height: 1.6; min-height: 80px;
        }

        .sd-note-actions {
          display: flex; gap: 8px; margin-top: 8px; align-items: center;
        }

        .sd-note-char { font-size: 10px; color: #333; margin-left: auto; font-family: 'DM Mono', monospace; }

        .btn-sd-save {
          background: #c9a84c; color: #0a0a0a; border: none; border-radius: 6px;
          padding: 8px 16px; font-size: 12px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: opacity 0.15s;
        }
        .btn-sd-save:hover { opacity: 0.88; }
        .btn-sd-save:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-sd-cancel {
          background: transparent; border: 1px solid #222; border-radius: 6px;
          padding: 8px 12px; font-size: 12px; font-family: 'DM Sans', sans-serif;
          color: #555; cursor: pointer; transition: all 0.15s;
        }
        .btn-sd-cancel:hover { border-color: #444; color: #888; }

        .sd-note-error { font-size: 11px; color: #e06060; margin-top: 6px; }

        /* States */
        .sd-loading { padding: 60px 24px; text-align: center; color: #444; font-size: 14px; }
        .sd-error { padding: 40px 24px; text-align: center; color: #e06060; font-size: 13px; }

        @media (max-width: 600px) {
          .sd-backdrop { padding: 0; align-items: flex-end; }
          .sd-modal { border-radius: 20px 20px 0 0; max-height: 85vh; }
        }
      \`}</style>

      <div className="sd-backdrop" onClick={handleBackdrop}>
        <div className="sd-modal" role="dialog" aria-modal="true">

          {loading && <div className="sd-loading">Loading session...</div>}
          {error   && <div className="sd-error">Failed to load: {error}</div>}

          {session && !loading && (
            <>
              {/* Header */}
              <div className="sd-header">
                <div className="sd-header-left">
                  <span className="sd-title">Session #{session.id}</span>
                  <span className="sd-date">{fmtDate(session.startTime)}</span>
                </div>
                <button className="sd-close" onClick={onClose} aria-label="Close">×</button>
              </div>

              {/* Stat strip */}
              <div className="sd-stats">
                <div className="sd-stat">
                  <span className="sd-stat-label">Duration</span>
                  <span className="sd-stat-value" style={{ color: "#c9a84c" }}>
                    {fmtHours(session.duration)}
                  </span>
                  <span className="sd-stat-sub">{session.duration} min</span>
                </div>
                <div className="sd-stat">
                  <span className="sd-stat-label">Started</span>
                  <span className="sd-stat-value" style={{ fontSize: 14 }}>
                    {fmtTime(session.startTime)}
                  </span>
                  <span className="sd-stat-sub">start time</span>
                </div>
                <div className="sd-stat">
                  <span className="sd-stat-label">Ended</span>
                  <span className="sd-stat-value" style={{ fontSize: 14 }}>
                    {session.endTime ? fmtTime(session.endTime) : "—"}
                  </span>
                  <span className="sd-stat-sub">end time</span>
                </div>
              </div>

              {/* Tag */}
              <div className="sd-tag-row">
                <div className="sd-tag-label">Tag</div>
                {session.tag ? (
                  <div
                    className="sd-tag-pill"
                    style={{
                      borderColor: (session.tag.color ?? "#888") + "44",
                      background:  (session.tag.color ?? "#888") + "14",
                    }}
                  >
                    <span
                      className="sd-tag-dot"
                      style={{ background: session.tag.color ?? "#888" }}
                    />
                    <span style={{ color: session.tag.color ?? "#888" }}>
                      {session.tag.name}
                    </span>
                  </div>
                ) : (
                  <span className="sd-no-tag">No tag</span>
                )}
              </div>

              <div className="sd-divider" />

              {/* Note */}
              <div className="sd-note-section">
                <div className="sd-note-header">
                  <span className="sd-note-title">Session note</span>
                  {!editingNote && (
                    <button
                      className="sd-note-btn"
                      onClick={() => setEditingNote(true)}
                    >
                      {session.note ? "Edit" : "+ Add note"}
                    </button>
                  )}
                </div>

                {editingNote ? (
                  <>
                    <textarea
                      className="sd-note-textarea"
                      value={noteDraft}
                      maxLength={500}
                      autoFocus
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="What did you work on? (leave empty to delete)"
                    />
                    <div className="sd-note-actions">
                      <button
                        className="btn-sd-save"
                        disabled={noteSaving}
                        onClick={saveNote}
                      >
                        {noteSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="btn-sd-cancel"
                        onClick={() => {
                          setEditingNote(false);
                          setNoteDraft(session.note ?? "");
                          setNoteError("");
                        }}
                      >
                        Cancel
                      </button>
                      <span className="sd-note-char">
                        {noteDraft.length}/500
                        {noteDraft.trim() === "" && session.note ? " · will delete" : ""}
                      </span>
                    </div>
                    {noteError && <div className="sd-note-error">{noteError}</div>}
                  </>
                ) : session.note ? (
                  <div className="sd-note-text">{session.note}</div>
                ) : (
                  <span className="sd-note-empty">No note for this session.</span>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Standalone page at /Sessions/[id] — optional, for direct deep-links
// ─────────────────────────────────────────────────────────────────────────────
export default function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { token, ready } = useAuth();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft]     = useState("");
  const [noteSaving, setNoteSaving]   = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    api.get<SessionDetail>(`/focus/${params.id}`, token)
      .then((s) => { setSession(s); setNoteDraft(s.note ?? ""); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready, token, params.id]);

  if (!ready) return null;

  const saveNote = async () => {
    if (!token || !session) return;
    setNoteSaving(true);
    try {
      if (noteDraft.trim() === "") {
        await api.del(`/focus/${session.id}/note`, token);
        setSession({ ...session, note: undefined });
      } else {
        await api.put(`/focus/${session.id}/note`, token, { note: noteDraft.trim() });
        setSession({ ...session, note: noteDraft.trim() });
      }
      setEditingNote(false);
    } catch (e) { console.error(e); }
    finally { setNoteSaving(false); }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const fmtHours = (m: number) => {
    if (m === 0) return "0m";
    const h = Math.floor(m / 60); const min = m % 60;
    if (h === 0) return `${min}m`; if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  };

  return (
    <>
      <style>{\`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sp-root { min-height: 100vh; background: #0a0a0a; color: #f0ede6; font-family: 'DM Sans', sans-serif; }
        .sp-body { max-width: 640px; margin: 0 auto; padding: 48px 40px; }
        .sp-back { background: transparent; border: 1px solid #222; border-radius: 6px; padding: 8px 14px; font-size: 12px; font-family: 'DM Sans', sans-serif; color: #555; cursor: pointer; transition: all 0.15s; margin-bottom: 32px; display: inline-block; }
        .sp-back:hover { border-color: #444; color: #888; }
        .sp-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; margin-bottom: 4px; }
        .sp-date { font-size: 14px; color: #555; margin-bottom: 32px; }
        .sp-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 24px; }
        .sp-stat { background: #111; border: 1px solid #1e1e1e; border-radius: 12px; padding: 18px 16px; }
        .sp-stat-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #444; margin-bottom: 6px; }
        .sp-stat-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #f0ede6; line-height: 1; }
        .sp-tag-card { background: #111; border: 1px solid #1e1e1e; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; }
        .sp-section-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #444; margin-bottom: 10px; }
        .sp-tag-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 500; border: 1px solid rgba(255,255,255,0.08); }
        .sp-tag-dot { width: 7px; height: 7px; border-radius: 50%; }
        .sp-note-card { background: #111; border: 1px solid #1e1e1e; border-radius: 12px; padding: 20px; }
        .sp-note-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .sp-note-text { font-size: 14px; color: #888; line-height: 1.7; }
        .sp-note-empty { font-size: 13px; color: #333; font-style: italic; }
        .sp-textarea { width: 100%; background: #0a0a0a; border: 1px solid #c9a84c; border-radius: 8px; padding: 12px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #f0ede6; outline: none; resize: none; line-height: 1.6; min-height: 100px; }
        .sp-actions { display: flex; gap: 8px; margin-top: 10px; }
        .sp-btn-save { background: #c9a84c; color: #0a0a0a; border: none; border-radius: 6px; padding: 9px 18px; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; }
        .sp-btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
        .sp-btn-cancel { background: transparent; border: 1px solid #222; border-radius: 6px; padding: 9px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #555; cursor: pointer; }
        .sp-btn-edit { background: transparent; border: 1px solid #222; border-radius: 6px; padding: 5px 12px; font-size: 11px; font-family: 'DM Sans', sans-serif; color: #555; cursor: pointer; transition: all 0.15s; }
        .sp-btn-edit:hover { border-color: #c9a84c; color: #c9a84c; }
        .sp-loading { padding: 80px 40px; text-align: center; color: #444; font-size: 14px; }
        .sp-error { padding: 80px 40px; text-align: center; color: #e06060; font-size: 14px; }
        @media (max-width: 600px) { .sp-body { padding: 32px 20px; } .sp-stats { grid-template-columns: 1fr 1fr; } }
      \`}</style>

      <div className="sp-root">
        <NavBar />
        <div className="sp-body">
          {loading && <div className="sp-loading">Loading session...</div>}
          {error   && <div className="sp-error">Failed to load: {error}</div>}

          {session && !loading && (
            <>
              <button className="sp-back" onClick={() => window.history.back()}>← Back</button>

              <div className="sp-title">Session #{session.id}</div>
              <div className="sp-date">{fmtDate(session.startTime)}</div>

              <div className="sp-stats">
                <div className="sp-stat">
                  <div className="sp-stat-label">Duration</div>
                  <div className="sp-stat-value" style={{ color: "#c9a84c" }}>{fmtHours(session.duration)}</div>
                </div>
                <div className="sp-stat">
                  <div className="sp-stat-label">Started</div>
                  <div className="sp-stat-value" style={{ fontSize: 16 }}>{fmtTime(session.startTime)}</div>
                </div>
                <div className="sp-stat">
                  <div className="sp-stat-label">Ended</div>
                  <div className="sp-stat-value" style={{ fontSize: 16 }}>{session.endTime ? fmtTime(session.endTime) : "—"}</div>
                </div>
              </div>

              <div className="sp-tag-card">
                <div className="sp-section-label">Tag</div>
                {session.tag ? (
                  <div className="sp-tag-pill" style={{ borderColor: (session.tag.color ?? "#888") + "44", background: (session.tag.color ?? "#888") + "14" }}>
                    <span className="sp-tag-dot" style={{ background: session.tag.color ?? "#888" }} />
                    <span style={{ color: session.tag.color ?? "#888" }}>{session.tag.name}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: "#333", fontStyle: "italic" }}>No tag</span>
                )}
              </div>

              <div className="sp-note-card">
                <div className="sp-note-header">
                  <span className="sp-section-label">Session note</span>
                  {!editingNote && (
                    <button className="sp-btn-edit" onClick={() => setEditingNote(true)}>
                      {session.note ? "Edit" : "+ Add note"}
                    </button>
                  )}
                </div>
                {editingNote ? (
                  <>
                    <textarea
                      className="sp-textarea"
                      value={noteDraft}
                      maxLength={500}
                      autoFocus
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="What did you work on?"
                    />
                    <div className="sp-actions">
                      <button className="sp-btn-save" disabled={noteSaving} onClick={saveNote}>
                        {noteSaving ? "Saving..." : "Save"}
                      </button>
                      <button className="sp-btn-cancel" onClick={() => { setEditingNote(false); setNoteDraft(session.note ?? ""); }}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : session.note ? (
                  <div className="sp-note-text">{session.note}</div>
                ) : (
                  <span className="sp-note-empty">No note for this session.</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
