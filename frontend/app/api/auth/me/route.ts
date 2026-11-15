import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not signed in.", data: null },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, message: "OK", data: session });
}
