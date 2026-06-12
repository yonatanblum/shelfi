import { UploadDropzone } from "@/components/upload/dropzone";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function UploadPage() {
  return (
    <DashboardShell
      title="Shelf Upload"
      description="Drop shelf photos here for AI-powered retail shelf audit extraction."
    >
      <UploadDropzone />
    </DashboardShell>
  );
}
