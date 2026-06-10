"use client";

import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";
import { api }     from "../lib/api";
import { useEffect, useState } from "react";

type Tag = {
  id: number;
  name: string;
  color: string | null;
};

// Preset colour palette
const COLOR_PALETTE = [
  "#c9a84c", // gold
  "#4a90d9", // blue
  "#50c878", // green
  "#e06060", // red
  "#a06cd5", // purple
  "#e8884a", // orange
  "#4abfbf", // teal
  "#d4607a", // pink
  "#8db87a", // sage
  "#c4a87a", // tan
];

export default function TagsPage() {
  const { token, ready } = useAuth();

  const [tags, setTags]           = useState<Tag[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create form state
  const [newName, setNewName]     = useState("");
  const [newColor, setNewColor]   = useState(COLOR_PALETTE[0]);
  const [creating, setCreating]   = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId]     = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    api.get<Tag[]>("/tags", token)
      .then(setTags)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready, token]);

  if (!ready) return null;

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleCreate = async () => {
    if (!token || !newName.trim()) {
      setCreateError("Tag name is required.");
      return;
    }
    if (tags.some((t) => t.name.toLowerCase() === newName.trim().toLowerCase())) {
      setCreateError(`A tag named "${newName.trim()}" already exists.`);
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      const created = await api.post<Tag>("/tags", token, {
        name:  newName.trim().toLowerCase(),
        color: newColor,
      });
      setTags((prev) => [...prev, created]);
      setNewName("");
      setNewColor(COLOR_PALETTE[0]);
      flash(`Tag "${created.name}" created.`);
    } catch (e: any) {
      setCreateError(e.message || "Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await api.del(`/tags/${id}`, token);
      setTags((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
      flash("Tag removed.");
    } catch (e: any) {
      setError(e.message || "Failed to delete tag");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .tags-root { min-height: 100vh; background: #0a0a0a; color: #f0ede6; font-family: 'DM Sans', sans-serif; }
        .tags-body { max-width: 680px; margin: 0 auto; padding: 48px 40px; }

        .page-header { margin-bottom: 40px; }
        .page-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
        .page-sub { font-size: 14px; color: #555; }

        /* Error / success banners */
        .error-banner {
          background: rgba(220,80,80,0.08); border: 1px solid rgba(220,80,80,0.2);
          border-radius: 10px; padding: 12px 16px; font-size: 13px;
          color: #e06060; margin-bottom: 20px;
        }
        .success-banner {
          background: rgba(80,200,120,0.08); border: 1px solid rgba(80,200,120,0.2);
          border-radius: 10px; padding: 12px 16px; font-size: 13px;
          color: #50c878; margin-bottom: 20px; animation: fadeIn 0.2s;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        /* Create card */
        .create-card {
          background: #111; border: 1px solid #1e1e1e;
          border-radius: 16px; padding: 28px 24px; margin-bottom: 24px;
        }
        .create-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; margin-bottom: 20px; }

        /* Name input row */
        .name-row { display: flex; gap: 10px; align-items: flex-end; margin-bottom: 16px; }

        .field { flex: 1; }
        .field label {
          display: block; font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase; color: #555; margin-bottom: 7px;
        }
        .field input {
          width: 100%; background: #0a0a0a; border: 1px solid #222; border-radius: 8px;
          padding: 12px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #f0ede6; outline: none; transition: border-color 0.2s;
        }
        .field input:focus { border-color: #c9a84c; }
        .field input::placeholder { color: #2a2a2a; }

        .btn-create {
          background: #c9a84c; color: #0a0a0a; border: none; border-radius: 8px;
          padding: 12px 20px; font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer; transition: opacity 0.15s;
          white-space: nowrap; height: 46px;
        }
        .btn-create:hover { opacity: 0.88; }
        .btn-create:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Colour picker */
        .colour-section { }
        .colour-label {
          font-size: 11px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: #555; margin-bottom: 10px; display: block;
        }
        .colour-grid { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .colour-swatch {
          width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
          border: 2px solid transparent; transition: all 0.15s; flex-shrink: 0;
        }
        .colour-swatch:hover { transform: scale(1.15); }
        .colour-swatch.selected { border-color: #f0ede6; transform: scale(1.1); box-shadow: 0 0 0 2px rgba(240,237,230,0.2); }

        .colour-custom-wrap { position: relative; }
        .colour-custom {
          width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
          border: 2px solid #333; background: #1a1a1a; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; transition: border-color 0.15s;
        }
        .colour-custom:hover { border-color: #555; }
        .colour-custom input { opacity: 0; position: absolute; inset: 0; cursor: pointer; }

        /* Preview pill */
        .preview-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 500;
          margin-top: 14px; border: 1px solid rgba(255,255,255,0.1);
        }
        .preview-dot { width: 7px; height: 7px; border-radius: 50%; }

        .create-error { margin-top: 10px; font-size: 12px; color: #e06060; }

        /* Tags list */
        .list-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .list-title { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #444; }
        .list-count { font-size: 11px; color: #333; }

        .tags-grid { display: flex; flex-direction: column; gap: 8px; }

        .tag-row {
          display: flex; align-items: center; justify-content: space-between;
          background: #111; border: 1px solid #1e1e1e; border-radius: 10px;
          padding: 14px 16px; transition: border-color 0.15s;
        }
        .tag-row:hover { border-color: #2a2a2a; }

        .tag-left { display: flex; align-items: center; gap: 12px; }

        .tag-color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

        .tag-pill {
          display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px;
          border-radius: 100px; font-size: 12px; font-weight: 500;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
        }

        .tag-name { font-size: 14px; color: #f0ede6; font-weight: 500; }

        .tag-actions { display: flex; align-items: center; gap: 8px; }

        /* Confirm delete inline */
        .confirm-inline {
          display: flex; align-items: center; gap: 8px;
          animation: fadeIn 0.15s;
        }
        .confirm-text { font-size: 12px; color: #555; }
        .btn-confirm-delete {
          background: rgba(220,80,80,0.12); border: 1px solid rgba(220,80,80,0.3);
          border-radius: 6px; padding: 5px 12px; font-size: 12px;
          font-family: 'DM Sans', sans-serif; color: #e06060; cursor: pointer;
          transition: all 0.15s;
        }
        .btn-confirm-delete:hover { background: rgba(220,80,80,0.2); }
        .btn-confirm-delete:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-confirm-cancel {
          background: transparent; border: 1px solid #222; border-radius: 6px;
          padding: 5px 10px; font-size: 12px; font-family: 'DM Sans', sans-serif;
          color: #555; cursor: pointer; transition: all 0.15s;
        }
        .btn-confirm-cancel:hover { border-color: #444; color: #888; }

        .btn-delete-tag {
          background: transparent; border: 1px solid #1e1e1e; border-radius: 6px;
          padding: 5px 10px; font-size: 11px; font-family: 'DM Sans', sans-serif;
          color: #333; cursor: pointer; transition: all 0.15s; opacity: 0;
        }
        .tag-row:hover .btn-delete-tag { opacity: 1; }
        .btn-delete-tag:hover { border-color: #e06060; color: #e06060; }

        /* Empty state */
        .empty-state {
          background: #0d0d0d; border: 1px dashed #1e1e1e;
          border-radius: 14px; padding: 48px; text-align: center;
        }
        .empty-icon { font-size: 28px; margin-bottom: 10px; display: block; }
        .empty-text { font-size: 14px; color: #333; }

        /* Hint card */
        .hint-card {
          background: #0d0d0d; border: 1px solid #161616;
          border-radius: 12px; padding: 16px 18px; margin-top: 20px;
          font-size: 12px; color: #444; line-height: 1.7;
        }
        .hint-card strong { color: #666; font-weight: 500; }

        .loading-wrap { display: flex; align-items: center; justify-content: center; min-height: 400px; font-size: 14px; color: #444; }

        @media (max-width: 600px) {
          .tags-body { padding: 32px 20px; }
          .name-row { flex-direction: column; align-items: stretch; }
          .btn-create { height: auto; }
        }
      `}</style>

      <div className="tags-root">
        <NavBar />

        <div className="tags-body">
          {loading ? (
            <div className="loading-wrap">Loading tags...</div>
          ) : (
            <>
              <div className="page-header">
                <h1 className="page-title">Tags</h1>
                <p className="page-sub">Create tags to label your focus sessions and filter history</p>
              </div>

              {error    && <div className="error-banner">{error}</div>}
              {successMsg && <div className="success-banner">✓ {successMsg}</div>}

              {/* Create form */}
              <div className="create-card">
                <div className="create-title">New tag</div>

                <div className="name-row">
                  <div className="field">
                    <label>Tag name</label>
                    <input
                      placeholder="e.g. study, work, exercise"
                      value={newName}
                      maxLength={30}
                      onChange={(e) => { setNewName(e.target.value); setCreateError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                    />
                  </div>
                  <button
                    className="btn-create"
                    disabled={creating || !newName.trim()}
                    onClick={handleCreate}
                  >
                    {creating ? "Adding..." : "+ Add tag"}
                  </button>
                </div>

                {/* Colour picker */}
                <span className="colour-label">Colour</span>
                <div className="colour-grid">
                  {COLOR_PALETTE.map((c) => (
                    <div
                      key={c}
                      className={`colour-swatch ${newColor === c ? "selected" : ""}`}
                      style={{ background: c }}
                      onClick={() => setNewColor(c)}
                      title={c}
                    />
                  ))}
                  {/* Custom colour picker */}
                  <div className="colour-custom-wrap">
                    <div className="colour-custom" style={{ background: newColor }} title="Custom colour">
                      ＋
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Live preview */}
                {newName.trim() && (
                  <div
                    className="preview-pill"
                    style={{ borderColor: newColor + "44", background: newColor + "14" }}
                  >
                    <span className="preview-dot" style={{ background: newColor }} />
                    <span style={{ color: newColor }}>{newName.trim().toLowerCase()}</span>
                  </div>
                )}

                {createError && <div className="create-error">{createError}</div>}
              </div>

              {/* Tags list */}
              <div className="list-header">
                <span className="list-title">Your tags</span>
                <span className="list-count">{tags.length} tag{tags.length !== 1 ? "s" : ""}</span>
              </div>

              {tags.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🏷️</span>
                  <div className="empty-text">No tags yet. Create one above to start labelling sessions.</div>
                </div>
              ) : (
                <div className="tags-grid">
                  {tags.map((t) => (
                    <div key={t.id} className="tag-row">
                      <div className="tag-left">
                        <div
                          className="tag-pill"
                          style={{
                            borderColor: (t.color ?? "#888") + "44",
                            background:  (t.color ?? "#888") + "14",
                          }}
                        >
                          <span className="tag-color-dot" style={{ background: t.color ?? "#888" }} />
                          <span style={{ color: t.color ?? "#888" }}>{t.name}</span>
                        </div>
                      </div>

                      <div className="tag-actions">
                        {confirmDeleteId === t.id ? (
                          <div className="confirm-inline">
                            <span className="confirm-text">Remove?</span>
                            <button
                              className="btn-confirm-delete"
                              disabled={deletingId === t.id}
                              onClick={() => handleDelete(t.id)}
                            >
                              {deletingId === t.id ? "..." : "Remove"}
                            </button>
                            <button
                              className="btn-confirm-cancel"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-delete-tag"
                            onClick={() => setConfirmDeleteId(t.id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="hint-card">
                <strong>How tags work:</strong> Start a focus session with a tag using the
                tag input on the dashboard. Use the filter pills in the session history sidebar
                to view only sessions with a specific tag. Deleting a tag removes it from the
                tags list but does not delete sessions that used it.
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
