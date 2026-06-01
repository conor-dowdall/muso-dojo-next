import { WifiOff } from "lucide-react";
import { DojoEntryPage } from "@/components/landing/DojoEntryPage";

export default function OfflinePage() {
  return (
    <DojoEntryPage
      actionAriaLabel="Begin. Enter the saved Dojo while offline."
      href="/dojo"
      icon={<WifiOff />}
      status="Offline Mode"
      title="Begin"
      subtitle="Enter the Saved Dojo"
    />
  );
}
