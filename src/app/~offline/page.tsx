import Link from "next/link";

export default function OfflinePage() {
  return (
    <main>
      <h1>Muso Dojo is offline</h1>
      <p>Your cached music tools are still available.</p>
      <Link href="/dojo">Open the Dojo</Link>
    </main>
  );
}
