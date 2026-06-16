"use client";

import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";
import { api }     from "../lib/api";
import { useEffect, useRef, useState } from "react";

type GoalResponse = {
  id: number;
  goalType: string;
  targetValue: number;
  progressValue: number;
  achieved: boolean;
};

const recommendedGoals = [
  { goalType: "Study", targetValue: 120, icon: "📖" },
  { goalType: "Coding Practice", targetValue: 90, icon: "💻" },
  { goalType: "Exercise", targetValue: 45, icon: "🏃" },
  { goalType: "Reading", targetValue: 60, icon: "📚" },
  { goalType: "Writing", targetValue: 30, icon: "✍️" },
];

export default function GoalsPage() {
  const { token, ready } = useAuth();

  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [goalType, setGoalType] = useState("");
  const [targetValue, setTargetValue] = useState(60);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Goal achieved toast ───────────────────────────────────────────────────
  const [toastGoal, setToastGoal] = useState<GoalResponse | null>(null);
  // Tracks each goal's achieved state from the previous fetch so we can
  // detect false -> true transitions (newly achieved) without re-toasting
  // goals that were already achieved before this page loaded.
  const prevAchievedRef = useRef<Map<number, boolean>>(new Map());
  const firstLoadRef = useRef(true);

  // ── Fetch goals ────────────────────────────────────────────────────────────
  const loadGoals = async () => {
    if (!token) return;
    setFetchLoading(true);
    try {
      const data = await api.get<GoalResponse[]>("/Goals", token);

      // Detect newly-achieved goals (skip toast on the very first load)
      if (!firstLoadRef.current) {
        for (const g of data) {
          const wasAchieved = prevAchievedRef.current.get(g.id) ?? false;
          if (!wasAchieved && g.achieved) {
            setToastGoal(g);
            setTimeout(() => setToastGoal(null), 5000);
            break; // show one toast at a time
          }
        }
      }

      // Update the tracking map for next comparison
      const map = new Map<number, boolean>();
      for (const g of data) map.set(g.id, g.achieved);
      prevAchievedRef.current = map;
      firstLoadRef.current = false;

      setGoals(data);
    } catch (e: any) {
      setError(`Failed to load goals: ${e.message}`);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !token) return;
    loadGoals();
  }, [ready, token]);

  if (!ready) return null;

  // ── Create goal ────────────────────────────────────────────────────────────
  const createGoal = async (goal: { goalType: string; targetValue: number }) => {
    if (!token) return;
    if (!goal.goalType.trim()) { setError("Goal type is required"); return; }

    setLoading(true);
    setError("");

    const today    = new Date().toISOString().slice(0, 10);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);

    try {
      const newGoal = await api.post<GoalResponse>("/Goals", token, {
        goalType:    goal.goalType.trim(),
        targetValue: goal.targetValue,
        startDate:   today,
        endDate:     nextWeek,
      });

      setGoals((prev) => [...prev, newGoal]);
      prevAchievedRef.current.set(newGoal.id, newGoal.achieved);
      setGoalType("");
      setTargetValue(60);
    } catch (e: any) {
      setError(e.message || "Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  const active   = goals.filter((g) => !g.achieved);
  const achieved = goals.filter((g) => g.achieved);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .goals-root { min-height: 100vh; background: #0a0a0a; color: #f0ede6; font-family: 'DM Sans', sans-serif; }

        .goals-body {
          max-width: 1100px; margin: 0 auto; padding: 48px 40px;
          display: grid; grid-template-columns: 380px 1fr; gap: 40px;
        }

        .section-label {
          font-size: 11px; font-weight: 600; letter-spacing: 0.18em;
          text-transform: uppercase; color: #555; margin-bottom: 16px;
        }

        /* Create form */
        .create-card { background: #111; border: 1px solid #1e1e1e; border-radius: 16px; padding: 28px 24px; margin-bottom: 24px; }
        .create-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 20px; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #555; margin-bottom: 7px; }
        .field input {
          width: 100%; background: #0a0a0a; border: 1px solid #222; border-radius: 8px;
          padding: 12px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #f0ede6; outline: none; transition: border-color 0.2s;
        }
        .field input:focus { border-color: #c9a84c; }
        .field input::placeholder { color: #333; }
        .btn-create {
          width: 100%; background: #c9a84c; color: #0a0a0a; border: none; border-radius: 8px;
          padding: 13px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: opacity 0.2s; margin-top: 4px;
        }
        .btn-create:hover { opacity: 0.9; }
        .btn-create:disabled { opacity: 0.5; cursor: not-allowed; }

        .error-msg {
          margin-top: 12px; padding: 10px 12px; background: rgba(220,80,80,0.08);
          border: 1px solid rgba(220,80,80,0.2); border-radius: 6px; font-size: 12px; color: #e06060;
        }

        /* Recommended */
        .rec-card { background: #111; border: 1px solid #1e1e1e; border-radius: 16px; padding: 24px; }
        .rec-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #181818; }
        .rec-item:last-child { border-bottom: none; }
        .rec-left { display: flex; align-items: center; gap: 12px; }
        .rec-icon { width: 36px; height: 36px; background: #1a1a1a; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .rec-name { font-size: 14px; font-weight: 500; }
        .rec-dur { font-size: 11px; color: #555; margin-top: 1px; }
        .btn-add-rec {
          background: transparent; border: 1px solid #2a2a2a; border-radius: 6px;
          padding: 6px 14px; font-size: 12px; font-family: 'DM Sans', sans-serif;
          color: #888; cursor: pointer; transition: all 0.15s;
        }
        .btn-add-rec:hover { border-color: #c9a84c; color: #c9a84c; }
        .btn-add-rec:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Goal cards */
        .goals-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
        .goal-card { background: #111; border: 1px solid #1e1e1e; border-radius: 14px; padding: 20px; transition: border-color 0.15s; }
        .goal-card:hover { border-color: #2a2a2a; }
        .goal-card.achieved-card { border-color: rgba(80,200,120,0.2); }
        .goal-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
        .goal-type { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; }
        .badge { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; }
        .badge.active-badge { background: rgba(201,168,76,0.12); color: #c9a84c; border: 1px solid rgba(201,168,76,0.25); }
        .badge.done-badge { background: rgba(80,200,120,0.12); color: #50c878; border: 1px solid rgba(80,200,120,0.25); }
        .goal-nums { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
        .goal-progress-text { font-size: 13px; color: #888; }
        .goal-pct-text { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #c9a84c; }
        .goal-card.achieved-card .goal-pct-text { color: #50c878; }
        .progress-bar-bg { height: 4px; background: #1a1a1a; border-radius: 2px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; background: #c9a84c; }
        .progress-bar-fill.done { background: #50c878; }

        .empty-section { background: #111; border: 1px solid #1e1e1e; border-radius: 14px; padding: 40px; text-align: center; color: #333; font-size: 14px; }
        .loading-state { padding: 40px; text-align: center; color: #444; font-size: 14px; }

        /* ── Goal achieved toast ── */
        .goal-toast {
          position: fixed;
          top: 80px;
          right: 24px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 14px;
          background: #141414;
          border: 1px solid rgba(80,200,120,0.3);
          border-radius: 14px;
          padding: 16px 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(80,200,120,0.05);
          animation: toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), toastFadeOut 0.3s ease 4.7s forwards;
          max-width: 340px;
        }

        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes toastFadeOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(40px); }
        }

        .toast-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: rgba(80,200,120,0.12);
          border: 1px solid rgba(80,200,120,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .toast-body { flex: 1; }
        .toast-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #50c878;
          margin-bottom: 2px;
        }
        .toast-sub { font-size: 12px; color: #888; }
        .toast-sub strong { color: #f0ede6; font-weight: 500; }

        .toast-close {
          background: transparent;
          border: none;
          color: #333;
          font-size: 16px;
          cursor: pointer;
          line-height: 1;
          padding: 2px;
          transition: color 0.15s;
          flex-shrink: 0;
        }
        .toast-close:hover { color: #888; }

        @media (max-width: 900px) {
          .goals-body { grid-template-columns: 1fr; padding: 32px 24px; }
          .goal-toast { left: 16px; right: 16px; max-width: none; top: 70px; }
        }
      `}</style>

      <div className="goals-root">
        <NavBar />

        {/* ── Goal achieved toast ── */}
        {toastGoal && (
          <div className="goal-toast">
            <div className="toast-icon">🎉</div>
            <div className="toast-body">
              <div className="toast-title">Goal achieved!</div>
              <div className="toast-sub">
                <strong>{toastGoal.goalType}</strong> — {toastGoal.progressValue} / {toastGoal.targetValue} min
              </div>
            </div>
            <button className="toast-close" onClick={() => setToastGoal(null)}>×</button>
          </div>
        )}

        <div className="goals-body">

          {/* ── Left column ── */}
          <div>
            <div className="create-card">
              <div className="create-title">New goal</div>

              <div className="field">
                <label>Goal type</label>
                <input
                  placeholder="e.g. Study, Deep Work..."
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Target (minutes / week)</label>
                <input
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                />
              </div>

              <button
                className="btn-create"
                disabled={loading}
                onClick={() => createGoal({ goalType, targetValue })}
              >
                {loading ? "Adding..." : "Add goal →"}
              </button>

              {error && <div className="error-msg">{error}</div>}
            </div>

            <div className="section-label">Recommended</div>
            <div className="rec-card">
              {recommendedGoals.map((g, i) => (
                <div key={i} className="rec-item">
                  <div className="rec-left">
                    <div className="rec-icon">{g.icon}</div>
                    <div>
                      <div className="rec-name">{g.goalType}</div>
                      <div className="rec-dur">{g.targetValue} min / week</div>
                    </div>
                  </div>
                  <button
                    className="btn-add-rec"
                    onClick={() => createGoal(g)}
                    disabled={loading}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column ── */}
          <div>
            {fetchLoading ? (
              <div className="loading-state">Loading your goals...</div>
            ) : (
              <>
                <div className="section-label">Active goals ({active.length})</div>
                <div className="goals-grid">
                  {active.length === 0 ? (
                    <div className="empty-section">
                      No active goals yet. Add one from the left panel.
                    </div>
                  ) : (
                    active.map((g) => {
                      const pct = g.targetValue > 0
                        ? Math.min(100, Math.round((g.progressValue / g.targetValue) * 100))
                        : 0;
                      return (
                        <div key={g.id} className="goal-card">
                          <div className="goal-top">
                            <span className="goal-type">{g.goalType}</span>
                            <span className="badge active-badge">In progress</span>
                          </div>
                          <div className="goal-nums">
                            <span className="goal-progress-text">
                              {g.progressValue} / {g.targetValue} min
                            </span>
                            <span className="goal-pct-text">{pct}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {achieved.length > 0 && (
                  <>
                    <div className="section-label">Achieved ({achieved.length})</div>
                    <div className="goals-grid">
                      {achieved.map((g) => (
                        <div key={g.id} className="goal-card achieved-card">
                          <div className="goal-top">
                            <span className="goal-type">{g.goalType}</span>
                            <span className="badge done-badge">✓ Achieved</span>
                          </div>
                          <div className="goal-nums">
                            <span className="goal-progress-text">
                              {g.progressValue} / {g.targetValue} min
                            </span>
                            <span className="goal-pct-text">100%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill done" style={{ width: "100%" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
