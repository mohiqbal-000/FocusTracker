"use client";

import { useEffect, useState } from "react";
import { goalsApi, GoalResponse } from "../lib/goalsApi";

const recommendedGoals = [
  { title: "Study 2 hours", targetMinutes: 120 },
  { title: "Coding Practice", targetMinutes: 90 },
  { title: "Read Books", targetMinutes: 60 },
  { title: "Exercise", targetMinutes: 45 },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [title, setTitle] = useState("");
  const [targetMinutes, setTargetMinutes] = useState(60);

  const userId = Number(localStorage.getItem("userId"));

  useEffect(() => {
    if (!userId) return;
    goalsApi.getByUser(userId).then(setGoals);
  }, [userId]);

  const createGoal = async () => {
    const newGoal = await goalsApi.create(userId, {
      title,
      targetMinutes,
    });
    setGoals([...goals, newGoal]);
    setTitle("");
  };

  const createFromRecommendation = async (g: any) => {
    const newGoal = await goalsApi.create(userId, g);
    setGoals([...goals, newGoal]);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Goals</h1>

      {/* 🎯 Create Goal */}
      <section className="mb-8">
        <h2 className="font-semibold mb-2">Create Your Own Goal</h2>
        <input
          className="border p-2 w-full mb-2"
          placeholder="Goal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="number"
          className="border p-2 w-full mb-2"
          value={targetMinutes}
          onChange={(e) => setTargetMinutes(Number(e.target.value))}
        />
        <button
          onClick={createGoal}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Goal
        </button>
      </section>

      {/* 🌟 Recommended Goals */}
      <section className="mb-8">
        <h2 className="font-semibold mb-2">Recommended</h2>
        {recommendedGoals.map((g, i) => (
          <div key={i} className="flex justify-between border p-3 mb-2">
            <span>{g.title} ({g.targetMinutes} min)</span>
            <button
              onClick={() => createFromRecommendation(g)}
              className="text-green-600"
            >
              Add
            </button>
          </div>
        ))}
      </section>

      {/* 📋 My Goals */}
      <section>
        <h2 className="font-semibold mb-2">My Goals</h2>
        {goals.map((g) => (
          <div key={g.id} className="border p-3 mb-2">
            {g.title} — {g.targetMinutes} min
          </div>
        ))}
      </section>
    </div>
  );
}
