const BASE_URL = "http://localhost:8080/api/Goals";

export type GoalRequest = {
  title: string;
  targetMinutes: number;
};

export type GoalResponse = {
  id: number;
  title: string;
  targetMinutes: number;
};

/* ✅ Always return Record<string, string> */
const authHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") {
    return {
      "Content-Type": "application/json",
    };
  }

  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const goalsApi = {
  getByUser: async (userId: number): Promise<GoalResponse[]> => {
    const res = await fetch(`${BASE_URL}/${userId}`, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch goals");
    }

    return res.json();
  },

  create: async (
    userId: number,
    goal: GoalRequest
  ): Promise<GoalResponse> => {
    const res = await fetch(`${BASE_URL}/${userId}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(goal),
    });

    if (!res.ok) {
      throw new Error("Failed to create goal");
    }

    return res.json();
  },
};
