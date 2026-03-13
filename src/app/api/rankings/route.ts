import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ rankings: [], total: 0 });
}
