"use client";

import NavBar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";
import { api }     from "../lib/api";
import { useEffect, useRef, useState } from "react";
import { SessionDetailModal } from "../components/SessionDetailModal";
import { useRouter } from "next/navigation";

type FocusSession = {
  id: number;
  startTime: string;
  endTime: string;
  duration: number;
  note?: string;
  tag?: { id: number; name: string; color: string | null };
};

type Tag = {
  id: number;
  name: string;
  color: string | null;
};

export default function Dashboard() {
  const { token, ready } = useAuth();
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [dailyMinutes, setDailyMinutes] = useState(0);
  const [dailySessions, setDailySessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [goalTarget, setGoalTarget] = useState<number | null>(null);
  const [goalProgress, setGoalProgress] = useState(0);

  const [monthlyMinutes, setMonthlyMinutes] = useState(0);
  const [monthlySessions, setMonthlySessions] = useState(0);

  // Weekly stats
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [weeklySessions, setWeeklySessions] = useState(0);

  const [history, setHistory] = useState<FocusSession[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<FocusSession[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [tag, setTag] = useState("");
  const [openSessionId, setOpenSessionId] = useState<number | null>(null);

  const [stoppedSessionId, setStoppedSessionId] = useState<number | null>(null);
  const [stoppedDuration, setStoppedDuration] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!startTime) return;
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startTime]);

  const refreshStats = async (t: string) => {
    try {
      const [daily, streak, hist, monthly, weekly, tags] = await Promise.all([
        api.get<any>("/focus/stats/daily",   t),
        api.get<any>("/focus/stats/streak",  t),
        api.get<any>("/focus/history",       t),
        api.get<any>("/focus/stats/monthly", t),
        api.get<any>("/focus/stats/weekly",  t),
        api.get<any>("/tags",                t).catch(() => []),
      ]);
      setDailyMinutes(daily.totalMinutes ?? 0);
      setDailySessions(daily.totalSessions ?? 0);
      if (daily.goalSet) {
        setGoalTarget(daily.targetMinutes);
        setGoalProgress(daily.progressPercent ?? 0);
      }
      setStreakDays(streak.streakDays ?? streak.streak ?? 0);
      const histList = Array.isArray(hist) ? hist.slice(0, 8) : [];
      setHistory(histList);
      setFilteredHistory(histList);
      setMonthlyMinutes(monthly.totalMinutes ?? 0);
      setMonthlySessions(monthly.totalSessions ?? 0);

      setWeeklyMinutes(weekly.totalMinutes ?? 0);
      setWeeklySessions(weekly.totalSessions ?? 0);
      setAvailableTags(Array.isArray(tags) ? tags : []);
    } catch (e) {
      console.error("Stats error", e);
    }
  };

  useEffect(() => {
    if (ready && token) refreshStats(token);
  }, [ready, token]);

  const filterByTag = async (tagName: string | null) => {
    if (!token) return;
    setActiveFilter(tagName);
    setFilterLoading(true);
    try {
      const path = tagName
        ? `/focus/history?tag=${encodeURIComponent(tagName)}`
        : "/focus/history";
      const data = await api.get<FocusSession[]>(path, token);
      setFilteredHistory(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setFilterLoading(false);
    }
  };

  const startSession = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const path = tag.trim()
        ? `/focus/start?tag=${encodeURIComponent(tag.trim())}`
        : "/focus/start";
      const data = await api.post<any>(path, token);
      setSessionId(data.id);
      setStartTime(Date.now());
      setElapsedSeconds(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async () => {
    if (!token || !sessionId) return;
    setLoading(true);
    try {
      await api.put(`/focus/stop/${sessionId}`, token);
      setStoppedSessionId(sessionId);
      setStoppedDuration(Math.floor(elapsedSeconds / 60));
      setNoteText("");
      setNoteSaved(false);
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

  const saveNote = async () => {
    if (!token || !stoppedSessionId || !noteText.trim()) return;
    setNoteSaving(true);
    try {
      await api.put(`/focus/${stoppedSessionId}/note`, token, { note: noteText.trim() });
      setNoteSaved(true);
      const updater = (prev: FocusSession[]) =>
        prev.map((h) => h.id === stoppedSessionId ? { ...h, note: noteText.trim() } : h);
      setHistory(updater);
      setFilteredHistory(updater);
    } catch (e) {
      console.error(e);
    } finally {
      setNoteSaving(false);
    }
  };

  const dismissNote = () => {
    setStoppedSessionId(null);
    setNoteText("");
    setNoteSaved(false);
  };

  const openEdit = (session: FocusSession) => {
    setEditingId(session.id);
    setEditDraft(session.note ?? "");
  };

  const saveEditedNote = async (sid: number) => {
    if (!token) return;
    setEditSaving(true);
    try {
      if (editDraft.trim() === "") {
        await api.del(`/focus/${sid}/note`, token);
        const updater = (prev: FocusSession[]) =>
          prev.map((h) => h.id === sid ? { ...h, note: undefined } : h);
        setHistory(updater);
        setFilteredHistory(updater);
      } else {
        await api.put(`/focus/${sid}/note`, token, { note: editDraft.trim() });
        const updater = (prev: FocusSession[]) =>
          prev.map((h) => h.id === sid ? { ...h, note: editDraft.trim() } : h);
        setHistory(updater);
        setFilteredHistory(updater);
      }
      setEditingId(null);
      setEditDraft("");
    } catch (e) {
      console.error(e);
    } finally {
      setEditSaving(false);
    }
  };

  const deleteNote = async (sid: number) => {
    if (!token) return;
    setDeletingId(sid);
    try {
      await api.del(`/focus/${sid}/note`, token);
      const updater = (prev: FocusSession[]) =>
        prev.map((h) => h.id === sid ? { ...h, note: undefined } : h);
      setHistory(updater);
      setFilteredHistory(updater);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const fmtHours = (m: number) => {
    if (m === 0) return "0m";
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  };

  if (!ready) return null;

  const currentMonthName = new Date().toLocaleString("en-US", { month: "long" });
  const isRunning = !!sessionId;
  const ringPct = Math.min(100, (elapsedSeconds / (25 * 60)) * 100);
  const circumference = 2 * Math.PI * 88;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .dash-root { min-height: 100vh; background: #0a0a0a; color: #f0ede6; font-family: 'DM Sans', sans-serif; display: flex; flex-direction: column; }
        .dash-body { flex: 1; display: grid; grid-template-columns: 1fr 380px; }
        .dash-main { padding: 48px 40px; border-right: 1px solid #181818; }
        .dash-side { padding: 48px 32px; }
        .stats-top { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; }
        .monthly-card { background: #111; border: 1px solid #1e1e1e; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; transition: border-color 0.15s; cursor: pointer; }
        .monthly-card:hover { border-color: #2a2a2a; }
        .monthly-left { display: flex; flex-direction: column; gap: 3px; }
        .monthly-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #444; }
        .monthly-value { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #f0ede6; line-height: 1; }
        .monthly-sub { font-size: 12px; color: #444; margin-top: 2px; }
        .monthly-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
        .monthly-sessions-val { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #888; }
        .monthly-sessions-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #333; }
        .monthly-arrow { font-size: 12px; color: #2a2a2a; margin-top: 6px; transition: color 0.15s; }
        .monthly-card:hover .monthly-arrow { color: #c9a84c; }

        /* Weekly + Monthly side by side */
        .summary-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .summary-row .monthly-card { margin-bottom: 0; }
        .weekly-card {
          background: #111; border: 1px solid #1e1e1e; border-radius: 12px;
          padding: 18px 20px; display: flex; align-items: center; justify-content: space-between;
          transition: border-color 0.15s; cursor: pointer;
        }
        .weekly-card:hover { border-color: #2a2a2a; }
        .weekly-card:hover .monthly-arrow { color: #c9a84c; }
        .stat-card { background: #111; border: 1px solid #1e1e1e; border-radius: 12px; padding: 20px 16px; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #f0ede6; margin-bottom: 4px; }
        .stat-name { font-size: 11px; color: #444; letter-spacing: 0.08em; text-transform: uppercase; }
        .goal-section { background: #111; border: 1px solid #1e1e1e; border-radius: 12px; padding: 20px; margin-bottom: 32px; }
        .goal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .goal-title { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #555; }
        .goal-pct { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #c9a84c; }
        .goal-bar-bg { height: 4px; background: #1e1e1e; border-radius: 2px; overflow: hidden; }
        .goal-bar-fill { height: 100%; background: #c9a84c; border-radius: 2px; transition: width 0.6s ease; }
        .goal-desc { margin-top: 8px; font-size: 12px; color: #444; }
        .note-panel { background: #111; border: 1px solid #2a2a2a; border-radius: 14px; padding: 20px; margin-bottom: 20px; animation: slideDown 0.2s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .note-panel-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
        .note-panel-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: #f0ede6; margin-bottom: 3px; }
        .note-panel-sub { font-size: 12px; color: #555; }
        .note-dismiss { background: transparent; border: none; color: #333; font-size: 18px; cursor: pointer; line-height: 1; padding: 0 2px; transition: color 0.15s; }
        .note-dismiss:hover { color: #888; }
        .note-textarea { width: 100%; background: #0a0a0a; border: 1px solid #222; border-radius: 8px; padding: 12px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #f0ede6; outline: none; resize: none; line-height: 1.6; transition: border-color 0.2s; min-height: 80px; }
        .note-textarea:focus { border-color: #c9a84c; }
        .note-textarea::placeholder { color: #2a2a2a; }
        .note-char-count { text-align: right; font-size: 10px; color: #2a2a2a; margin-top: 4px; margin-bottom: 10px; font-family: 'DM Mono', monospace; }
        .note-char-count.warn { color: #c9a84c; }
        .note-actions { display: flex; gap: 8px; align-items: center; }
        .btn-save-note { background: #c9a84c; color: #0a0a0a; border: none; border-radius: 7px; padding: 9px 18px; font-size: 13px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: opacity 0.15s; }
        .btn-save-note:hover { opacity: 0.88; }
        .btn-save-note:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-skip-note { background: transparent; border: 1px solid #222; border-radius: 7px; padding: 9px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #555; cursor: pointer; transition: all 0.15s; }
        .btn-skip-note:hover { border-color: #444; color: #888; }
        .note-saved-msg { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #4ade80; margin-left: 4px; }
        .timer-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 48px; }
        .timer-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #555; margin-bottom: 32px; }
        .ring-wrap { position: relative; margin-bottom: 32px; }
        .ring-svg { transform: rotate(-90deg); }
        .ring-bg { fill: none; stroke: #1a1a1a; stroke-width: 3; }
        .ring-progress { fill: none; stroke: #c9a84c; stroke-width: 3; stroke-linecap: round; transition: stroke-dashoffset 0.5s ease; }
        .ring-running .ring-progress { stroke: #e8b84b; }
        .timer-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
        .timer-digits { font-family: 'DM Mono', monospace; font-size: 42px; font-weight: 500; letter-spacing: -0.02em; line-height: 1; color: #f0ede6; }
        .timer-sub { font-size: 11px; color: #444; margin-top: 6px; letter-spacing: 0.08em; }
        .tag-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .tag-input { background: #111; border: 1px solid #222; border-radius: 6px; padding: 9px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #f0ede6; outline: none; width: 180px; transition: border-color 0.2s; }
        .tag-input:focus { border-color: #c9a84c; }
        .tag-input::placeholder { color: #333; }
        .tag-label { font-size: 12px; color: #555; }
        .cta-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 200px; padding: 16px 32px; border-radius: 100px; border: none; font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .cta-btn.start { background: #c9a84c; color: #0a0a0a; }
        .cta-btn.start:hover { background: #d4b35e; }
        .cta-btn.stop { background: transparent; border: 2px solid #e06060; color: #e06060; }
        .cta-btn.stop:hover { background: rgba(220,96,96,0.1); }
        .cta-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .side-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #555; margin-bottom: 20px; }
        .filter-section { margin-bottom: 16px; }
        .filter-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #333; margin-bottom: 8px; display: block; }
        .pills-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-family: 'DM Sans', sans-serif; font-weight: 500; border: 1px solid #222; background: transparent; color: #555; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .pill:hover { border-color: #444; color: #888; }
        .pill.active { background: #1e1e1e; border-color: #c9a84c; color: #c9a84c; }
        .pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .filter-loading { font-size: 11px; color: #333; padding: 4px 0; font-style: italic; }
        .history-list { display: flex; flex-direction: column; gap: 10px; }
        .history-item { display: flex; flex-direction: column; background: #111; border: 1px solid #1e1e1e; border-radius: 10px; padding: 14px 16px; transition: border-color 0.15s; position: relative; }
        .history-item:hover { border-color: #2a2a2a; }
        .history-item-top { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        .history-date { font-size: 13px; color: #888; }
        .history-dur { font-family: 'DM Mono', monospace; font-size: 14px; color: #c9a84c; font-weight: 500; }
        .session-tag-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 100px; font-size: 10px; font-weight: 500; border: 1px solid #222; color: #555; cursor: pointer; transition: border-color 0.15s; margin-top: 5px; align-self: flex-start; background: transparent; }
        .session-tag-badge:hover { border-color: #444; color: #888; }
        .session-tag-badge.filtered { border-color: #c9a84c; color: #c9a84c; }
        .tag-badge-dot { width: 5px; height: 5px; border-radius: 50%; }
        .history-note-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #1a1a1a; }
        .history-note-text { font-size: 11px; color: #555; font-style: italic; line-height: 1.5; flex: 1; }
        .note-action-btns { display: flex; gap: 4px; flex-shrink: 0; opacity: 0; transition: opacity 0.15s; }
        .history-item:hover .note-action-btns { opacity: 1; }
        .btn-note-action { background: transparent; border: 1px solid #222; border-radius: 5px; padding: 3px 8px; font-size: 10px; font-family: 'DM Sans', sans-serif; color: #444; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-note-action:hover { border-color: #444; color: #888; }
        .btn-note-action.del:hover { border-color: #e06060; color: #e06060; }
        .btn-note-action:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-add-note { margin-top: 8px; background: transparent; border: 1px dashed #222; border-radius: 5px; padding: 5px 10px; font-size: 11px; font-family: 'DM Sans', sans-serif; color: #333; cursor: pointer; width: 100%; text-align: left; transition: all 0.15s; opacity: 0; }
        .history-item:hover .btn-add-note { opacity: 1; }
        .btn-add-note:hover { border-color: #c9a84c; color: #c9a84c; }
        .inline-edit-wrap { margin-top: 8px; padding-top: 8px; border-top: 1px solid #1a1a1a; width: 100%; }
        .inline-edit-textarea { width: 100%; background: #0a0a0a; border: 1px solid #c9a84c; border-radius: 6px; padding: 8px 10px; font-size: 12px; font-family: 'DM Sans', sans-serif; color: #f0ede6; outline: none; resize: none; line-height: 1.5; min-height: 60px; }
        .inline-edit-actions { display: flex; gap: 6px; margin-top: 6px; align-items: center; }
        .btn-inline-save { background: #c9a84c; color: #0a0a0a; border: none; border-radius: 5px; padding: 5px 12px; font-size: 11px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: opacity 0.15s; }
        .btn-inline-save:hover { opacity: 0.88; }
        .btn-inline-save:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-inline-cancel { background: transparent; border: 1px solid #222; border-radius: 5px; padding: 5px 10px; font-size: 11px; font-family: 'DM Sans', sans-serif; color: #555; cursor: pointer; transition: all 0.15s; }
        .btn-inline-cancel:hover { border-color: #444; color: #888; }
        .inline-edit-hint { font-size: 10px; color: #333; margin-left: auto; }
        .empty-state { text-align: center; padding: 40px 20px; color: #333; font-size: 14px; }
        .quick-links { display: flex; flex-direction: column; gap: 8px; margin-top: 32px; }
        .quick-link { display: flex; align-items: center; justify-content: space-between; background: #111; border: 1px solid #1e1e1e; border-radius: 10px; padding: 14px 16px; font-size: 14px; color: #888; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
        .quick-link:hover { border-color: #c9a84c; color: #f0ede6; }
        .quick-link-arrow { color: #333; transition: color 0.15s; }
        .quick-link:hover .quick-link-arrow { color: #c9a84c; }
        @media (max-width: 900px) {
          .dash-body { grid-template-columns: 1fr; }
          .dash-main { border-right: none; border-bottom: 1px solid #181818; padding: 32px 24px; }
          .dash-side { padding: 32px 24px; }
          .stats-top { grid-template-columns: repeat(3, 1fr); }
          .summary-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dash-root">
        <NavBar />

        {/* Session detail modal */}
        {openSessionId !== null && (
          <SessionDetailModal
            sessionId={openSessionId}
            onClose={() => setOpenSessionId(null)}
            onNoteUpdated={(id, note) => {
              const updater = (prev: FocusSession[]) =>
                prev.map((h) => h.id === id ? { ...h, note } : h);
              setHistory(updater);
              setFilteredHistory(updater);
            }}
          />
        )}

        <div className="dash-body">
          <main className="dash-main">
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

            <div className="summary-row">
              {/* Weekly card */}
              <div className="weekly-card" onClick={() => router.push("/Stats/trend")} title="View weekly trend">
                <div className="monthly-left">
                  <span className="monthly-label">This week</span>
                  <span className="monthly-value">{fmtHours(weeklyMinutes)}</span>
                  <span className="monthly-sub">focus this week</span>
                </div>
                <div className="monthly-right">
                  <span className="monthly-sessions-val">{weeklySessions}</span>
                  <span className="monthly-sessions-label">sessions</span>
                  <span className="monthly-arrow">View trend →</span>
                </div>
              </div>

              {/* Monthly card */}
              <div className="monthly-card" onClick={() => router.push("/Stats/trend")} title="View weekly trend">
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
            </div>

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

            {stoppedSessionId !== null && (
              <div className="note-panel">
                <div className="note-panel-header">
                  <div>
                    <div className="note-panel-title">
                      {noteSaved ? "✓ Note saved" : "Session complete"}
                    </div>
                    <div className="note-panel-sub">
                      {stoppedDuration > 0
                        ? `${stoppedDuration} min · what did you work on?`
                        : "What did you work on?"}
                    </div>
                  </div>
                  <button className="note-dismiss" onClick={dismissNote}>×</button>
                </div>
                {!noteSaved ? (
                  <>
                    <textarea
                      className="note-textarea"
                      placeholder="e.g. Finished chapter 3, debugged the auth flow..."
                      value={noteText}
                      maxLength={500}
                      onChange={(e) => setNoteText(e.target.value)}
                      autoFocus
                    />
                    <div className={`note-char-count ${noteText.length > 420 ? "warn" : ""}`}>
                      {noteText.length} / 500
                    </div>
                    <div className="note-actions">
                      <button className="btn-save-note" disabled={noteSaving || !noteText.trim()} onClick={saveNote}>
                        {noteSaving ? "Saving..." : "Save note"}
                      </button>
                      <button className="btn-skip-note" onClick={dismissNote}>Skip</button>
                    </div>
                  </>
                ) : (
                  <div className="note-actions">
                    <span className="note-saved-msg">
                      ✓ &ldquo;{noteText.length > 60 ? noteText.slice(0, 60) + "…" : noteText}&rdquo;
                    </span>
                    <button className="btn-skip-note" onClick={dismissNote}>Dismiss</button>
                  </div>
                )}
              </div>
            )}

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

          <aside className="dash-side">
            <div className="side-title">Recent sessions</div>

            {availableTags.length > 0 && (
              <div className="filter-section">
                <span className="filter-label">Filter by tag</span>
                <div className="pills-row">
                  <button
                    className={`pill ${activeFilter === null ? "active" : ""}`}
                    onClick={() => filterByTag(null)}
                  >
                    All
                  </button>
                  {availableTags.map((t) => (
                    <button
                      key={t.id}
                      className={`pill ${activeFilter === t.name ? "active" : ""}`}
                      onClick={() => filterByTag(t.name)}
                    >
                      {t.color && <span className="pill-dot" style={{ background: t.color }} />}
                      {t.name}
                    </button>
                  ))}
                </div>
                {filterLoading && <div className="filter-loading">Loading...</div>}
              </div>
            )}

            {filteredHistory.length === 0 && !filterLoading ? (
              <div className="empty-state">
                {activeFilter
                  ? `No sessions tagged "${activeFilter}"`
                  : "No sessions yet. Start your first focus block."}
              </div>
            ) : (
              <div className="history-list">
                {filteredHistory.map((h) => (
                  <div key={h.id} className="history-item">
                    <div
                      className="history-item-top"
                      style={{ cursor: "pointer" }}
                      onClick={() => setOpenSessionId(h.id)}
                      title="View session details"
                    >
                      <span className="history-date">{formatDate(h.startTime)}</span>
                      <span className="history-dur">{h.duration} min</span>
                    </div>
                    {h.tag && (
                      <button
                        className={`session-tag-badge ${activeFilter === h.tag.name ? "filtered" : ""}`}
                        onClick={() => filterByTag(activeFilter === h.tag!.name ? null : h.tag!.name)}
                        title={activeFilter === h.tag.name ? "Clear filter" : `Filter by ${h.tag.name}`}
                      >
                        {h.tag.color && (
                          <span className="tag-badge-dot" style={{ background: h.tag.color }} />
                        )}
                        {h.tag.name}
                      </button>
                    )}
                    {editingId === h.id ? (
                      <div className="inline-edit-wrap">
                        <textarea
                          className="inline-edit-textarea"
                          value={editDraft}
                          maxLength={500}
                          autoFocus
                          onChange={(e) => setEditDraft(e.target.value)}
                          placeholder="What did you work on? (leave empty to delete)"
                        />
                        <div className="inline-edit-actions">
                          <button className="btn-inline-save" disabled={editSaving} onClick={() => saveEditedNote(h.id)}>
                            {editSaving ? "Saving..." : "Save"}
                          </button>
                          <button className="btn-inline-cancel" onClick={() => { setEditingId(null); setEditDraft(""); }}>
                            Cancel
                          </button>
                          <span className="inline-edit-hint">
                            {editDraft.length}/500
                            {editDraft.trim() === "" && h.note ? " · will delete note" : ""}
                          </span>
                        </div>
                      </div>
                    ) : h.note ? (
                      <div className="history-note-row">
                        <span className="history-note-text">{h.note}</span>
                        <div className="note-action-btns">
                          <button className="btn-note-action" onClick={() => openEdit(h)}>Edit</button>
                          <button
                            className="btn-note-action del"
                            disabled={deletingId === h.id}
                            onClick={() => deleteNote(h.id)}
                          >
                            {deletingId === h.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn-add-note" onClick={() => openEdit(h)}>
                        + Add note
                      </button>
                    )}
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
