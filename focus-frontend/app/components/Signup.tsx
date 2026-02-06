"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusTime, setFocusTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          focusTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Signup failed");
      }

      setMessage("Signup successful 🎉");
      setEmail("");
      setPassword("");
      setFocusTime("");
    } catch (error) {
      setMessage("Error during signup ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          FocusTracker Signup
        </h2>

        <label className="block mb-2 text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <label className="block mb-2 text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <label className="block mb-2 text-sm font-medium">
          Daily Focus Time (minutes)
        </label>
        <input
          type="number"
          value={focusTime}
          onChange={(e) => setFocusTime(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        {message && (
          <p className="text-center text-sm mt-4">{message}</p>
        )}
  <p className="text-sm text-center mt-4">
         Already has an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
              </form>
    </div>
  );
}
