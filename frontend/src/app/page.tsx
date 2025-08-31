import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/Container";

export default function Home() {
  return (
    <Container className="py-8">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter">
            otodoki2へようこそ
          </h1>
          <p className="text-xl text-muted-foreground max-w-[600px]">
            音楽を発見し、あなたのライブラリを管理するためのアプリケーションです。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl w-full">
          <Card>
            <CardHeader>
              <CardTitle>音楽を発見</CardTitle>
              <CardDescription>
                新しいアーティストやアルバムを見つけて、あなたの音楽体験を広げましょう。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">発見を始める</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ライブラリ管理</CardTitle>
              <CardDescription>
                お気に入りの音楽を整理し、プレイリストを作成して管理しましょう。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                ライブラリを見る
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button size="lg">今すぐ始める</Button>
          <Button variant="secondary" size="lg">
            詳しく見る
          </Button>
        </div>
      </div>
    </Container>
  );
}
