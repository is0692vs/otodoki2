import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_health():
    response = client.get("/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200 and response.json() == {"status": "ok"}

def test_root():
    response = client.get("/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

if __name__ == "__main__":
    print("Testing FastAPI endpoints...")
    
    print("\n1. Testing /health endpoint:")
    health_ok = test_health()
    
    print("\n2. Testing / endpoint:")
    root_ok = test_root()
    
    print(f"\n結果:")
    print(f"  /health: {'✓' if health_ok else '✗'}")
    print(f"  /: {'✓' if root_ok else '✗'}")
    
    if health_ok and root_ok:
        print("\n🎉 すべてのテストが成功しました！")
    else:
        print("\n❌ 一部のテストが失敗しました")