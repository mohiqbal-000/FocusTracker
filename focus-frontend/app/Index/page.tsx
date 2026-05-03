"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type FocusSession = {
  id: number;
  startTime: string;
  endTime: string;
  duration: number;
  note?: string;
};

const API = "http://localhost:8080/api";

export default function Dashboard() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ── Daily stats ───────────────────────────────────────────────────────────
  const [dailyMinutes, setDailyMinutes] = useState(0);
  const [dailySessions, setDailySessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [goalTarget, setGoalTarget] = useState<number | null>(null);
  const [goalProgress, setGoalProgress] = useState(0);

  // ── Monthly stats — NEW ───────────────────────────────────────────────────
  const [monthlyMinutes, setMonthlyMinutes] = useState(0);
  const [monthlySessions, setMonthlySessions] = useState(0);

  const [history, setHistory] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [tag, setTag] = useState("");

  /* Load JWT */
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) router.push("/login");
    else setToken(t);
  }, [router]);

  /* Timer */
  useEffect(() => {
    if (!startTime) return;
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startTime]);

  /* Refresh stats — now fetches monthly too */
  const refreshStats = async (t: string) => {
    const h = { Authorization: `Bearer ${t}` };
    try {
      const [daily, streak, hist, monthly] = await Promise.all([
        fetch(`${API}/focus/stats/daily`,   { headers: h }).then(r => r.json()),
        fetch(`${API}/focus/stats/streak`,  { headers: h }).then(r => r.json()),
        fetch(`${API}/focus/history`,       { headers: h }).then(r => r.json()),
        fetch(`${API}/focus/stats/monthly`, { headers: h }).then(r => r.json()),
      ]);

      // Daily
      setDailyMinutes(daily.totalMinutes ?? 0);
      setDailySessions(daily.totalSessions ?? 0);
      if (daily.goalSet) {
        setGoalTarget(daily.targetMinutes);
        setGoalProgress(daily.progressPercent ?? 0);
      }

      // Streak
      setStreakDays(streak.streakDays ?? streak.streak ?? 0);

      // History
      setHistory(Array.isArray(hist) ? hist.slice(0, 8) : []);

      // Monthly — NEW
      setMonthlyMinutes(monthly.totalMinutes ?? 0);
      setMonthlySessions(monthly.totalSessions ?? 0);

    } catch (e) {
      console.error("Stats error", e);
    }
  };

  useEffect(() => {
    if (token) refreshStats(token);
  }, [token]);

  /* Start session */
  const startSession = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const url = tag.trim()
        ? `${API}/focus/start?tag=${encodeURIComponent(tag.trim())}`
        : `${API}/focus/start`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSessionId(data.id);
      setStartTime(Date.now());
      setElapsedSeconds(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* Stop session */
  const stopSession = async () => {
    if (!token || !sessionId) return;
    setLoading(true);
    try {
      await fetch(`${API}/focus/stop/${sessionId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessionId(null);
      setStartTime(null);
      setElapsedSeconds(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      await refreshStats(token);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/login");
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Format minutes as "2h 30m" or "45m"
  const fmtHours = (m: number) => {
    if (m === 0) return "0m";
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  };

  const currentMonthName = new Date().toLocaleString("en-US", { month: "long" });

  const isRunning = !!sessionId;
  const ringPct = Math.min(100, (elapsedSeconds / (25 * 60)) * 100);
  const circumference = 2 * Math.PI * 88;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .dash-root {
          min-height: 100vh;
          background: #0a0a0a;
          color: #f0ede6;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* Nav */
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
        .nav-actions { display: flex; gap: 12px; align-items: center; }
        .nav-btn {
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
        .nav-btn:hover { border-color: #444; color: #f0ede6; }
        .nav-btn.gold { border-color: #c9a84c; color: #c9a84c; }
        .nav-btn.gold:hover { background: #c9a84c; color: #0a0a0a; }

        /* Layout */
        .dash-body {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 0;
        }
        .dash-main { padding: 48px 40px; border-right: 1px solid #181818; }
        .dash-side { padding: 48px 32px; }

        /* ── Stats grid — now 3 cols daily + 1 wide monthly ── */
        .stats-top {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }

        /* Monthly card — full width below daily row */
        .monthly-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: border-color 0.15s;
          cursor: pointer;
        }
        .monthly-card:hover { border-color: #2a2a2a; }

        .monthly-left { display: flex; flex-direction: column; gap: 3px; }

        .monthly-label {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #444;
        }

        .monthly-value {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #f0ede6;
          line-height: 1;
        }

        .monthly-sub { font-size: 12px; color: #444; margin-top: 2px; }

        .monthly-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
        }

        .monthly-sessions-val {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #888;
        }

        .monthly-sessions-label {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #333;
        }

        .monthly-arrow {
          font-size: 12px;
          color: #2a2a2a;
          margin-top: 6px;
          transition: color 0.15s;
        }
        .monthly-card:hover .monthly-arrow { color: #c9a84c; }

        /* Daily stat cards */
        .stat-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 20px 16px;
        }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #f0ede6;
          margin-bottom: 4px;
        }
        .stat-name {
          font-size: 11px;
          color: #444;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Goal bar */
        .goal-section {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 32px;
        }
        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .goal-title {
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #555;
        }
        .goal-pct {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #c9a84c;
        }
        .goal-bar-bg {
          height: 4px;
          background: #1e1e1e;
          border-radius: 2px;
          overflow: hidden;
        }
        .goal-bar-fill {
          height: 100%;
          background: #c9a84c;
          border-radius: 2px;
          transition: width 0.6s ease;
        }
        .goal-desc { margin-top: 8px; font-size: 12px; color: #444; }

        /* Timer section */
        .timer-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 48px;
        }
        .timer-label {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 32px;
        }
        .ring-wrap { position: relative; margin-bottom: 32px; }
        .ring-svg { transform: rotate(-90deg); }
        .ring-bg { fill: none; stroke: #1a1a1a; stroke-width: 3; }
        .ring-progress {
          fill: none;
          stroke: #c9a84c;
          stroke-width: 3;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease;
        }
        .ring-running .ring-progress { stroke: #e8b84b; }
        .timer-center {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        .timer-digits {
          font-family: 'DM Mono', monospace;
          font-size: 42px;
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1;
          color: #f0ede6;
        }
        .timer-sub { font-size: 11px; color: #444; margin-top: 6px; letter-spacing: 0.08em; }

        /* Tag input */
        .tag-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .tag-input {
          background: #111;
          border: 1px solid #222;
          border-radius: 6px;
          padding: 9px 14px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #f0ede6;
          outline: none;
          width: 180px;
          transition: border-color 0.2s;
        }
        .tag-input:focus { border-color: #c9a84c; }
        .tag-input::placeholder { color: #333; }
        .tag-label { font-size: 12px; color: #555; }

        /* CTA buttons */
        .cta-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 200px;
          padding: 16px 32px;
          border-radius: 100px;
          border: none;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cta-btn.start { background: #c9a84c; color: #0a0a0a; }
        .cta-btn.start:hover { background: #d4b35e; }
        .cta-btn.stop { background: transparent; border: 2px solid #e06060; color: #e06060; }
        .cta-btn.stop:hover { background: rgba(220,96,96,0.1); }
        .cta-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Side panel */
        .side-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 20px;
        }
        .history-list { display: flex; flex-direction: column; gap: 10px; }
        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 10px;
          padding: 14px 16px;
          transition: border-color 0.15s;
        }
        .history-item:hover { border-color: #2a2a2a; }
        .history-left { display: flex; flex-direction: column; gap: 3px; }
        .history-date { font-size: 13px; color: #888; }
        .history-note { font-size: 11px; color: #444; font-style: italic; }
        .history-dur {
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          color: #c9a84c;
          font-weight: 500;
        }
        .empty-state { text-align: center; padding: 40px 20px; color: #333; font-size: 14px; }

        /* Quick links */
        .quick-links { display: flex; flex-direction: column; gap: 8px; margin-top: 32px; }
        .quick-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 14px;
          color: #888;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .quick-link:hover { border-color: #c9a84c; color: #f0ede6; }
        .quick-link-arrow { color: #333; transition: color 0.15s; }
        .quick-link:hover .quick-link-arrow { color: #c9a84c; }

        @media (max-width: 900px) {
          .dash-body { grid-template-columns: 1fr; }
          .dash-main { border-right: none; border-bottom: 1px solid #181818; padding: 32px 24px; }
          .dash-side { padding: 32px 24px; }
          .nav { padding: 16px 24px; }
          .stats-top { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="dash-root">
        {/* Nav */}
        <nav className="nav">
          <div className="nav-brand">FocusTracker</div>
          <div className="nav-actions">
            <button className="nav-btn gold" onClick={() => router.push("/Goals")}>
              Goals
            </button>
            <button className="nav-btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </nav>

        <div className="dash-body">
          {/* Main */}
          <main className="dash-main">

            {/* Daily stats — 3 cols */}
            <div className="stats-top">
              <div className="stat-card">
                <div className="stat-value">{dailyMinutes}</div>
                <div className="stat-name">min today</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{dailySessions}</div>
                <div className="stat-name">sessions</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">🔥 {streakDays}</div>
                <div className="stat-name">day streak</div>
              </div>
            </div>

            {/* Monthly card — full width, clickable → trend page */}
            <div
              className="monthly-card"
              onClick={() => router.push("/Stats/trend")}
              title="View weekly trend"
            >
              <div className="monthly-left">
                <span className="monthly-label">{currentMonthName}</span>
                <span className="monthly-value">{fmtHours(monthlyMinutes)}</span>
                <span className="monthly-sub">focus this month</span>
              </div>
              <div className="monthly-right">
                <span className="monthly-sessions-val">{monthlySessions}</span>
                <span className="monthly-sessions-label">sessions</span>
                <span className="monthly-arrow">View trend →</span>
              </div>
            </div>

            {/* Goal bar */}
            {goalTarget !== null && (
              <div className="goal-section">
                <div className="goal-header">
                  <span className="goal-title">Daily goal</span>
                  <span className="goal-pct">{goalProgress}%</span>
                </div>
                <div className="goal-bar-bg">
                  <div className="goal-bar-fill" style={{ width: `${goalProgress}%` }} />
                </div>
                <div className="goal-desc">
                  {dailyMinutes} / {goalTarget} min
                  {goalProgress >= 100 ? " · ✓ Goal reached!" : ""}
                </div>
              </div>
            )}

            {/* Timer */}
            <div className="timer-section">
              <div className="timer-label">
                {isRunning ? "Session in progress" : "Ready to focus"}
              </div>

              <div className={`ring-wrap ${isRunning ? "ring-running" : ""}`}>
                <svg className="ring-svg" width="200" height="200" viewBox="0 0 200 200">
                  <circle className="ring-bg" cx="100" cy="100" r="88" />
                  <circle
                    className="ring-progress"
                    cx="100" cy="100" r="88"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (ringPct / 100) * circumference}
                  />
                </svg>
                <div className="timer-center">
                  <div className="timer-digits">{formatTime(elapsedSeconds)}</div>
                  <div className="timer-sub">{isRunning ? "elapsed" : "mm:ss"}</div>
                </div>
              </div>

              {!isRunning && (
                <div className="tag-row">
                  <span className="tag-label">Tag</span>
                  <input
                    className="tag-input"
                    placeholder="study, work, exercise..."
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  />
                </div>
              )}

              {!isRunning ? (
                <button className="cta-btn start" onClick={startSession} disabled={loading}>
                  {loading ? "Starting..." : "▶ Start focus"}
                </button>
              ) : (
                <button className="cta-btn stop" onClick={stopSession} disabled={loading}>
                  {loading ? "Stopping..." : "■ Stop session"}
                </button>
              )}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="dash-side">
            <div className="side-title">Recent sessions</div>

            {history.length === 0 ? (
              <div className="empty-state">No sessions yet. Start your first focus block.</div>
            ) : (
              <div className="history-list">
                {history.map((h) => (
                  <div key={h.id} className="history-item">
                    <div className="history-left">
                      <span className="history-date">{formatDate(h.startTime)}</span>
                      {h.note && <span className="history-note">{h.note}</span>}
                    </div>
                    <span className="history-dur">{h.duration} min</span>
                  </div>
                ))}
              </div>
            )}

            <div className="quick-links">
              <button className="quick-link" onClick={() => router.push("/Goals")}>
                <span>🎯 Manage goals</span>
                <span className="quick-link-arrow">→</span>
              </button>
              <button className="quick-link" onClick={() => router.push("/Stats/trend")}>
                <span>📈 Weekly trend</span>
                <span className="quick-link-arrow">→</span>
              </button>
              <button className="quick-link" onClick={() => router.push("/Stats/best-hours")}>
                <span>🕐 Best focus hours</span>
                <span className="quick-link-arrow">→</span>
              </button>
              <button className="quick-link" onClick={() => router.push("/Stats/records")}>
                <span>🏆 Personal records</span>
                <span className="quick-link-arrow">→</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
