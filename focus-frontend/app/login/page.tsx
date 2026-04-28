"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id.toString());
      router.push("/Index");
    } catch (error: any) {
      setMessage(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #0a0a0a;
          color: #f0ede6;
        }

        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          position: relative;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: -200px; left: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(255,200,80,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .brand {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c9a84c;
          margin-bottom: 64px;
        }

        .headline {
          font-family: 'Syne', sans-serif;
          font-size: clamp(42px, 5vw, 72px);
          font-weight: 800;
          line-height: 1.0;
          letter-spacing: -0.03em;
          margin-bottom: 24px;
        }

        .headline span {
          color: #c9a84c;
        }

        .subtext {
          font-size: 16px;
          color: #888;
          line-height: 1.7;
          max-width: 360px;
        }

        .stat-row {
          display: flex;
          gap: 40px;
          margin-top: 56px;
        }

        .stat { display: flex; flex-direction: column; gap: 4px; }
        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #f0ede6;
        }
        .stat-label { font-size: 12px; color: #555; letter-spacing: 0.05em; }

        .login-right {
          width: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
          border-left: 1px solid #1e1e1e;
        }

        .form-box { width: 100%; }

        .form-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .form-sub {
          font-size: 14px;
          color: #666;
          margin-bottom: 40px;
        }

        .field { margin-bottom: 20px; }

        .field label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 8px;
        }

        .field input {
          width: 100%;
          background: #111;
          border: 1px solid #222;
          border-radius: 8px;
          padding: 14px 16px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          color: #f0ede6;
          outline: none;
          transition: border-color 0.2s;
        }

        .field input:focus { border-color: #c9a84c; }
        .field input::placeholder { color: #3a3a3a; }

        .btn-primary {
          width: 100%;
          background: #c9a84c;
          color: #0a0a0a;
          border: none;
          border-radius: 8px;
          padding: 15px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.05em;
          cursor: pointer;
          margin-top: 8px;
          transition: opacity 0.2s, transform 0.1s;
        }

        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:active { transform: scale(0.99); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .error-msg {
          margin-top: 16px;
          padding: 12px 14px;
          background: rgba(220, 80, 80, 0.1);
          border: 1px solid rgba(220, 80, 80, 0.25);
          border-radius: 8px;
          font-size: 13px;
          color: #e06060;
          text-align: center;
        }

        .form-footer {
          margin-top: 32px;
          font-size: 13px;
          color: #555;
          text-align: center;
        }

        .form-footer a { color: #c9a84c; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0;
        }
        .divider-line { flex: 1; height: 1px; background: #1e1e1e; }
        .divider-text { font-size: 11px; color: #444; }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { width: 100%; border: none; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-left">
          <div className="brand">FocusTracker</div>
          <h1 className="headline">
            Deep work,<br />
            <span>tracked.</span>
          </h1>
          <p className="subtext">
            Build streaks, hit goals, and understand your most productive hours.
          </p>
          <div className="stat-row">
            <div className="stat">
              <span className="stat-num">92%</span>
              <span className="stat-label">streak retention</span>
            </div>
            <div className="stat">
              <span className="stat-num">2.4×</span>
              <span className="stat-label">productivity boost</span>
            </div>
            <div className="stat">
              <span className="stat-num">47min</span>
              <span className="stat-label">avg session</span>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="form-box">
            <h2 className="form-title">Welcome back</h2>
            <p className="form-sub">Sign in to continue your focus journey</p>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button className="btn-primary" disabled={loading} type="submit">
                {loading ? "Signing in..." : "Sign in →"}
              </button>

              {message && <div className="error-msg">{message}</div>}
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">NEW HERE?</span>
              <div className="divider-line" />
            </div>

            <div className="form-footer">
              <Link href="/signup">Create a free account →</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
