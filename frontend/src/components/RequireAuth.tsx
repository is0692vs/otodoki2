"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
  loading?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAuth({
  children,
  redirectTo,
  loading,
  fallback,
}: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status, isAuthenticated } = useAuth();

  const currentLocation = useMemo(() => {
    const basePath = pathname || "/";
    const query = searchParams?.toString();
    return query ? `${basePath}?${query}` : basePath;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (status === "unauthenticated" && !isAuthenticated) {
      const redirectParam = encodeURIComponent(currentLocation);
      const target =
        redirectTo ||
        "/login" +
          (currentLocation !== "/" ? `?redirect=${redirectParam}` : "");
      router.replace(target);
    }
  }, [status, isAuthenticated, redirectTo, currentLocation, router]);

  if (status === "checking") {
    return (
      loading ?? (
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          認証状態を確認しています...
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return (
      fallback ?? (
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          認証が必要なページです。
        </div>
      )
    );
  }

  return <>{children}</>;
}
