import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Call not found</h1>
      <p className="text-center text-muted-foreground">
        That recording ID is missing from this workspace.
      </p>
      <Button asChild>
        <Link href="/">Return to dashboard</Link>
      </Button>
    </div>
  );
}
