import { permanentRedirect } from "next/navigation";
import { resolveCanonicalCallDetailId } from "@/lib/hackathon-sample-manifest";

/** Legacy URL — canonical detail is `/call-detail/[id]` (UUID for every call). */
export default function LegacyCallDetailRedirect({
  params,
}: {
  params: { id: string };
}) {
  const id = resolveCanonicalCallDetailId(params.id);
  permanentRedirect(`/call-detail/${id}`);
}
