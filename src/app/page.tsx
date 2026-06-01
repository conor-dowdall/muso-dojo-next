import { DoorOpen } from "lucide-react";
import { DojoEntryPage } from "@/components/landing/DojoEntryPage";

export default function LandingPage() {
  return (
    <DojoEntryPage
      actionAriaLabel="Begin. Enter the Dojo."
      href="/dojo"
      icon={<DoorOpen />}
      title="Begin"
      subtitle="Enter the Dojo"
    />
  );
}
