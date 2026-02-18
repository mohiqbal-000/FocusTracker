"use client";

import { useEffect, useState } from "react";

type GoalResponse = {
  id: number;
  goalType: string;
  targetValue: number;
  progressValue: number;
  achieved: boolean;
};

const BACKEND_URL = "http://localhost:8080/api/Goals";

// Recommended goals (UI only)
const recommendedGoals = [
  { goalType: "Study", targetValue: 120 },
  { goalType: "Coding Practice", targetValue: 90 },
  { goalType: "Exercise", targetValue: 45 },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [goalType, setGoalType] = useState("");
  const [targetValue, setTargetValue] = useState(60);

  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // ✅ Load auth data once (IMPORTANT)
  useEffect(() => {
    const id = localStorage.getItem("userId");
    const t = localStorage.getItem("token");

    if (id && t) {
      setUserId(Number(id));
      setToken(t);
    }
  }, []);
  useEffect(() => {
  console.log("userId:", userId);
  console.log("token:", token);
}, [userId, token]);


  // 🔹 Fetch goals (WITH JWT)
  useEffect(() => {
    if (!userId || !token) return;

    fetch(`${BACKEND_URL}/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch goals");
        }
        return res.json();
      })
      .then(setGoals)
      .catch(console.error);
  }, [userId, token]);

  // 🔹 Create goal
  const createGoal = async (goal: {
    goalType: string;
    targetValue: number;
  }) => {
    if (!userId || !token) {
      alert("Not authenticated");
      return;
    }

    const res = await fetch(`${BACKEND_URL}/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        goalType: goal.goalType,
        targetValue: goal.targetValue,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .slice(0, 10),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Create goal failed:", text);
      alert("Failed to create goal");
      return;
    }

    const newGoal = await res.json();
    setGoals((prev) => [...prev, newGoal]);

    // clear inputs
    setGoalType("");
    setTargetValue(60);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🎯 Goals</h1>

      {/* Create Goal */}
      <section className="mb-8">
        <h2 className="font-semibold mb-2">Create Goal</h2>

        <input
          className="border p-2 w-full mb-2"
          placeholder="Goal type (Study, Coding...)"
          value={goalType}
          onChange={(e) => setGoalType(e.target.value)}
        />

        <input
          type="number"
          className="border p-2 w-full mb-2"
          value={targetValue}
          onChange={(e) => setTargetValue(Number(e.target.value))}
        />

        <button
          onClick={() => createGoal({ goalType, targetValue })}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Goal
        </button>
      </section>

      {/* Recommended */}
      <section className="mb-8">
        <h2 className="font-semibold mb-2">🌟 Recommended</h2>

        {recommendedGoals.map((g, i) => (
          <div key={i} className="flex justify-between border p-3 mb-2">
            <span>
              {g.goalType} – {g.targetValue} min
            </span>
            <button
              onClick={() => createGoal(g)}
              className="text-green-600"
            >
              Add
            </button>
          </div>
        ))}
      </section>

      {/* My Goals */}
      <section>
        <h2 className="font-semibold mb-2">📋 My Goals</h2>

        {goals.length === 0 && (
          <p className="text-gray-500">No goals yet</p>
        )}

        {goals.map((g) => (
          <div key={g.id} className="border p-3 mb-2">
            <div className="font-medium">{g.goalType}</div>
            <div>
              {g.progressValue}/{g.targetValue} min
            </div>
            {g.achieved && (
              <span className="text-green-600">✔ Achieved</span>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
