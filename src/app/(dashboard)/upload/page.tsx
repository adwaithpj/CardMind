import { UploadZone } from "@/components/upload/UploadZone";
import { UploadPageHero } from "@/components/upload/UploadPageHero";

export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <UploadPageHero>
      <UploadZone />
    </UploadPageHero>
  );
}
