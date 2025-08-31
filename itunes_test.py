import httpx
import asyncio

async def test_itunes_api():
    """
    指定されたURLでiTunes Search APIをテストする
    """
    url = "https://itunes.apple.com/search"
    params = {
        "term": "さくら",
        "media": "music",
        "country": "jp"
    }
    
    print(f"Requesting URL: {url} with params: {params}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Success! Found {data.get('resultCount', 0)} results.")
                # 最初の3件を表示
                for i, track in enumerate(data.get('results', [])[:3]):
                    print(f"  - Track {i+1}: {track.get('trackName')} by {track.get('artistName')}")
            else:
                print("Request failed.")
                print("Response content:")
                print(response.text)

    except httpx.RequestError as e:
        print(f"An error occurred while requesting {e.request.url!r}.")
        print(e)

if __name__ == "__main__":
    asyncio.run(test_itunes_api())