import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Calculate pricing based on parameters
  return NextResponse.json({ estimates: [], params: body });
}
