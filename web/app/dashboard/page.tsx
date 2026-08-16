import DriftShell from "@/components/DriftShell";
import { loadFeed } from "@/lib/feed";
import { UFC_SLUG } from "@/lib/market";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const feed = await loadFeed();
  const ufc = feed.rows.find(
    (r) => r.slug === UFC_SLUG && r.ranks.length > 0,
  );
  return <DriftShell initial={feed} initialSlug={ufc?.slug} />;
}
