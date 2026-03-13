import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ evaluations: [], total: 0 });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ evaluation: body }, { status: 201 });
}
