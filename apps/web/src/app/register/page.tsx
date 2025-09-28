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

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register: registerUser,
    status,
    loading,
    error,
    clearError,
    isAuthenticated,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (password.length < 8) {
      setLocalError("パスワードは8文字以上で入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("確認用パスワードが一致しません。");
      return;
    }

    const success = await registerUser({
      email,
      password,
      display_name: displayName ? displayName : undefined,
    });

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
          <CardTitle>新規登録</CardTitle>
          <CardDescription>
            メールアドレスとパスワードを設定して、新しいアカウントを作成しましょう。
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
              <label htmlFor="displayName" className="text-sm font-medium">
                表示名（任意）
              </label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="あなたの名前"
                disabled={isBusy}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                パスワード
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8文字以上で入力"
                disabled={isBusy}
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                パスワード（確認）
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="同じパスワードを再入力"
                disabled={isBusy}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isBusy}>
              {isBusy ? "作成中..." : "アカウントを作成"}
            </Button>
          </form>
        </CardContent>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          <p>
            すでにアカウントをお持ちの場合は
            <Link className="ml-1 text-primary underline" href="/login">
              ログイン
            </Link>
            してください。
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
