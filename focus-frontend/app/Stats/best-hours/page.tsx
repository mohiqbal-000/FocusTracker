"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8080/api";

type HourlyBucket = {
  hour: number;
  label: string;
  totalMinutes: number;
  sessionCount: number;
  avgMinutes: number;
  intensityLevel: number; // 0–4
};

type BestHours = {
  allHours: HourlyBucket[];
  topHours: HourlyBucket[];
  peakPeriod: string;
  insight: string;
  totalSessionsAnalysed: number;
};

const INTENSITY_COLORS = [
  "#141414", // 0 — empty
  "#2a1f0a", // 1 — low
  "#4a3410", // 2 — medium
  "#8a6020", // 3 — high
  "#c9a84c", // 4 — peak
];

const PERIOD_ICONS: Record<string, string> = {
  morning:   "🌅",
  afternoon: "☀️",
  evening:   "🌆",
  night:     "🌙",
  none:      "⏳",
};

export default function BestHoursPage() {
  const router = useRouter();
  const [data, setData]     = useState<BestHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [hovered, setHovered] = useState<HourlyBucket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API}/focus/stats/best-hours`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const fmtMin = (m: number) => {
    if (m === 0) return "0m";
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  };

  // Group 24 hours into 4 rows of 6 for the heatmap grid
  const rows = data
    ? [
        data.allHours.slice(0, 6),   // 12am – 5am
        data.allHours.slice(6, 12),  // 6am  – 11am
        data.allHours.slice(12, 18), // 12pm – 5pm
        data.allHours.slice(18, 24), // 6pm  – 11pm
      ]
    : [];

  const rowLabels = ["12am–5am", "6am–11am", "12pm–5pm", "6pm–11pm"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .bh-root {
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
        .bh-body {
          max-width: 860px;
          margin: 0 auto;
          padding: 48px 40px;
        }

        /* Header */
        .page-header { margin-bottom: 40px; }
        .page-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }
        .page-sub { font-size: 14px; color: #555; }

        /* Insight banner */
        .insight-banner {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 14px;
          padding: 20px 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .insight-icon {
          font-size: 28px;
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          background: #1a1a1a;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .insight-text { font-size: 14px; color: #aaa; line-height: 1.6; }
        .insight-text strong { color: #f0ede6; font-weight: 500; }

        /* Top hours */
        .top-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .top-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 14px;
          padding: 20px 18px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .top-card:hover { border-color: #2a2a2a; }

        .top-card::before {
          content: '';
          position: absolute;
          top: -30px; left: -30px;
          width: 100px; height: 100px;
          background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .top-rank {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 10px;
        }

        .top-rank.rank-1 { color: #c9a84c; }
        .top-rank.rank-2 { color: #888; }
        .top-rank.rank-3 { color: #555; }

        .top-hour {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #f0ede6;
          line-height: 1;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .top-mins {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #c9a84c;
          margin-bottom: 4px;
        }

        .top-detail { font-size: 11px; color: #444; }

        /* Heatmap */
        .heatmap-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 28px 24px;
          margin-bottom: 24px;
        }

        .heatmap-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .heatmap-subtitle {
          font-size: 12px;
          color: #444;
          margin-bottom: 24px;
        }

        .heatmap-grid { display: flex; flex-direction: column; gap: 10px; }

        .heatmap-row {
          display: grid;
          grid-template-columns: 76px repeat(6, 1fr);
          gap: 6px;
          align-items: center;
        }

        .row-label {
          font-size: 10px;
          color: #333;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.04em;
        }

        .heat-cell {
          aspect-ratio: 1;
          border-radius: 6px;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
          position: relative;
          border: 1px solid transparent;
        }

        .heat-cell:hover {
          transform: scale(1.12);
          z-index: 2;
          border-color: rgba(201,168,76,0.3);
        }

        .heat-cell.active:hover {
          box-shadow: 0 0 12px rgba(201,168,76,0.2);
        }

        /* Legend */
        .legend-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          margin-top: 16px;
        }

        .legend-label { font-size: 10px; color: #333; }

        .legend-cell {
          width: 14px; height: 14px;
          border-radius: 3px;
        }

        /* Tooltip */
        .tooltip-box {
          background: #1e1e1e;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 24px;
          min-height: 64px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: opacity 0.15s;
        }

        .tooltip-hour {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #c9a84c;
          flex-shrink: 0;
          min-width: 72px;
        }

        .tooltip-divider {
          width: 1px;
          height: 36px;
          background: #2a2a2a;
          flex-shrink: 0;
        }

        .tooltip-stats {
          display: flex;
          gap: 24px;
        }

        .tooltip-stat { display: flex; flex-direction: column; gap: 2px; }

        .tooltip-stat-val {
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          color: #f0ede6;
          font-weight: 500;
        }

        .tooltip-stat-label { font-size: 10px; color: #444; letter-spacing: 0.08em; text-transform: uppercase; }

        .tooltip-empty {
          font-size: 13px;
          color: #333;
          font-style: italic;
        }

        /* Hour list table */
        .hours-table-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          overflow: hidden;
        }

        .hours-table-header {
          padding: 18px 24px;
          border-bottom: 1px solid #181818;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
        }

        .hours-row {
          display: grid;
          grid-template-columns: 80px 1fr 72px 72px 80px;
          align-items: center;
          padding: 12px 24px;
          border-bottom: 1px solid #131313;
          gap: 12px;
          transition: background 0.1s;
        }
        .hours-row:last-child { border-bottom: none; }
        .hours-row:hover { background: #131313; }

        .hours-row.col-header {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #2a2a2a;
          padding-top: 8px;
          padding-bottom: 8px;
        }
        .hours-row.col-header:hover { background: transparent; }

        .hr-label {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #666;
        }

        .hr-bar-wrap {
          height: 4px;
          background: #1a1a1a;
          border-radius: 2px;
          overflow: hidden;
        }

        .hr-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .hr-mins {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #555;
          text-align: right;
        }
        .hr-mins.has-data { color: #c9a84c; }

        .hr-sessions { font-size: 12px; color: #333; text-align: right; }
        .hr-sessions.has-data { color: #666; }

        .hr-avg { font-size: 12px; color: #333; text-align: right; }
        .hr-avg.has-data { color: #555; }

        /* States */
        .loading-wrap, .error-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          font-size: 14px;
        }
        .loading-wrap { color: #444; }
        .error-wrap   { color: #e06060; }

        .empty-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 60px;
          text-align: center;
        }
        .empty-icon  { font-size: 32px; margin-bottom: 12px; display: block; }
        .empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #444;
          margin-bottom: 8px;
        }
        .empty-sub { font-size: 13px; color: #333; }

        @media (max-width: 680px) {
          .bh-body  { padding: 32px 20px; }
          .nav      { padding: 16px 20px; }
          .top-grid { grid-template-columns: 1fr; }
          .heatmap-row { grid-template-columns: 60px repeat(6, 1fr); gap: 4px; }
          .hours-row { grid-template-columns: 68px 1fr 60px; }
          .hr-sessions, .hr-avg { display: none; }
        }
      `}</style>

      <div className="bh-root">
        <nav className="nav">
          <div className="nav-brand">FocusTracker</div>
          <button className="nav-back" onClick={() => router.push("/Index")}>
            ← Dashboard
          </button>
        </nav>

        <div className="bh-body">
          {loading && <div className="loading-wrap">Analysing your focus patterns...</div>}
          {error   && <div className="error-wrap">Failed to load: {error}</div>}

          {data && !loading && (
            <>
              <div className="page-header">
                <h1 className="page-title">Best focus hours</h1>
                <p className="page-sub">
                  When you focus best — based on {data.totalSessionsAnalysed} completed session
                  {data.totalSessionsAnalysed !== 1 ? "s" : ""}
                </p>
              </div>

              {data.totalSessionsAnalysed === 0 ? (
                <div className="empty-card">
                  <span className="empty-icon">🕐</span>
                  <div className="empty-title">No data yet</div>
                  <div className="empty-sub">
                    Complete focus sessions at different times of day to see your heatmap.
                  </div>
                </div>
              ) : (
                <>
                  {/* Insight banner */}
                  <div className="insight-banner">
                    <div className="insight-icon">
                      {PERIOD_ICONS[data.peakPeriod] ?? "⏳"}
                    </div>
                    <div className="insight-text">
                      {data.insight}
                    </div>
                  </div>

                  {/* Top 3 hours */}
                  {data.topHours.length > 0 && (
                    <div className="top-grid">
                      {data.topHours.map((h, i) => (
                        <div key={h.hour} className="top-card">
                          <div className={`top-rank rank-${i + 1}`}>
                            #{i + 1} peak hour
                          </div>
                          <div className="top-hour">{h.label}</div>
                          <div className="top-mins">{fmtMin(h.totalMinutes)} total</div>
                          <div className="top-detail">
                            {h.sessionCount} session{h.sessionCount !== 1 ? "s" : ""} ·{" "}
                            avg {Math.round(h.avgMinutes)}m
                          </div>
                        </div>
                      ))}
                      {/* pad to 3 cards if fewer than 3 top hours */}
                      {data.topHours.length < 3 &&
                        Array.from({ length: 3 - data.topHours.length }).map((_, i) => (
                          <div key={`pad-${i}`} className="top-card" style={{ opacity: 0.3 }}>
                            <div className="top-rank">#{data.topHours.length + i + 1} peak hour</div>
                            <div className="top-hour" style={{ color: "#333" }}>—</div>
                            <div className="top-detail">not enough data</div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Hover tooltip */}
                  <div className="tooltip-box">
                    {hovered ? (
                      <>
                        <div className="tooltip-hour">{hovered.label}</div>
                        <div className="tooltip-divider" />
                        {hovered.totalMinutes === 0 ? (
                          <span className="tooltip-empty">No sessions started at this hour</span>
                        ) : (
                          <div className="tooltip-stats">
                            <div className="tooltip-stat">
                              <span className="tooltip-stat-val">{fmtMin(hovered.totalMinutes)}</span>
                              <span className="tooltip-stat-label">Total focus</span>
                            </div>
                            <div className="tooltip-stat">
                              <span className="tooltip-stat-val">{hovered.sessionCount}</span>
                              <span className="tooltip-stat-label">Sessions</span>
                            </div>
                            <div className="tooltip-stat">
                              <span className="tooltip-stat-val">{Math.round(hovered.avgMinutes)}m</span>
                              <span className="tooltip-stat-label">Avg length</span>
                            </div>
                            <div className="tooltip-stat">
                              <span className="tooltip-stat-val">{hovered.intensityLevel}/4</span>
                              <span className="tooltip-stat-label">Intensity</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="tooltip-empty">Hover over a cell to see details</span>
                    )}
                  </div>

                  {/* Heatmap */}
                  <div className="heatmap-card">
                    <div className="heatmap-title">24-hour focus heatmap</div>
                    <div className="heatmap-subtitle">
                      Darker gold = more focus time. Intensity is relative to your own peak.
                    </div>

                    <div className="heatmap-grid">
                      {rows.map((row, rowIdx) => (
                        <div key={rowIdx} className="heatmap-row">
                          <span className="row-label">{rowLabels[rowIdx]}</span>
                          {row.map((cell) => (
                            <div
                              key={cell.hour}
                              className={`heat-cell ${cell.totalMinutes > 0 ? "active" : ""}`}
                              style={{
                                background: INTENSITY_COLORS[cell.intensityLevel],
                              }}
                              onMouseEnter={() => setHovered(cell)}
                              onMouseLeave={() => setHovered(null)}
                            />
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="legend-row">
                      <span className="legend-label">Less</span>
                      {INTENSITY_COLORS.map((c, i) => (
                        <div
                          key={i}
                          className="legend-cell"
                          style={{ background: c, border: "1px solid #222" }}
                        />
                      ))}
                      <span className="legend-label">More</span>
                    </div>
                  </div>

                  {/* Full hour breakdown table — only non-zero hours */}
                  <div className="hours-table-card">
                    <div className="hours-table-header">All active hours</div>

                    <div className="hours-row col-header">
                      <span>Hour</span>
                      <span>Focus time</span>
                      <span style={{ textAlign: "right" }}>Minutes</span>
                      <span style={{ textAlign: "right" }}>Sessions</span>
                      <span style={{ textAlign: "right" }}>Avg/session</span>
                    </div>

                    {[...data.allHours]
                      .filter((h) => h.totalMinutes > 0)
                      .sort((a, b) => b.totalMinutes - a.totalMinutes)
                      .map((h) => {
                        const maxMin = Math.max(
                          ...data.allHours.map((x) => x.totalMinutes),
                          1
                        );
                        const pct = (h.totalMinutes / maxMin) * 100;
                        return (
                          <div key={h.hour} className="hours-row">
                            <span className="hr-label">{h.label}</span>
                            <div className="hr-bar-wrap">
                              <div
                                className="hr-bar-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: INTENSITY_COLORS[h.intensityLevel],
                                }}
                              />
                            </div>
                            <span className="hr-mins has-data">{h.totalMinutes}m</span>
                            <span className="hr-sessions has-data">{h.sessionCount}</span>
                            <span className="hr-avg has-data">
                              {Math.round(h.avgMinutes)}m
                            </span>
                          </div>
                        );
                      })}

                    {data.allHours.every((h) => h.totalMinutes === 0) && (
                      <div style={{ padding: "32px 24px", color: "#333", fontSize: 13 }}>
                        No completed sessions yet.
                      </div>
                    )}
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
