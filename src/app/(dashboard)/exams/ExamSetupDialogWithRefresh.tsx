"use client";

import { useRouter } from "next/navigation";
import { ExamSetupDialog } from "@/components/exam/ExamSetupDialog";

type Props = {
  decks: { id: string; title: string; emoji: string | null }[];
};

export function ExamSetupDialogWithRefresh({ decks }: Props) {
  const router = useRouter();

  return (
    <ExamSetupDialog
      decks={decks}
      onCreated={() => router.refresh()}
    />
  );
}
