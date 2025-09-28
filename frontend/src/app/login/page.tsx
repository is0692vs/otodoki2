"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, status, loading, error, clearError, isAuthenticated } =
    useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const redirectTarget = useMemo(() => {
    return searchParams?.get("redirect") || "/swipe";
  }, [searchParams]);

  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [clearError]);

  useEffect(() => {
    if (status === "authenticated" && isAuthenticated) {
      router.replace(redirectTarget);
    }
  }, [status, isAuthenticated, router, redirectTarget]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setLocalError(null);

    if (!email || !password) {
      setLocalError("メールアドレスとパスワードを入力してください。");
      return;
    }

    const success = await login({ email, password });
    if (success) {
      router.replace(redirectTarget);
    }
  };

  const isChecking = status === "checking";
  const isBusy = loading || isChecking;
  const message = localError || error;

  return (
    <Container className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>
            登録済みのアカウントでサインインして、パーソナライズされた体験を始めましょう。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {message}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">
                メールアドレス
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={isBusy}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                パスワード
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={isBusy}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isBusy}>
              {isBusy ? "サインイン中..." : "ログイン"}
            </Button>
          </form>
        </CardContent>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          <p>
            アカウントをお持ちでない場合は
            <Link className="ml-1 text-primary underline" href="/register">
              新規登録
            </Link>
            してください。
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
