import { NextResponse } from "next/server";
import { listCalls } from "@/lib/calls-store";

export const runtime = "nodejs";

export async function GET() {
  const calls = await listCalls();
  return NextResponse.json({ calls });
}
