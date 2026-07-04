import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-6">
            <p className="text-6xl font-bold text-muted-foreground/20">404</p>
            <div className="space-y-1">
                <h1 className="text-base font-semibold">Page not found</h1>
                <p className="text-sm text-muted-foreground">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
            </div>
            <Button asChild size="sm">
                <Link href="/dashboard">Go to dashboard</Link>
            </Button>
        </div>
    )
}