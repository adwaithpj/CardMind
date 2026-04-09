import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HomePage } from "@/components/dashboard/HomePage";

export const dynamic = "force-dynamic";

export default async function Page() {
  return (
    <DashboardLayout>
      <HomePage />
    </DashboardLayout>
  );
}
