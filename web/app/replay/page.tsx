import Replay from "@/components/Replay";
import { getReplayTimeline } from "@/lib/truth";

export default async function ReplayPage() {
  const { steps } = await getReplayTimeline();
  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <Replay steps={steps} />
    </main>
  );
}
