"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusTime, setFocusTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, focusTime: Number(focusTime) }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Signup failed");
      }

      setSuccess(true);
      setMessage("Account created! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1800);
    } catch (error: any) {
      setMessage(error.message || "Error during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .signup-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #0a0a0a;
          color: #f0ede6;
        }

        .signup-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          position: relative;
          overflow: hidden;
        }

        .signup-left::before {
          content: '';
          position: absolute;
          bottom: -200px; right: -200px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(255,200,80,0.06) 0%, transparent 70%);
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

        .steps { display: flex; flex-direction: column; gap: 32px; margin-top: 20px; }

        .step { display: flex; gap: 20px; align-items: flex-start; }

        .step-num {
          width: 36px; height: 36px;
          border: 1px solid #2a2a2a;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #c9a84c;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .step-body {}
        .step-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .step-desc { font-size: 13px; color: #555; line-height: 1.6; }

        .headline {
          font-family: 'Syne', sans-serif;
          font-size: clamp(36px, 4vw, 60px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin-bottom: 40px;
        }
        .headline span { color: #c9a84c; }

        .signup-right {
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
          margin-bottom: 36px;
        }

        .field { margin-bottom: 18px; }

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

        .field-hint {
          margin-top: 6px;
          font-size: 11px;
          color: #444;
        }

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

        .msg {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          text-align: center;
        }

        .msg.error {
          background: rgba(220, 80, 80, 0.1);
          border: 1px solid rgba(220, 80, 80, 0.25);
          color: #e06060;
        }

        .msg.success {
          background: rgba(80, 200, 120, 0.1);
          border: 1px solid rgba(80, 200, 120, 0.25);
          color: #50c878;
        }

        .form-footer {
          margin-top: 28px;
          font-size: 13px;
          color: #555;
          text-align: center;
        }

        .form-footer a { color: #c9a84c; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }

        @media (max-width: 768px) {
          .signup-left { display: none; }
          .signup-right { width: 100%; border: none; }
        }
      `}</style>

      <div className="signup-root">
        <div className="signup-left">
          <div className="brand">FocusTracker</div>
          <h1 className="headline">
            Start your<br />
            <span>focus journey.</span>
          </h1>

          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <div className="step-title">Create your account</div>
                <div className="step-desc">Set up in under 60 seconds with just your email.</div>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <div className="step-title">Start your first session</div>
                <div className="step-desc">Hit start and let the timer run. Every minute counts.</div>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <div className="step-title">Track your progress</div>
                <div className="step-desc">See streaks, best hours, and weekly trends build over time.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="signup-right">
          <div className="form-box">
            <h2 className="form-title">Create account</h2>
            <p className="form-sub">Free forever. No credit card needed.</p>

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

              <div className="field">
                <label>Daily focus goal (minutes)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1440"
                  placeholder="120"
                  value={focusTime}
                  onChange={(e) => setFocusTime(e.target.value)}
                />
                <p className="field-hint">How many minutes do you want to focus each day?</p>
              </div>

              <button className="btn-primary" disabled={loading} type="submit">
                {loading ? "Creating account..." : "Get started →"}
              </button>

              {message && (
                <div className={`msg ${success ? "success" : "error"}`}>
                  {message}
                </div>
              )}
            </form>

            <div className="form-footer">
              Already have an account?{" "}
              <Link href="/login">Sign in →</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
