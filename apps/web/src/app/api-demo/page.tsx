'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/Container";
import { api, type Track, type HealthResponse, type QueueHealth } from '@/services';

export default function ApiDemo() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [queueHealth, setQueueHealth] = useState<QueueHealth | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleHealthCheck = async () => {
    setLoading('health');
    setError(null);
    try {
      const response = await api.health();
      if (response.error) {
        setError(`Health check failed: ${response.error.error}`);
      } else {
        setHealth(response.data || null);
      }
    } catch (err) {
      setError(`Health check error: ${err}`);
    } finally {
      setLoading(null);
    }
  };

  const handleQueueCheck = async () => {
    setLoading('queue');
    setError(null);
    try {
      const response = await api.queue.health();
      if (response.error) {
        setError(`Queue check failed: ${response.error.error}`);
      } else {
        setQueueHealth(response.data || null);
      }
    } catch (err) {
      setError(`Queue check error: ${err}`);
    } finally {
      setLoading(null);
    }
  };

  const handleGetTracks = async () => {
    setLoading('tracks');
    setError(null);
    try {
      const response = await api.tracks.suggestions({ limit: 5 });
      if (response.error) {
        setError(`Get tracks failed: ${response.error.error}`);
      } else {
        setTracks(response.data?.data || []);
      }
    } catch (err) {
      setError(`Get tracks error: ${err}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Container className="py-8">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter">
            API Client Demo
          </h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            このページではバックエンドAPIクライアントの動作をテストできます。
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Health Check</CardTitle>
              <CardDescription>
                バックエンドのヘルスステータスを確認
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleHealthCheck} 
                disabled={loading === 'health'}
                className="w-full"
              >
                {loading === 'health' ? 'チェック中...' : 'ヘルスチェック'}
              </Button>
              {health && (
                <div className="text-sm space-y-1">
                  <p><strong>Status:</strong> {health.status}</p>
                  <p><strong>Service:</strong> {health.service}</p>
                  <p><strong>Uptime:</strong> {health.uptime_seconds}s</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Queue Health</CardTitle>
              <CardDescription>
                キューの健全性ステータスを確認
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleQueueCheck} 
                disabled={loading === 'queue'}
                className="w-full"
              >
                {loading === 'queue' ? 'チェック中...' : 'キューチェック'}
              </Button>
              {queueHealth && (
                <div className="text-sm space-y-1">
                  <p><strong>Status:</strong> {queueHealth.status}</p>
                  <p><strong>Size:</strong> {queueHealth.size}/{queueHealth.capacity}</p>
                  <p><strong>Utilization:</strong> {queueHealth.utilization_percent.toFixed(1)}%</p>
                  <p><strong>Low watermark:</strong> {queueHealth.is_low_watermark ? 'Yes' : 'No'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Track Suggestions</CardTitle>
              <CardDescription>
                楽曲の提案を取得
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleGetTracks} 
                disabled={loading === 'tracks'}
                className="w-full"
              >
                {loading === 'tracks' ? '取得中...' : '楽曲を取得'}
              </Button>
              {tracks.length > 0 && (
                <div className="text-sm space-y-2">
                  <p><strong>取得した楽曲 ({tracks.length}):</strong></p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {tracks.map((track) => (
                      <div key={track.id} className="text-xs p-2 bg-gray-50 rounded">
                        <p><strong>{track.artist}</strong> - {track.title}</p>
                        {track.album && <p className="text-gray-600">Album: {track.album}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>使用方法</CardTitle>
            <CardDescription>
              APIクライアントの使用例
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto">
{`import { api } from '@/services';

// ヘルスチェック
const health = await api.health();
if (health.data) {
  console.log('Backend status:', health.data.status);
}

// 楽曲取得
const tracks = await api.tracks.suggestions({ limit: 10 });
if (tracks.data) {
  console.log('Tracks:', tracks.data.data);
}

// エラーハンドリング
if (response.error) {
  console.error('API Error:', response.error.error);
}`}
            </pre>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            注意: バックエンドサーバーが起動していない場合、エラーが表示されます。<br />
            <code>docker-compose up</code> でサーバーを起動してください。
          </p>
        </div>
      </div>
    </Container>
  );
}