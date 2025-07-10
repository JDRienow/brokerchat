import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LoaderIcon } from '@/components/icons';

interface FallbackLoadingProps {
  message?: string;
  showSpinner?: boolean;
}

export function FallbackLoading({
  message = 'Loading...',
  showSpinner = true,
}: FallbackLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {showSpinner && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin">
                <LoaderIcon size={32} />
              </div>
            </div>
          )}
          <CardTitle>{message}</CardTitle>
          <CardDescription>
            Please wait while we prepare your content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple inline loader
export function InlineLoader() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin">
        <LoaderIcon size={24} />
      </div>
    </div>
  );
}

// Minimal fallback for critical failures
export function MinimalFallback({ error }: { error?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <div className="text-center">
        <p className="text-lg font-medium mb-2">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          {error || 'Please refresh the page or try again later'}
        </p>
      </div>
    </div>
  );
}
