"use client";

import NavBar from "../../components/NavBar";
import { useAuth } from "../../hooks/useAuth";
import { api }     from "../../lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TagStat = {
  tagName: string;
  tagColor: string | null;
  totalSessions: number;
  totalMinutes: number;
  percentOfTotal: number;
};

export default function TagStatsPage() {
  const { token, ready } = useAuth();
  const router = useRouter();

  const [stats, setStats]     = useState<TagStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !token) return;
    api.get<TagStat[]>("/tags/stats", token)
      .then((data) => setStats(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready, token]);

  if (!ready) return null;

  const fmtHours = (m: number) => {
    if (m === 0) return "0m";
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  };

  const totalMinutes = stats.reduce((s, t) => s + t.totalMinutes, 0);
  const totalSessions = stats.reduce((s, t) => s + t.totalSessions, 0);

  // Assign a fallback colour for untagged or null-colour entries
  const tagColor = (stat: TagStat) => stat.tagColor ?? "#3a3a3a";

  // Sort: tagged items first (sorted by minutes desc), untagged last
  const sorted = [...stats].sort((a, b) => {
    if (a.tagName === "untagged") return 1;
    if (b.tagName === "untagged") return -1;
    return b.totalMinutes - a.totalMinutes;
  });

  // Donut chart geometry
  const SIZE   = 200;
  const CX     = SIZE / 2;
  const CY     = SIZE / 2;
  const R      = 80;
  const INNER  = 50;
  const CIRCUM = 2 * Math.PI * R;

  // Build donut segments
  type Segment = { stat: TagStat; offset: number; dash: number; color: string };
  const segments: Segment[] = [];
  let runningOffset = 0; // start at top (rotated -90deg via SVG transform)

  for (const stat of sorted) {
    const dash   = (stat.percentOfTotal / 100) * CIRCUM;
    const gap    = CIRCUM - dash;
    segments.push({ stat, offset: runningOffset, dash, color: tagColor(stat) });
    runningOffset += dash;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ts-root { min-height: 100vh; background: #0a0a0a; color: #f0ede6; font-family: 'DM Sans', sans-serif; }
        .ts-body { max-width: 860px; margin: 0 auto; padding: 48px 40px; }

        .page-header { margin-bottom: 40px; }
        .page-title { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 6px; }
        .page-sub { font-size: 14px; color: #555; }

        /* Summary strip */
        .summary-strip {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;
        }
        .sum-card {
          background: #111; border: 1px solid #1e1e1e; border-radius: 12px; padding: 18px 16px;
        }
        .sum-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #444; margin-bottom: 6px; }
        .sum-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #f0ede6; line-height: 1; }
        .sum-sub { font-size: 11px; color: #444; margin-top: 4px; }

        /* Main layout: donut left, list right */
        .main-layout {
          display: grid; grid-template-columns: 260px 1fr; gap: 24px; margin-bottom: 24px;
          align-items: start;
        }

        /* Donut */
        .donut-card {
          background: #111; border: 1px solid #1e1e1e; border-radius: 16px; padding: 24px;
        }
        .donut-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; margin-bottom: 20px; color: #f0ede6; }
        .donut-wrap { display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .donut-svg { overflow: visible; }
        .donut-center { text-anchor: middle; dominant-baseline: middle; }
        .donut-center-val { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; fill: #f0ede6; }
        .donut-center-sub { font-family: 'DM Sans', sans-serif; font-size: 10px; fill: #555; }

        /* Donut legend */
        .donut-legend { display: flex; flex-direction: column; gap: 6px; }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888; cursor: pointer; transition: color 0.15s; padding: 2px 0; }
        .legend-item:hover { color: #f0ede6; }
        .legend-item.active { color: #f0ede6; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .legend-pct { font-family: 'DM Mono', monospace; font-size: 11px; margin-left: auto; color: #444; }
        .legend-item.active .legend-pct { color: #c9a84c; }

        /* Tag breakdown list */
        .breakdown-card {
          background: #111; border: 1px solid #1e1e1e; border-radius: 16px; overflow: hidden;
        }
        .breakdown-header {
          padding: 18px 24px; border-bottom: 1px solid #181818;
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
        }

        .breakdown-row {
          display: grid; grid-template-columns: 140px 1fr 72px 56px; align-items: center;
          padding: 14px 24px; border-bottom: 1px solid #131313; gap: 16px;
          transition: background 0.1s; cursor: default;
        }
        .breakdown-row:last-child { border-bottom: none; }
        .breakdown-row:hover { background: #131313; }
        .breakdown-row.hovered { background: #131313; }

        .breakdown-row.col-header {
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #2a2a2a;
          padding-top: 8px; padding-bottom: 8px;
        }
        .breakdown-row.col-header:hover { background: transparent; }

        .bd-tag { display: flex; align-items: center; gap: 8px; }
        .bd-tag-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .bd-tag-name { font-size: 13px; font-weight: 500; color: #f0ede6; }
        .bd-tag-name.untagged { color: #444; font-style: italic; }

        .bd-bar-wrap { height: 5px; background: #1a1a1a; border-radius: 3px; overflow: hidden; }
        .bd-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }

        .bd-time { font-family: 'DM Mono', monospace; font-size: 12px; color: #c9a84c; text-align: right; }
        .bd-time.untagged { color: #444; }

        .bd-pct { font-family: 'DM Mono', monospace; font-size: 11px; color: #555; text-align: right; }

        /* Empty state */
        .empty-card {
          background: #0d0d0d; border: 1px dashed #1e1e1e; border-radius: 16px;
          padding: 60px; text-align: center;
        }
        .empty-icon { font-size: 32px; margin-bottom: 12px; display: block; }
        .empty-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #444; margin-bottom: 8px; }
        .empty-sub { font-size: 13px; color: #333; margin-bottom: 20px; }
        .btn-goto-tags {
          background: transparent; border: 1px solid #222; border-radius: 8px;
          padding: 10px 20px; font-size: 13px; font-family: 'DM Sans', sans-serif;
          color: #888; cursor: pointer; transition: all 0.15s;
        }
        .btn-goto-tags:hover { border-color: #c9a84c; color: #c9a84c; }

        .error-banner {
          background: rgba(220,80,80,0.08); border: 1px solid rgba(220,80,80,0.2);
          border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #e06060; margin-bottom: 20px;
        }
        .loading-wrap { display: flex; align-items: center; justify-content: center; min-height: 400px; font-size: 14px; color: #444; }

        @media (max-width: 700px) {
          .ts-body { padding: 32px 20px; }
          .main-layout { grid-template-columns: 1fr; }
          .summary-strip { grid-template-columns: repeat(3, 1fr); }
          .breakdown-row { grid-template-columns: 120px 1fr 60px; }
          .bd-pct { display: none; }
        }
      `}</style>

      <div className="ts-root">
        <NavBar />

        <div className="ts-body">
          {loading && <div className="loading-wrap">Loading tag stats...</div>}
          {error   && <div className="error-banner">{error}</div>}

          {!loading && !error && (
            <>
              <div className="page-header">
                <h1 className="page-title">Tag breakdown</h1>
                <p className="page-sub">How your focus time is split across categories</p>
              </div>

              {stats.length === 0 ? (
                <div className="empty-card">
                  <span className="empty-icon">🏷️</span>
                  <div className="empty-title">No tagged sessions yet</div>
                  <div className="empty-sub">
                    Create tags and start sessions with them to see your breakdown here.
                  </div>
                  <button className="btn-goto-tags" onClick={() => router.push("/Tags")}>
                    Manage tags →
                  </button>
                </div>
              ) : (
                <>
                  {/* Summary strip */}
                  <div className="summary-strip">
                    <div className="sum-card">
                      <div className="sum-label">Total focus time</div>
                      <div className="sum-value">{fmtHours(totalMinutes)}</div>
                      <div className="sum-sub">all sessions</div>
                    </div>
                    <div className="sum-card">
                      <div className="sum-label">Total sessions</div>
                      <div className="sum-value">{totalSessions}</div>
                      <div className="sum-sub">completed</div>
                    </div>
                    <div className="sum-card">
                      <div className="sum-label">Tag categories</div>
                      <div className="sum-value">{stats.filter(s => s.tagName !== "untagged").length}</div>
                      <div className="sum-sub">{stats.some(s => s.tagName === "untagged") ? "+ untagged" : "no untagged"}</div>
                    </div>
                  </div>

                  <div className="main-layout">
                    {/* Donut chart */}
                    <div className="donut-card">
                      <div className="donut-title">Focus time share</div>
                      <div className="donut-wrap">
                        <svg
                          className="donut-svg"
                          width={SIZE} height={SIZE}
                          viewBox={`0 0 ${SIZE} ${SIZE}`}
                        >
                          <g transform={`rotate(-90, ${CX}, ${CY})`}>
                            {/* Background track */}
                            <circle
                              cx={CX} cy={CY} r={R}
                              fill="none"
                              stroke="#1a1a1a"
                              strokeWidth={R - INNER}
                            />
                            {/* Segments */}
                            {segments.map((seg, i) => (
                              <circle
                                key={i}
                                cx={CX} cy={CY} r={R}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={hovered === seg.stat.tagName ? R - INNER + 4 : R - INNER}
                                strokeDasharray={`${seg.dash} ${CIRCUM - seg.dash}`}
                                strokeDashoffset={-seg.offset}
                                style={{ transition: "stroke-width 0.15s, opacity 0.15s", cursor: "pointer",
                                  opacity: hovered && hovered !== seg.stat.tagName ? 0.35 : 1 }}
                                onMouseEnter={() => setHovered(seg.stat.tagName)}
                                onMouseLeave={() => setHovered(null)}
                              />
                            ))}
                          </g>
                          {/* Center label */}
                          <text x={CX} y={CY - 8} className="donut-center-val" textAnchor="middle">
                            {hovered
                              ? fmtHours(sorted.find(s => s.tagName === hovered)?.totalMinutes ?? 0)
                              : fmtHours(totalMinutes)}
                          </text>
                          <text x={CX} y={CY + 10} className="donut-center-sub" textAnchor="middle">
                            {hovered ? hovered : "total"}
                          </text>
                        </svg>
                      </div>

                      {/* Legend */}
                      <div className="donut-legend">
                        {sorted.map((s) => (
                          <div
                            key={s.tagName}
                            className={`legend-item ${hovered === s.tagName ? "active" : ""}`}
                            onMouseEnter={() => setHovered(s.tagName)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <span className="legend-dot" style={{ background: tagColor(s) }} />
                            <span>{s.tagName}</span>
                            <span className="legend-pct">{s.percentOfTotal}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Breakdown list */}
                    <div className="breakdown-card">
                      <div className="breakdown-header">Per-tag breakdown</div>

                      <div className="breakdown-row col-header">
                        <span>Tag</span>
                        <span>Share</span>
                        <span style={{ textAlign: "right" }}>Time</span>
                        <span style={{ textAlign: "right" }}>%</span>
                      </div>

                      {sorted.map((s) => {
                        const maxMinutes = sorted[0]?.totalMinutes ?? 1;
                        const barWidth   = maxMinutes > 0 ? (s.totalMinutes / maxMinutes) * 100 : 0;
                        const isUntagged = s.tagName === "untagged";
                        return (
                          <div
                            key={s.tagName}
                            className={`breakdown-row ${hovered === s.tagName ? "hovered" : ""}`}
                            onMouseEnter={() => setHovered(s.tagName)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <div className="bd-tag">
                              <span className="bd-tag-dot" style={{ background: tagColor(s) }} />
                              <span className={`bd-tag-name ${isUntagged ? "untagged" : ""}`}>
                                {s.tagName}
                              </span>
                            </div>
                            <div className="bd-bar-wrap">
                              <div
                                className="bd-bar-fill"
                                style={{ width: `${barWidth}%`, background: tagColor(s),
                                  opacity: hovered && hovered !== s.tagName ? 0.3 : 1 }}
                              />
                            </div>
                            <span className={`bd-time ${isUntagged ? "untagged" : ""}`}>
                              {fmtHours(s.totalMinutes)}
                            </span>
                            <span className="bd-pct">{s.percentOfTotal}%</span>
                          </div>
                        );
                      })}
                    </div>
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
