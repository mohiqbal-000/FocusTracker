"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8080/api";

type PersonalRecords = {
  longestSessionMinutes: number;
  longestSessionDate: string;
  bestDayMinutes: number;
  bestDayDate: string;
  bestDaySessionCount: number;
  bestStreakDays: number;
  bestStreakStart: string;
  bestStreakEnd: string;
  currentStreakDays: number;
  allTimeMinutes: number;
  allTimeSessions: number;
  allTimeActiveDays: number;
};

export default function RecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<PersonalRecords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API}/focus/stats/records`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(setRecords)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const fmtHours = (m: number) => {
    if (m === 0) return "0m";
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  };

  const streakPct = records && records.bestStreakDays > 0
    ? Math.min(100, Math.round((records.currentStreakDays / records.bestStreakDays) * 100))
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rec-root {
          min-height: 100vh;
          background: #0a0a0a;
          color: #f0ede6;
          font-family: 'DM Sans', sans-serif;
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

        /* Body */
        .rec-body {
          max-width: 860px;
          margin: 0 auto;
          padding: 48px 40px;
        }

        /* Page header */
        .page-header { margin-bottom: 40px; }
        .page-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .page-sub { font-size: 14px; color: #555; }

        /* All-time banner */
        .alltime-banner {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 28px 28px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .alltime-banner::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .alltime-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0 24px;
          border-right: 1px solid #1e1e1e;
        }
        .alltime-item:first-child { padding-left: 0; }
        .alltime-item:last-child { border-right: none; }

        .alltime-label {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #444;
        }

        .alltime-value {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #f0ede6;
          line-height: 1;
        }

        .alltime-sub { font-size: 12px; color: #444; }

        /* Record cards grid */
        .records-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .rec-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 24px 24px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .rec-card:hover { border-color: #2a2a2a; }

        .rec-card-icon {
          font-size: 22px;
          margin-bottom: 16px;
          display: block;
        }

        .rec-card-label {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 8px;
        }

        .rec-card-value {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: #f0ede6;
          line-height: 1;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }

        .rec-card-value.gold { color: #c9a84c; }

        .rec-card-date {
          font-size: 12px;
          color: #555;
          margin-bottom: 6px;
        }

        .rec-card-detail {
          font-size: 12px;
          color: #444;
        }

        /* Glow accent top-left corner */
        .rec-card::before {
          content: '';
          position: absolute;
          top: -40px; left: -40px;
          width: 120px; height: 120px;
          background: radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Streak card — full width */
        .streak-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 28px 28px;
          margin-bottom: 24px;
        }

        .streak-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .streak-left {}

        .streak-label {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 8px;
        }

        .streak-values {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .streak-best {
          font-family: 'Syne', sans-serif;
          font-size: 40px;
          font-weight: 800;
          color: #c9a84c;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .streak-unit {
          font-size: 14px;
          color: #555;
        }

        .streak-dates {
          font-size: 12px;
          color: #444;
          margin-top: 4px;
        }

        .streak-right {
          text-align: right;
        }

        .streak-current-label {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 6px;
        }

        .streak-current-val {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #f0ede6;
          line-height: 1;
        }

        .streak-current-sub {
          font-size: 11px;
          color: #444;
          margin-top: 4px;
        }

        /* Progress bar */
        .streak-progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #444;
          margin-bottom: 8px;
        }

        .streak-progress-label span:last-child { color: #c9a84c; }

        .progress-bg {
          height: 6px;
          background: #1a1a1a;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #a07830, #c9a84c);
          border-radius: 3px;
          transition: width 0.8s ease;
        }

        .progress-fill.complete { background: #4ade80; }

        /* Motivational tag */
        .streak-motivation {
          margin-top: 14px;
          font-size: 12px;
          color: #555;
          font-style: italic;
        }

        /* Empty state */
        .empty-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 60px;
          text-align: center;
          color: #333;
        }
        .empty-card-icon { font-size: 32px; margin-bottom: 12px; display: block; }
        .empty-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #444;
          margin-bottom: 8px;
        }
        .empty-card-sub { font-size: 13px; color: #333; }

        /* States */
        .loading-wrap, .error-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          font-size: 14px;
        }
        .loading-wrap { color: #444; }
        .error-wrap { color: #e06060; }

        @media (max-width: 680px) {
          .rec-body { padding: 32px 20px; }
          .nav { padding: 16px 20px; }
          .records-grid { grid-template-columns: 1fr; }
          .alltime-banner { grid-template-columns: 1fr; gap: 20px; }
          .alltime-item { border-right: none; padding: 0; border-bottom: 1px solid #1e1e1e; padding-bottom: 16px; }
          .alltime-item:last-child { border-bottom: none; padding-bottom: 0; }
          .streak-header { flex-direction: column; gap: 16px; }
          .streak-right { text-align: left; }
        }
      `}</style>

      <div className="rec-root">
        <nav className="nav">
          <div className="nav-brand">FocusTracker</div>
          <button className="nav-back" onClick={() => router.push("/Index")}>
            ← Dashboard
          </button>
        </nav>

        <div className="rec-body">
          {loading && <div className="loading-wrap">Loading your records...</div>}
          {error   && <div className="error-wrap">Failed to load: {error}</div>}

          {records && !loading && (
            <>
              <div className="page-header">
                <h1 className="page-title">Personal records</h1>
                <p className="page-sub">Your all-time bests across every focus session</p>
              </div>

              {/* All sessions are empty */}
              {records.allTimeSessions === 0 ? (
                <div className="empty-card">
                  <span className="empty-card-icon">🏆</span>
                  <div className="empty-card-title">No records yet</div>
                  <div className="empty-card-sub">
                    Complete your first focus session to start building your personal bests.
                  </div>
                </div>
              ) : (
                <>
                  {/* All-time totals banner */}
                  <div className="alltime-banner">
                    <div className="alltime-item">
                      <span className="alltime-label">Total focus time</span>
                      <span className="alltime-value">{fmtHours(records.allTimeMinutes)}</span>
                      <span className="alltime-sub">all time</span>
                    </div>
                    <div className="alltime-item">
                      <span className="alltime-label">Total sessions</span>
                      <span className="alltime-value">{records.allTimeSessions}</span>
                      <span className="alltime-sub">completed</span>
                    </div>
                    <div className="alltime-item">
                      <span className="alltime-label">Active days</span>
                      <span className="alltime-value">{records.allTimeActiveDays}</span>
                      <span className="alltime-sub">days with focus</span>
                    </div>
                  </div>

                  {/* Record cards */}
                  <div className="records-grid">

                    {/* Longest session */}
                    <div className="rec-card">
                      <span className="rec-card-icon">⏱</span>
                      <div className="rec-card-label">Longest single session</div>
                      <div className="rec-card-value gold">
                        {fmtHours(records.longestSessionMinutes)}
                      </div>
                      <div className="rec-card-date">{records.longestSessionDate}</div>
                      <div className="rec-card-detail">
                        {records.longestSessionMinutes} minutes of uninterrupted focus
                      </div>
                    </div>

                    {/* Best day */}
                    <div className="rec-card">
                      <span className="rec-card-icon">📅</span>
                      <div className="rec-card-label">Most focused day</div>
                      <div className="rec-card-value gold">
                        {fmtHours(records.bestDayMinutes)}
                      </div>
                      <div className="rec-card-date">{records.bestDayDate}</div>
                      <div className="rec-card-detail">
                        {records.bestDaySessionCount} session
                        {records.bestDaySessionCount !== 1 ? "s" : ""} that day
                      </div>
                    </div>

                  </div>

                  {/* Streak card — full width */}
                  <div className="streak-card">
                    <div className="streak-header">
                      <div className="streak-left">
                        <div className="streak-label">🔥 Best streak ever</div>
                        <div className="streak-values">
                          <span className="streak-best">{records.bestStreakDays}</span>
                          <span className="streak-unit">
                            day{records.bestStreakDays !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {records.bestStreakDays > 0 && (
                          <div className="streak-dates">
                            {records.bestStreakStart} — {records.bestStreakEnd}
                          </div>
                        )}
                      </div>

                      <div className="streak-right">
                        <div className="streak-current-label">Current streak</div>
                        <div className="streak-current-val">
                          {records.currentStreakDays}
                          <span style={{ fontSize: 14, color: "#555", marginLeft: 4 }}>
                            day{records.currentStreakDays !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="streak-current-sub">
                          {records.currentStreakDays >= records.bestStreakDays && records.bestStreakDays > 0
                            ? "🏆 This is your best!"
                            : `${records.bestStreakDays - records.currentStreakDays} more to beat record`}
                        </div>
                      </div>
                    </div>

                    {/* Progress toward beating the record */}
                    <div className="streak-progress-label">
                      <span>
                        Current: {records.currentStreakDays} day
                        {records.currentStreakDays !== 1 ? "s" : ""}
                      </span>
                      <span>{streakPct}% of record</span>
                    </div>
                    <div className="progress-bg">
                      <div
                        className={`progress-fill ${streakPct >= 100 ? "complete" : ""}`}
                        style={{ width: `${streakPct}%` }}
                      />
                    </div>

                    <div className="streak-motivation">
                      {records.currentStreakDays === 0
                        ? "Start today to begin a new streak."
                        : records.currentStreakDays >= records.bestStreakDays
                        ? "You're on a record-breaking streak — keep going!"
                        : records.currentStreakDays >= records.bestStreakDays * 0.75
                        ? "You're close to your best streak — don't break it now."
                        : records.currentStreakDays >= records.bestStreakDays * 0.5
                        ? "Halfway to your best streak. Keep showing up."
                        : "Every day counts. Stay consistent."}
                    </div>
                  </div>

                  {/* Quick nav back */}
                  <div style={{ textAlign: "center", marginTop: 8 }}>
                    <button
                      onClick={() => router.push("/Index")}
                      style={{
                        background: "transparent",
                        border: "1px solid #222",
                        borderRadius: 8,
                        padding: "12px 28px",
                        fontSize: 13,
                        color: "#888",
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s",
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLButtonElement).style.borderColor = "#c9a84c";
                        (e.target as HTMLButtonElement).style.color = "#c9a84c";
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLButtonElement).style.borderColor = "#222";
                        (e.target as HTMLButtonElement).style.color = "#888";
                      }}
                    >
                      Start a session →
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
