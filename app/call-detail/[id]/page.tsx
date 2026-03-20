import { notFound, permanentRedirect } from "next/navigation";
import { isFailedIngest } from "@/lib/call-record-helpers";
import { getCall } from "@/lib/calls-store";
import { resolveCanonicalCallDetailId } from "@/lib/hackathon-sample-manifest";
import { resolveCallForPlaybackView } from "@/lib/resolve-call-playback-view";
import { resolvePublicAudioUrl } from "@/lib/resolve-audio-url";
import { CallDetailView } from "@/components/call-detail/call-detail-view";

export const dynamic = "force-dynamic";

export default async function CallDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const canonicalId = resolveCanonicalCallDetailId(params.id);
  if (canonicalId !== params.id) {
    permanentRedirect(`/call-detail/${canonicalId}`);
  }

  const call = await getCall(canonicalId);
  if (!call) notFound();
  if (isFailedIngest(call)) notFound();

  const resolvedUrl = resolvePublicAudioUrl(call.audioUrl);
  const callForView = await resolveCallForPlaybackView(
    call,
    resolvedUrl || call.audioUrl,
  );

  return (
    <CallDetailView
      call={callForView}
      originalAudioUrl={call.audioUrl}
    />
  );
}
