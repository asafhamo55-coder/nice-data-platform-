import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ news: [], total: 0 });
}
