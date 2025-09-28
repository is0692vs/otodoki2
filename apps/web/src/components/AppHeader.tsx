"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header
      className={cn(
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block">otodoki2</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm lg:gap-6">
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/"
            >
              Discover
            </Link>
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/swipe"
            >
              Swipe
            </Link>
            <Link
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              href="/library"
            >
              Library
            </Link>
          </nav>
        </div>
        {/* Mobile menu would go here */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search would go here */}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user?.display_name || user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  ログアウト
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" })
                  )}
                >
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  新規登録
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
