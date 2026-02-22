"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type FocusSession = {
  id: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

export default function Dashboard() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [token, setToken] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [dailyMinutes, setDailyMinutes] = useState(0);
  const [dailySessions, setDailySessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [history, setHistory] = useState<FocusSession[]>([]);

  const [loading, setLoading] = useState(false);

  /* 🔐 Load JWT */
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) router.push("/login");
    else setToken(t);
  }, [router]);

  /* ⏱ Timer */
  useEffect(() => {
    if (!startTime) return;

    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime]);

  /* 🔁 Refresh stats (single source of truth) */
  const refreshStats = async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const daily = await fetch(
      "http://localhost:8080/api/focus/stats/daily",
      { headers }
    ).then(r => r.json());

    setDailyMinutes(daily.totalMinutes);
    setDailySessions(daily.totalSessions);

    const streak = await fetch(
      "http://localhost:8080/api/focus/stats/streak",
      { headers }
    ).then(r => r.json());

    setStreakDays(streak.streakDays);

    const history = await fetch(
      "http://localhost:8080/api/focus/history",
      { headers }
    ).then(r => r.json());

    setHistory(history);
  };

  /* 📊 Load stats on page load */
  useEffect(() => {
    if (token) refreshStats();
  }, [token]);

  /* ▶️ Start session */
  const startSession = async () => {
    if (!token) return;
    setLoading(true);

    const res = await fetch("http://localhost:8080/api/focus/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setSessionId(data.id);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    setLoading(false);
  };

  /* ⏹ Stop session */
  const stopSession = async () => {
    if (!token || !sessionId) return;
    setLoading(true);

    await fetch(`http://localhost:8080/api/focus/stop/${sessionId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    // ✅ Optimistic UI update
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes > 0) {
      setDailyMinutes(prev => prev + minutes);
      setDailySessions(prev => prev + 1);
    }

    setSessionId(null);
    setStartTime(null);
    setElapsedSeconds(0);
    setLoading(false);

    // 🔁 Sync with backend (truth)
    refreshStats();
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60)
      .toString()
      .padStart(2, "0")}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">

        <h1 className="text-2xl font-bold mb-4">🎯 Focus Dashboard</h1>

        {/* 📊 Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-bold">{dailyMinutes} min</div>
            <div className="text-gray-500">Today</div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-bold">{dailySessions}</div>
            <div className="text-gray-500">Sessions</div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-bold">🔥 {streakDays}</div>
            <div className="text-gray-500">Streak</div>
          </div>
        </div>

        {/* ⏱ Timer */}
        <div className="text-5xl font-mono mb-6">
          {formatTime(elapsedSeconds)}
        </div>

        {/* ▶️ Controls */}
        {!sessionId ? (
          <button
            onClick={startSession}
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded"
          >
            Start Focus
          </button>
        ) : (
          <button
            onClick={stopSession}
            disabled={loading}
            className="w-full bg-red-600 text-white p-3 rounded"
          >
            Stop Focus
          </button>
        )}

        {/* 📜 History */}
        <div className="mt-6 text-left">
          <h2 className="font-semibold mb-2">📜 History</h2>

          {history.length === 0 && (
            <p className="text-gray-500 text-sm">No sessions yet</p>
          )}

          {history.map(h => (
            <div key={h.id} className="flex justify-between text-sm border-b py-1">
              <span>{new Date(h.startTime).toLocaleDateString()}</span>
              <span>{h.durationMinutes} min</span>
            </div>
          ))}
        </div>

        {/* 🎯 Goals */}
        <button
          onClick={() => router.push("/Goals")}
          className="w-full mt-6 bg-blue-600 text-white p-3 rounded"
        >
          Manage Goals 🎯
        </button>

      </div>
    </div>
  );
}