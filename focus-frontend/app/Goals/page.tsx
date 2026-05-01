"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type GoalResponse = {
  id: number;
  goalType: string;
  targetValue: number;
  progressValue: number;
  achieved: boolean;
};

const API = "http://localhost:8080/api";

const recommendedGoals = [
  { goalType: "Study", targetValue: 120, icon: "📖" },
  { goalType: "Coding Practice", targetValue: 90, icon: "💻" },
  { goalType: "Exercise", targetValue: 45, icon: "🏃" },
  { goalType: "Reading", targetValue: 60, icon: "📚" },
  { goalType: "Writing", targetValue: 30, icon: "✍️" },
];

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [goalType, setGoalType] = useState("");
  const [targetValue, setTargetValue] = useState(60);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Load token from localStorage ─────────────────────────────────────────
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  // ── Fetch goals — no userId in URL, backend reads it from JWT ─────────────
  useEffect(() => {
    if (!token) return;
    setFetchLoading(true);

    fetch(`${API}/Goals`, {                          // ← /Goals only, no /${userId}
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setGoals)
      .catch((e) => setError(`Failed to load goals: ${e.message}`))
      .finally(() => setFetchLoading(false));
  }, [token]);                                       // ← depends on token only

  // ── Create goal — no userId in URL ────────────────────────────────────────
  const createGoal = async (goal: { goalType: string; targetValue: number }) => {
    if (!token) return;
    if (!goal.goalType.trim()) { setError("Goal type is required"); return; }

    setLoading(true);
    setError("");

    const today    = new Date().toISOString().slice(0, 10);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);

    try {
      const res = await fetch(`${API}/Goals`, {      // ← /Goals only, no /${userId}
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goalType:    goal.goalType.trim(),
          targetValue: goal.targetValue,
          startDate:   today,
          endDate:     nextWeek,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const newGoal: GoalResponse = await res.json();
      setGoals((prev) => [...prev, newGoal]);
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

        .goals-root {
          min-height: 100vh;
          background: #0a0a0a;
          color: #f0ede6;
          font-family: 'DM Sans', sans-serif;
        }

        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 40px;
          border-bottom: 1px solid #181818;
        }

        .nav-brand {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c9a84c;
        }

        .nav-back {
          background: transparent;
          border: 1px solid #222;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #888;
          cursor: pointer;
          transition: all 0.15s;
        }
        .nav-back:hover { border-color: #444; color: #f0ede6; }

        .goals-body {
          max-width: 1100px;
          margin: 0 auto;
          padding: 48px 40px;
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 40px;
        }

        .section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 16px;
        }

        /* Create form */
        .create-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 28px 24px;
          margin-bottom: 24px;
        }

        .create-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .field { margin-bottom: 14px; }

        .field label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 7px;
        }

        .field input {
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
        }

        .field input:focus { border-color: #c9a84c; }
        .field input::placeholder { color: #333; }

        .btn-create {
          width: 100%;
          background: #c9a84c;
          color: #0a0a0a;
          border: none;
          border-radius: 8px;
          padding: 13px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-top: 4px;
        }
        .btn-create:hover { opacity: 0.9; }
        .btn-create:disabled { opacity: 0.5; cursor: not-allowed; }

        .error-msg {
          margin-top: 12px;
          padding: 10px 12px;
          background: rgba(220,80,80,0.08);
          border: 1px solid rgba(220,80,80,0.2);
          border-radius: 6px;
          font-size: 12px;
          color: #e06060;
        }

        /* Recommended */
        .rec-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 24px;
        }

        .rec-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #181818;
        }
        .rec-item:last-child { border-bottom: none; }

        .rec-left { display: flex; align-items: center; gap: 12px; }

        .rec-icon {
          width: 36px; height: 36px;
          background: #1a1a1a;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }

        .rec-name { font-size: 14px; font-weight: 500; }
        .rec-dur  { font-size: 11px; color: #555; margin-top: 1px; }

        .btn-add-rec {
          background: transparent;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          color: #888;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-add-rec:hover { border-color: #c9a84c; color: #c9a84c; }
        .btn-add-rec:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Goal cards */
        .goals-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .goal-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 14px;
          padding: 20px;
          transition: border-color 0.15s;
        }
        .goal-card:hover { border-color: #2a2a2a; }
        .goal-card.achieved-card { border-color: rgba(80,200,120,0.2); }

        .goal-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .goal-type {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
        }

        .badge {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 100px;
        }

        .badge.active-badge {
          background: rgba(201,168,76,0.12);
          color: #c9a84c;
          border: 1px solid rgba(201,168,76,0.25);
        }

        .badge.done-badge {
          background: rgba(80,200,120,0.12);
          color: #50c878;
          border: 1px solid rgba(80,200,120,0.25);
        }

        .goal-nums {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 10px;
        }

        .goal-progress-text { font-size: 13px; color: #888; }

        .goal-pct-text {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #c9a84c;
        }
        .goal-card.achieved-card .goal-pct-text { color: #50c878; }

        .progress-bar-bg {
          height: 4px;
          background: #1a1a1a;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
          background: #c9a84c;
        }
        .progress-bar-fill.done { background: #50c878; }

        .empty-section {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 14px;
          padding: 40px;
          text-align: center;
          color: #333;
          font-size: 14px;
        }

        .loading-state {
          padding: 40px;
          text-align: center;
          color: #444;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .goals-body { grid-template-columns: 1fr; padding: 32px 24px; }
          .nav { padding: 16px 24px; }
        }
      `}</style>

      <div className="goals-root">
        <nav className="nav">
          <div className="nav-brand">FocusTracker</div>
          <button className="nav-back" onClick={() => router.push("/Index")}>
            ← Dashboard
          </button>
        </nav>

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
