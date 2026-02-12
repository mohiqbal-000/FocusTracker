"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Goal = {
  id: number;
  title: string;
  targetMinutes: number;
  completed: boolean;
};

export default function GoalsPage() {
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [targetMinutes, setTargetMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId")
      : null;

  /* 🔒 Protect page */
  useEffect(() => {
    if (!token || !userId) router.push("/login");
  }, [token, userId, router]);

  /* 📥 Load goals */
  useEffect(() => {
    if (userId) fetchGoals();
  }, [userId]);

  const fetchGoals = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/Goals/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch goals");

      const data = await res.json();
      setGoals(data);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  /* ➕ Create goal */
  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `http://localhost:8080/api/Goals/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            targetMinutes: Number(targetMinutes),
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create goal");

      setTitle("");
      setTargetMinutes("");
      fetchGoals();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">
          🎯 Your Goals
        </h1>

        {/* Create Goal */}
        <form
          onSubmit={createGoal}
          className="bg-slate-800 p-6 rounded-xl shadow mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">
            Create New Goal
          </h2>

          <input
            type="text"
            required
            placeholder="Goal title (e.g. Study DSA)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 mb-4 rounded bg-slate-900 border border-slate-600"
          />

          <input
            type="number"
            required
            placeholder="Target minutes (e.g. 600)"
            value={targetMinutes}
            onChange={(e) => setTargetMinutes(e.target.value)}
            className="w-full p-3 mb-4 rounded bg-slate-900 border border-slate-600"
          />

          <button
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold"
          >
            {loading ? "Creating..." : "Add Goal"}
          </button>
        </form>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.length === 0 && (
            <p className="text-gray-400">No goals created yet.</p>
          )}

          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-slate-800 p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold">
                  {goal.title}
                </h3>
                <p className="text-sm text-gray-400">
                  Target: {goal.targetMinutes} minutes
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded text-sm ${
                  goal.completed
                    ? "bg-green-600"
                    : "bg-yellow-600"
                }`}
              >
                {goal.completed ? "Completed" : "In Progress"}
              </span>
            </div>
          ))}
        </div>

        {message && (
          <p className="text-center mt-6 text-red-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
