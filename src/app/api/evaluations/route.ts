import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const evaluations = await prisma.evaluation.findMany({
    include: {
      vendor: {
        select: { id: true, name: true, slug: true, tier: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ evaluations, total: evaluations.length });
}

interface EvaluationInput {
  title: string;
  vendorId: string;
  categoryId: string;
  status?: string;
  dimensions: { key: string; name: string; score: number; weight: number }[];
  notes?: string;
  recommendation?: string;
}

export async function POST(request: Request) {
  try {
    const body: EvaluationInput = await request.json();

    if (!body.title || !body.vendorId || !body.dimensions || body.dimensions.length === 0) {
      return NextResponse.json(
        { error: "title, vendorId, and dimensions are required" },
        { status: 400 }
      );
    }

    // Calculate overall score: weighted average of dimension scores
    const totalWeight = body.dimensions.reduce((sum, d) => sum + d.weight, 0);
    const weightedSum = body.dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);
    const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    // Store criteria as dimension definitions, results as score map
    const criteria = body.dimensions.map((d) => ({
      key: d.key,
      name: d.name,
      weight: d.weight,
    }));

    const results: Record<string, unknown> = {
      scores: Object.fromEntries(body.dimensions.map((d) => [d.key, d.score])),
      notes: body.notes ?? "",
      recommendation: body.recommendation ?? "",
      categoryId: body.categoryId,
      evaluatedAt: new Date().toISOString(),
    };

    const evaluation = await prisma.evaluation.create({
      data: {
        title: body.title,
        vendorId: body.vendorId,
        status: body.status ?? "completed",
        criteria: JSON.parse(JSON.stringify(criteria)),
        results: JSON.parse(JSON.stringify(results)),
        summary: body.recommendation ?? body.notes ?? null,
        score: overallScore,
      },
      include: {
        vendor: { select: { id: true, name: true, slug: true } },
      },
    });

    // Trigger ranking recalculation in the background
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      fetch(`${baseUrl}/api/rankings/recalculate`, { method: "POST" }).catch(() => {});
    } catch {
      // non-blocking
    }

    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create evaluation:", error);
    return NextResponse.json(
      { error: "Failed to create evaluation" },
      { status: 500 }
    );
  }
}
