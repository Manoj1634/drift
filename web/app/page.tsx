import DriftShell from "@/components/DriftShell";
import { loadFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function SignalFeedPage() {
  const feed = await loadFeed();
  return <DriftShell initial={feed} />;
}
