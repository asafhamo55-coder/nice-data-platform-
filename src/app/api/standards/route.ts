import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ standards: [], total: 0 });
}
