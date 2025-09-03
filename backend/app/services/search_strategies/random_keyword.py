import random
from typing import Dict, Any

from .base import BaseSearchStrategy

class RandomKeywordSearchStrategy(BaseSearchStrategy):
    """
    多数のキーワードリストからランダムに一つを選び、検索パラメータを生成する戦略
    """

    # from backend/app/services/itunes_api.py
    _SEARCH_TERMS = [
        # J-POP/Rock Keywords
        "J-POP", "ロック", "バンド", "ギター", "ライブ", "フェス", "アイドル", "アニメ", "ゲーム", "映画",
        "さくら", "ひまわり", "ありがとう", "ごめんね", "大好き", "さよなら", "またね",
        "夢", "希望", "未来", "青春", "旅立ち", "応援歌", "失恋", "片想い",
        "夏", "海", "花火", "祭り", "冬", "雪", "クリスマス", "春", "秋",
        "東京", "大阪", "物語", "キセキ", "運命", "約束",
        "空", "星", "夜空", "雨", "虹", "風", "光", "闇",
        "君", "僕", "私", "あなた",
        "涙", "笑顔", "心", "声", "歌", "メロディ", "リズム",
        "ダンス", "パーティー", "クラブ",

        # English Keywords
        "Love", "Dream", "Star", "Sky", "Night", "Summer", "Winter", "Spring", "Fall",
        "Happy", "Sad", "Smile", "Tears", "Heart", "Soul", "Life", "Time",
        "Rock", "Pop", "Dance", "Electronic", "Hip-Hop", "R&B", "Jazz", "Classic",
        "Party", "Live", "Fes", "Idol", "Anime", "Game", "Movie",
        "Sun", "Moon", "Rain", "Wind", "Fire", "Water", "Earth",
        "Hello", "Goodbye", "Sorry", "Thank you",
        "You", "Me", "We",
        "Future", "Past", "Destiny", "Miracle", "Promise",
        "Story", "Journey", "Adventure",
        "City", "Tokyo", "Osaka"
    ]

    def generate_params(self) -> Dict[str, Any]:
        """
        ランダムな検索キーワードを選択してパラメータ辞書を返す
        """
        term = random.choice(self._SEARCH_TERMS)
        return {"term": term}
