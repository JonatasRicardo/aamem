import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createSessionCookie,
  getSessionMaxAgeSeconds,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    idToken?: string;
  } | null;

  if (!body?.idToken) {
    return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  }

  try {
    const sessionCookie = await createSessionCookie(body.idToken);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: getSessionMaxAgeSeconds(),
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }
}
