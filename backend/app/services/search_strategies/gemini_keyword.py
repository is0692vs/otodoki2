import logging
import google.generativeai as genai
from typing import Dict, Any


from .base import BaseSearchStrategy

logger = logging.getLogger(__name__)


class GeminiKeywordSearchStrategy(BaseSearchStrategy):
    """
    Gemini APIを使用して音楽検索キーワードを生成する戦略
    """

    async def generate_params(self) -> Dict[str, Any]:
        """
        Gemini APIを使用して検索キーワードを生成し、パラメータ辞書を返す
        """
        # APIキーは環境変数から自動的に取得される
        model = genai.GenerativeModel('gemini-1.5-flash-latest')

        # 日本語のプロンプト
        prompt = "音楽検索のためのキーワード(アーティスト名やジャンルなど)を3〜5個提案してください。カンマ区切りで出力し、例: サカナクション,back number,ロック,夏,夢 のようにしてください。"

        logger.info(f"Gemini APIへのプロンプト: {prompt}")
        response = await model.generate_content_async(prompt)
        raw_keywords = response.text.strip()
        # Handle both English and Japanese commas
        keywords = [k.strip() for k in raw_keywords.replace(
            '、', ',').split(',') if k.strip()]

        logger.info(f"Gemini APIからのレスポンス (生成されたキーワード): {raw_keywords}")
        logger.info(f"パースされたキーワードリスト: {keywords}")

        # 複数キーワードに対応するため、リストとして返す
        # worker側でキーワードキューから一つずつ取り出すことを想定
        return {"terms": keywords}
