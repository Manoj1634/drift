import DriftShell from "@/components/DriftShell";
import { loadFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const feed = await loadFeed();
  return <DriftShell initial={feed} />;
}
