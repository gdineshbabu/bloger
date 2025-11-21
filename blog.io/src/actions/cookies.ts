"use server";

import { cookies } from "next/headers";

export async function createSession(idToken: string) {
  const cookieStore = await cookies();
  cookieStore.set("blogToken", idToken);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set("blogToken", "", {
    maxAge: 0,
    path: "/",
  });
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("blogToken")?.value || null;
}
