#!/usr/bin/env python3
"""
iTunes API パラメータ最適化テストスクリプト
ドキュメントに基づいて最適なパラメータ組み合わせを探す
"""

import asyncio
import httpx
import logging

# ログ設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

async def test_itunes_params():
    """iTunes API パラメータのテスト"""
    base_url = "https://itunes.apple.com/search"
    test_term = "さくら"
    
    # テストするパラメータセット
    test_cases = [
        {
            "name": "現在の設定",
            "params": {
                "term": test_term,
                "media": "music",
                "country": "jp"
            }
        },
        {
            "name": "entity=song追加",
            "params": {
                "term": test_term,
                "media": "music", 
                "entity": "song",
                "country": "jp"
            }
        },
        {
            "name": "entity=musicTrack追加",
            "params": {
                "term": test_term,
                "media": "music",
                "entity": "musicTrack", 
                "country": "jp"
            }
        },
        {
            "name": "limit=50追加",
            "params": {
                "term": test_term,
                "media": "music",
                "limit": 50,
                "country": "jp"
            }
        },
        {
            "name": "lang=ja_jp追加",
            "params": {
                "term": test_term,
                "media": "music",
                "lang": "ja_jp",
                "country": "jp"
            }
        },
        {
            "name": "explicit=No追加",
            "params": {
                "term": test_term,
                "media": "music",
                "explicit": "No",
                "country": "jp"
            }
        },
        {
            "name": "最適化組み合わせ1",
            "params": {
                "term": test_term,
                "media": "music",
                "entity": "musicTrack",
                "limit": 200,
                "lang": "ja_jp",
                "explicit": "No",
                "country": "jp"
            }
        },
        {
            "name": "最適化組み合わせ2",
            "params": {
                "term": test_term,
                "media": "music",
                "limit": 200,
                "lang": "ja_jp",
                "country": "jp"
            }
        }
    ]
    
    timeout = httpx.Timeout(connect=2.0, read=5.0, write=5.0, pool=5.0)
    
    async with httpx.AsyncClient(timeout=timeout) as client:
        for test_case in test_cases:
            try:
                print(f"\n=== {test_case['name']} ===")
                print(f"Parameters: {test_case['params']}")
                
                response = await client.get(base_url, params=test_case['params'])
                
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    print(f"✅ SUCCESS: HTTP 200, {len(results)} results")
                    
                    if results:
                        # 結果の詳細分析
                        tracks_with_preview = sum(1 for r in results if r.get("previewUrl"))
                        tracks_with_artwork = sum(1 for r in results if r.get("artworkUrl100"))
                        unique_artists = len(set(r.get("artistName") for r in results if r.get("artistName")))
                        
                        print(f"   - プレビュー付き: {tracks_with_preview}/{len(results)}")
                        print(f"   - アートワーク付き: {tracks_with_artwork}/{len(results)}")
                        print(f"   - ユニークアーティスト数: {unique_artists}")
                        
                        # サンプル楽曲表示
                        sample = results[:3]
                        for i, track in enumerate(sample):
                            title = track.get("trackName", "Unknown")
                            artist = track.get("artistName", "Unknown")
                            print(f"   [{i+1}] {title} - {artist}")
                else:
                    print(f"❌ FAILED: HTTP {response.status_code}")
                    if response.status_code == 404:
                        print("   - 404エラー: パラメータが無効の可能性")
                    elif response.status_code == 400:
                        print("   - 400エラー: パラメータ形式が不正の可能性")
                    else:
                        print(f"   - レスポンス: {response.text[:200]}")
                
            except httpx.TimeoutException:
                print(f"❌ TIMEOUT: {test_case['name']}")
            except Exception as e:
                print(f"❌ ERROR: {test_case['name']} - {e}")
            
            # 各テスト間に少し待機（API制限対策）
            await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(test_itunes_params())