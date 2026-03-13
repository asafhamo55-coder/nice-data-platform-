import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Fetch vendors from database
  return NextResponse.json({ vendors: [], total: 0 });
}

export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Create vendor in database
  return NextResponse.json({ vendor: body }, { status: 201 });
}
