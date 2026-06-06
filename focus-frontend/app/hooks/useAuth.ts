// hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthState = {
  token: string | null;
  userId: number | null;
  ready: boolean;   // true once localStorage has been read — gates all API calls
};

/**
 * useAuth — reads JWT token + userId from localStorage on mount.
 * Redirects to /login immediately if no token is found.
 *
 * Usage on any page:
 *   const { token, userId, ready } = useAuth();
 *   if (!ready) return null;   // prevents flash of unauthenticated content
 */
export function useAuth(): AuthState {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    ready: false,
  });

  useEffect(() => {
    const token  = localStorage.getItem("token");
    const rawId  = localStorage.getItem("userId");
    const userId = rawId ? Number(rawId) : null;

    if (!token) {
      router.push("/login");
      return;
    }

    setState({ token, userId, ready: true });
  }, [router]);

  return state;
}