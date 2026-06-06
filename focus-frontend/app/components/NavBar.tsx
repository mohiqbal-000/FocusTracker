"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  label: string;
  path: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/Index",        icon: "⊙" },
  { label: "Goals",     path: "/Goals",         icon: "◎" },
  { label: "Stats",     path: "/Stats/trend",   icon: "∿" },
  { label: "Tags",      path: "/Tags",          icon: "◈" },
  { label: "Profile",   path: "/Profile",       icon: "◯" },
];

export default function NavBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === "/Stats/trend") return pathname.startsWith("/Stats");
    return pathname === path;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/login");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .ft-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 56px;
          background: #0a0a0a;
          border-bottom: 1px solid #181818;
          transition: border-color 0.2s, background 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .ft-nav.scrolled {
          background: rgba(10, 10, 10, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-color: #222;
        }

        /* Brand */
        .ft-nav-brand {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #c9a84c;
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
        }

        /* Center nav links */
        .ft-nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .ft-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 400;
          color: #4a4a4a;
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          text-decoration: none;
        }

        .ft-nav-item:hover {
          color: #888;
          background: #111;
        }

        .ft-nav-item.active {
          color: #f0ede6;
          background: #141414;
        }

        .ft-nav-item.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 14px;
          right: 14px;
          height: 1px;
          background: #c9a84c;
          border-radius: 1px;
        }

        .ft-nav-icon {
          font-size: 14px;
          line-height: 1;
          opacity: 0.6;
          transition: opacity 0.15s;
        }

        .ft-nav-item.active .ft-nav-icon,
        .ft-nav-item:hover .ft-nav-icon {
          opacity: 1;
        }

        /* Right side */
        .ft-nav-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .ft-nav-logout {
          background: transparent;
          border: 1px solid #1e1e1e;
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          color: #333;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.03em;
        }

        .ft-nav-logout:hover {
          border-color: #333;
          color: #666;
        }

        /* Mobile: hide center links, show hamburger */
        @media (max-width: 680px) {
          .ft-nav { padding: 0 20px; }
          .ft-nav-links { display: none; }
          .ft-mobile-links { display: flex; }
        }

        @media (min-width: 681px) {
          .ft-mobile-links { display: none; }
        }

        /* Mobile bottom nav */
        .ft-mobile-links {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 200;
          background: rgba(10,10,10,0.96);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid #1e1e1e;
          padding: 8px 0 12px;
          justify-content: space-around;
          align-items: center;
        }

        .ft-mobile-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 4px 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }

        .ft-mobile-icon {
          font-size: 18px;
          color: #333;
          transition: color 0.15s;
          line-height: 1;
        }

        .ft-mobile-item.active .ft-mobile-icon { color: #c9a84c; }

        .ft-mobile-label {
          font-size: 9px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #333;
          transition: color 0.15s;
        }

        .ft-mobile-item.active .ft-mobile-label { color: #c9a84c; }
      `}</style>

      {/* Desktop nav */}
      <nav className={`ft-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="ft-nav-brand" onClick={() => router.push("/Index")}>
          FocusTracker
        </div>

        <div className="ft-nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`ft-nav-item ${isActive(item.path) ? "active" : ""}`}
              onClick={() => router.push(item.path)}
            >
              <span className="ft-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="ft-nav-right">
          <button className="ft-nav-logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div className="ft-mobile-links">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            className={`ft-mobile-item ${isActive(item.path) ? "active" : ""}`}
            onClick={() => router.push(item.path)}
          >
            <span className="ft-mobile-icon">{item.icon}</span>
            <span className="ft-mobile-label">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
