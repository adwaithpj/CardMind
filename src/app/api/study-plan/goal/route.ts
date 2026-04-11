import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goal = await prisma.studyGoal.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    data: { dailyCardTarget: goal?.dailyCardTarget ?? 20 },
  });
}

const updateSchema = z.object({
  dailyCardTarget: z.number().int().min(5).max(200),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const goal = await prisma.studyGoal.upsert({
      where: { userId: session.user.id },
      update: { dailyCardTarget: parsed.data.dailyCardTarget },
      create: {
        userId: session.user.id,
        dailyCardTarget: parsed.data.dailyCardTarget,
      },
    });

    return NextResponse.json({
      data: { dailyCardTarget: goal.dailyCardTarget },
    });
  } catch (err) {
    console.error("study-plan/goal PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 },
    );
  }
}
