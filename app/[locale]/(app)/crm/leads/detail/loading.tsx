import { Loader2 } from "lucide-react";

export default function LeadDetailLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="text-muted-foreground size-8 animate-spin" />
    </div>
  );
}
