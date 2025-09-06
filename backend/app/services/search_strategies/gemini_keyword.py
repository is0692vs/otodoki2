import logging
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from typing import Dict, Any, List
import time
import asyncio

from .base import BaseSearchStrategy
from ...core.config import GeminiConfig
from ...models.track import Track

logger = logging.getLogger(__name__)

# --- Rate Limiting State ---
# Module-level state to track the last API call time
last_gemini_call_time: float = 0.0
# Minimum interval between calls in seconds
GEMINI_API_MIN_INTERVAL: int = 2
# ---------------------------


class GeminiKeywordSearchStrategy(BaseSearchStrategy):
    """
    Gemini APIを使用して、多様な検索キーワードを生成する戦略。
    """

    def __init__(self):
        super().__init__()
        self.config = GeminiConfig()
        # APIキーの存在チェックはgenai.configureで行う
        api_key = self.config.get_api_key()
        if not api_key:
            # logger.warning("Gemini API key is not configured. This strategy will be skipped.")
            # この戦略を無効化するか、エラーを発生させる
            raise ValueError("Gemini API key is not configured.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(self.config.get_model_name())

    async def generate_params(self) -> Dict[str, Any]:
        """
        Gemini APIを呼び出し、検索キーワードのリストを生成する。
        API呼び出しは、前回の呼び出しから最低2秒の間隔を空ける。
        """
        global last_gemini_call_time

        # Rate limiting check
        current_time = time.monotonic()
        time_since_last_call = current_time - last_gemini_call_time
        if time_since_last_call < GEMINI_API_MIN_INTERVAL:
            wait_time = GEMINI_API_MIN_INTERVAL - time_since_last_call
            logger.debug(
                f"Gemini API call rate limit: waiting for {wait_time:.2f} seconds.")
            await asyncio.sleep(wait_time)

        prompt = "多様な音楽検索のためのキーワードをカンマ区切りで10個程度生成してください。具体的なアーティスト名、曲名、ジャンル、年代などのキーワードを含めてください。例: back number,春 ,卒業,J-POP, 2010年代, ロック..."
        generation_config = self.config.get_generation_config()

        try:
            logger.info("Calling Gemini API to generate keywords...")

            # Update last call time before the API call
            last_gemini_call_time = time.monotonic()
            response = await self.model.generate_content_async(
                prompt,
                generation_config=GenerationConfig(**generation_config),
            )

            keywords_str = response.text.strip()
            if not keywords_str:
                logger.warning("Gemini API returned an empty response.")
                return {"terms": []}

            keywords = [k.strip() for k in keywords_str.replace(
                '、', ',').split(',') if k.strip()]
            logger.info(
                f"Generated {len(keywords)} keywords from Gemini API: {keywords}")

            return {"terms": keywords}

        except Exception as e:
            logger.error(f"An error occurred during Gemini API call: {e}")
            # クォータエラーの場合、例外を再送してワーカーに切り替えを促す
            if "429" in str(e).lower() or "quota" in str(e).lower():
                raise
            return {"terms": []}

    async def search(self, params: Dict[str, Any]) -> List['Track']:
        # This strategy does not perform direct track searches.
        raise NotImplementedError(
            "GeminiKeywordSearchStrategy does not perform direct track searches.")
