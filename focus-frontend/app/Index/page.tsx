"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ActiveSession = {
  sessionId: number;
  startTime: number;
};

export default function Dashboard() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  /* 🔒 Protect route */
  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  /* ♻️ Restore active session on refresh */
  useEffect(() => {
    const stored = localStorage.getItem("activeSession");
    if (stored) {
      const session: ActiveSession = JSON.parse(stored);
      setSessionId(session.sessionId);
      setStartTime(session.startTime);
    }
  }, []);

  /* ⏱ Timer tick (NO drift) */
  useEffect(() => {
    if (startTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime]);

  /* ▶️ Start focus session */
  const startSession = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:8080/api/focus/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to start session");

      const data = await res.json();

      const start = Date.now();

      setSessionId(data.id);
      setStartTime(start);
      setElapsedSeconds(0);

      // 💾 persist
      localStorage.setItem(
        "activeSession",
        JSON.stringify({
          sessionId: data.id,
          startTime: start,
        })
      );

      setMessage("Focus started 🚀");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ⏹ Stop focus session */
  const stopSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `http://localhost:8080/api/focus/stop/${sessionId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to stop session");

      await res.json();

      setSessionId(null);
      setStartTime(null);
      setElapsedSeconds(0);

      // 🧹 clear persistence
      localStorage.removeItem("activeSession");

      setMessage("Focus stopped ⏹");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ⏲ Format mm:ss */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Focus Dashboard</h1>

        {/* Timer */}
        <div className="text-5xl font-mono mb-6">
          {formatTime(elapsedSeconds)}
        </div>

        {/* Buttons */}
        {!sessionId ? (
          <button
            onClick={startSession}
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700"
          >
            {loading ? "Starting..." : "Start Focus"}
          </button>
        ) : (
          <button
            onClick={stopSession}
            disabled={loading}
            className="w-full bg-red-600 text-white p-3 rounded hover:bg-red-700"
          >
            {loading ? "Stopping..." : "Stop Focus"}
          </button>
        )}

        {message && (
          <p className="text-sm text-center mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}
