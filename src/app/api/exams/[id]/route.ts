import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  examDate: z.coerce.date().optional(),
  deckId: z.string().uuid().nullable().optional(),
}).strict();

async function getOwned(id: string, userId: string) {
  return prisma.examCountdown.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const exam = await getOwned(id, session.user.id);
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const parsed = patchSchema.parse(await req.json());
    const updated = await prisma.examCountdown.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined && { title: parsed.title }),
        ...(parsed.examDate !== undefined && { examDate: parsed.examDate }),
        ...(parsed.deckId !== undefined && { deckId: parsed.deckId }),
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const exam = await getOwned(id, session.user.id);
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.examCountdown.delete({ where: { id } });
  return NextResponse.json({ data: { success: true } });
}
