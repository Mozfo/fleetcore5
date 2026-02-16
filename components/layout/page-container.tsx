import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface PageContainerProps {
  children: ReactNode;
  pageTitle: ReactNode;
  pageDescription?: string;
  pageHeaderAction?: ReactNode;
  isLoading?: boolean;
  access?: boolean;
  accessFallback?: ReactNode;
  scrollable?: boolean;
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

export default function PageContainer({
  children,
  pageTitle,
  pageDescription,
  pageHeaderAction,
  isLoading = false,
  access = true,
  accessFallback,
  scrollable = false,
}: PageContainerProps) {
  if (!access) {
    return (
      <div className="flex flex-1 items-center justify-center">
        {accessFallback ?? (
          <p className="text-muted-foreground text-lg">
            You do not have access to this page.
          </p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  const page = (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-row items-center justify-between">
        {pageDescription ? (
          <div>
            <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground text-sm">{pageDescription}</p>
          </div>
        ) : (
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            {pageTitle}
          </h1>
        )}
        {pageHeaderAction && (
          <div className="flex items-center space-x-2">{pageHeaderAction}</div>
        )}
      </div>
      {children}
    </div>
  );

  if (scrollable) {
    return (
      <ScrollArea className="h-(--content-full-height)">{page}</ScrollArea>
    );
  }

  return page;
}
