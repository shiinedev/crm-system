import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";


export function ErrorBanner({ error }: { error:Error | undefined}) {
  return (
    <div className="mx-4 mb-3 flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
      <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
      <p className="text-sm text-destructive flex-1">{error ? error.message : "Something went wrong. Check your connection and try again please."}</p>
      {/*<Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={onRetry}>
        Retry
      </Button>*/}
    </div>
  )
}
