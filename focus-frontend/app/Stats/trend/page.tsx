"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8080/api";

type DailyBucket = {
  date: string;
  dayLabel: string;
  fullLabel: string;
  totalMinutes: number;
  sessionCount: number;
  avgSessionMinutes: number;
  isToday: boolean;
};

type WeeklyTrend = {
  days: DailyBucket[];
  totalMinutesThisWeek: number;
  totalMinutesLastWeek: number;
  totalSessionsThisWeek: number;
  trendDirection: "UP" | "DOWN" | "FLAT";
  trendPercent: number;
  trendLabel: string;
  bestDayMinutes: number;
  bestDayLabel: string;
  dailyAverage: number;
  activeDays: number;
};

export default function TrendPage() {
  const router = useRouter();
  const [trend, setTrend] = useState<WeeklyTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API}/focus/stats/trend`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(setTrend)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const maxMinutes = trend
    ? Math.max(...trend.days.map((d) => d.totalMinutes), 1)
    : 1;

  const fmtHours = (m: number) => {
    if (m === 0) return "0m";
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  };

  const trendIcon = (dir: string) => {
    if (dir === "UP")   return "↑";
    if (dir === "DOWN") return "↓";
    return "→";
  };

  const trendColor = (dir: string) => {
    if (dir === "UP")   return "#4ade80";
    if (dir === "DOWN") return "#f87171";
    return "#94a3b8";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .tr-root {
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
        .tr-body {
          max-width: 900px;
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

        /* Summary cards */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 36px;
        }

        .sum-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 18px 16px;
        }

        .sum-label {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 8px;
        }

        .sum-value {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #f0ede6;
          line-height: 1;
          margin-bottom: 4px;
        }

        .sum-sub { font-size: 11px; color: #444; }

        .sum-card.trend-card .sum-value {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Chart section */
        .chart-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 28px 24px;
          margin-bottom: 24px;
        }

        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .chart-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
        }

        .chart-legend {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 11px;
          color: #444;
        }

        .legend-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 4px;
        }

        /* Bar chart */
        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          height: 200px;
          margin-bottom: 12px;
        }

        .bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          gap: 6px;
          cursor: default;
        }

        .bar-val {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #444;
          text-align: center;
          min-height: 14px;
          transition: color 0.15s;
        }

        .bar-col:hover .bar-val { color: #c9a84c; }

        .bar-wrap {
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          flex: 1;
        }

        .bar {
          width: 100%;
          border-radius: 5px 5px 0 0;
          transition: opacity 0.15s;
          min-height: 3px;
        }

        .bar-col:hover .bar { opacity: 0.85; }

        .bar-day {
          font-size: 11px;
          color: #444;
          font-family: 'DM Mono', monospace;
          text-align: center;
        }

        .bar-col.today .bar-day {
          color: #c9a84c;
          font-weight: 500;
        }

        .bar-col.today .bar {
          background: #c9a84c !important;
        }

        /* Tooltip (hover) */
        .bar-col { position: relative; }

        .bar-tooltip {
          display: none;
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #1e1e1e;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 8px 12px;
          white-space: nowrap;
          font-size: 11px;
          color: #f0ede6;
          z-index: 10;
          pointer-events: none;
        }

        .bar-tooltip strong {
          display: block;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          margin-bottom: 2px;
          color: #c9a84c;
        }

        .bar-col:hover .bar-tooltip { display: block; }

        /* Y axis lines */
        .chart-y-lines {
          position: relative;
          height: 200px;
          margin-bottom: -200px;
          pointer-events: none;
        }

        .y-line {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: #181818;
        }

        /* Day breakdown table */
        .breakdown-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          overflow: hidden;
        }

        .breakdown-header {
          padding: 20px 24px;
          border-bottom: 1px solid #181818;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
        }

        .breakdown-row {
          display: grid;
          grid-template-columns: 100px 1fr 80px 80px 80px;
          align-items: center;
          padding: 14px 24px;
          border-bottom: 1px solid #131313;
          transition: background 0.1s;
          gap: 12px;
        }

        .breakdown-row:last-child { border-bottom: none; }
        .breakdown-row:hover { background: #131313; }

        .breakdown-row.header-row {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #333;
          padding-top: 10px;
          padding-bottom: 10px;
        }
        .breakdown-row.header-row:hover { background: transparent; }

        .bd-day {
          font-size: 13px;
          font-weight: 500;
          color: #888;
        }

        .bd-day.is-today { color: #c9a84c; }

        .bd-bar-wrap {
          height: 4px;
          background: #1a1a1a;
          border-radius: 2px;
          overflow: hidden;
        }

        .bd-bar-fill {
          height: 100%;
          background: #3a3a3a;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .bd-bar-fill.active { background: #c9a84c; }
        .bd-bar-fill.best { background: #c9a84c; }
        .bd-bar-fill.today-fill { background: #c9a84c; }

        .bd-min {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #888;
          text-align: right;
        }

        .bd-min.active { color: #f0ede6; }

        .bd-sessions {
          font-size: 12px;
          color: #444;
          text-align: right;
        }

        .bd-avg {
          font-size: 12px;
          color: #444;
          text-align: right;
        }

        /* States */
        .loading-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #444;
          font-size: 14px;
        }

        .error-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #e06060;
          font-size: 14px;
        }

        .empty-bar {
          opacity: 0.2;
        }

        @media (max-width: 700px) {
          .tr-body { padding: 32px 20px; }
          .nav { padding: 16px 20px; }
          .summary-grid { grid-template-columns: repeat(2, 1fr); }
          .breakdown-row { grid-template-columns: 80px 1fr 60px; }
          .bd-sessions, .bd-avg { display: none; }
        }
      `}</style>

      <div className="tr-root">
        <nav className="nav">
          <div className="nav-brand">FocusTracker</div>
          <button className="nav-back" onClick={() => router.push("/Index")}>
            ← Dashboard
          </button>
        </nav>

        <div className="tr-body">
          {loading && (
            <div className="loading-wrap">Loading trend data...</div>
          )}

          {error && (
            <div className="error-wrap">Failed to load: {error}</div>
          )}

          {trend && !loading && (
            <>
              <div className="page-header">
                <h1 className="page-title">Weekly trend</h1>
                <p className="page-sub">Your focus pattern over the past 7 days</p>
              </div>

              {/* Summary cards */}
              <div className="summary-grid">
                <div className="sum-card">
                  <div className="sum-label">This week</div>
                  <div className="sum-value">{fmtHours(trend.totalMinutesThisWeek)}</div>
                  <div className="sum-sub">{trend.totalSessionsThisWeek} sessions</div>
                </div>

                <div className="sum-card">
                  <div className="sum-label">Daily average</div>
                  <div className="sum-value">{fmtHours(Math.round(trend.dailyAverage))}</div>
                  <div className="sum-sub">{trend.activeDays} active days</div>
                </div>

                <div className="sum-card">
                  <div className="sum-label">Best day</div>
                  <div className="sum-value">{fmtHours(trend.bestDayMinutes)}</div>
                  <div className="sum-sub">{trend.bestDayLabel}</div>
                </div>

                <div className="sum-card trend-card">
                  <div className="sum-label">vs last week</div>
                  <div
                    className="sum-value"
                    style={{ color: trendColor(trend.trendDirection) }}
                  >
                    <span>{trendIcon(trend.trendDirection)}</span>
                    <span>{trend.trendPercent}%</span>
                  </div>
                  <div className="sum-sub">{trend.trendLabel}</div>
                </div>
              </div>

              {/* Bar chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">Focus minutes per day</span>
                  <div className="chart-legend">
                    <span>
                      <span
                        className="legend-dot"
                        style={{ background: "#c9a84c" }}
                      />
                      Today / active
                    </span>
                    <span>
                      <span
                        className="legend-dot"
                        style={{ background: "#2a2a2a" }}
                      />
                      No session
                    </span>
                  </div>
                </div>

                <div className="bar-chart">
                  {trend.days.map((day, i) => {
                    const heightPct = maxMinutes > 0
                      ? (day.totalMinutes / maxMinutes) * 100
                      : 0;
                    const isBest = day.totalMinutes === trend.bestDayMinutes &&
                      trend.bestDayMinutes > 0;
                    const barColor = day.isToday
                      ? "#c9a84c"
                      : day.totalMinutes > 0
                        ? isBest ? "#c9a84c" : "#2e2e2e"
                        : "#1a1a1a";

                    return (
                      <div
                        key={i}
                        className={`bar-col ${day.isToday ? "today" : ""}`}
                      >
                        {/* Tooltip */}
                        <div className="bar-tooltip">
                          <strong>{day.fullLabel}</strong>
                          {fmtHours(day.totalMinutes)} focus
                          {day.sessionCount > 0 && (
                            <> · {day.sessionCount} session{day.sessionCount !== 1 ? "s" : ""}</>
                          )}
                          {day.avgSessionMinutes > 0 && (
                            <> · avg {Math.round(day.avgSessionMinutes)}m</>
                          )}
                        </div>

                        <div className="bar-val">
                          {day.totalMinutes > 0 ? fmtHours(day.totalMinutes) : ""}
                        </div>

                        <div className="bar-wrap">
                          <div
                            className={`bar ${day.totalMinutes === 0 ? "empty-bar" : ""}`}
                            style={{
                              height: `${Math.max(heightPct, day.totalMinutes > 0 ? 4 : 1)}%`,
                              background: barColor,
                            }}
                          />
                        </div>

                        <div className="bar-day">{day.dayLabel}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day breakdown table */}
              <div className="breakdown-card">
                <div className="breakdown-header">Day breakdown</div>

                <div className="breakdown-row header-row">
                  <span>Day</span>
                  <span>Focus time</span>
                  <span style={{ textAlign: "right" }}>Minutes</span>
                  <span style={{ textAlign: "right" }}>Sessions</span>
                  <span style={{ textAlign: "right" }}>Avg/session</span>
                </div>

                {trend.days.map((day, i) => {
                  const widthPct = maxMinutes > 0
                    ? (day.totalMinutes / maxMinutes) * 100
                    : 0;
                  const isBest = day.totalMinutes === trend.bestDayMinutes &&
                    trend.bestDayMinutes > 0;

                  return (
                    <div key={i} className="breakdown-row">
                      <span className={`bd-day ${day.isToday ? "is-today" : ""}`}>
                        {day.fullLabel}
                        {day.isToday ? " ·" : ""}
                        {isBest && !day.isToday ? " ★" : ""}
                      </span>

                      <div className="bd-bar-wrap">
                        <div
                          className={`bd-bar-fill ${
                            day.totalMinutes > 0
                              ? isBest || day.isToday
                                ? "best"
                                : "active"
                              : ""
                          }`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>

                      <span
                        className={`bd-min ${day.totalMinutes > 0 ? "active" : ""}`}
                      >
                        {day.totalMinutes > 0 ? `${day.totalMinutes}m` : "—"}
                      </span>

                      <span className="bd-sessions">
                        {day.sessionCount > 0 ? day.sessionCount : "—"}
                      </span>

                      <span className="bd-avg">
                        {day.avgSessionMinutes > 0
                          ? `${Math.round(day.avgSessionMinutes)}m`
                          : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
