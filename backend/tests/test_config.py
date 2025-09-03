"""
設定管理モジュールのテスト
環境変数の読み込みとデフォルト値の動作を検証
"""

import os
from unittest.mock import patch

from app.core.config import QueueConfig, WorkerConfig


class TestQueueConfig:
    """QueueConfigのテストクラス"""
    
    def test_default_values(self):
        """デフォルト値のテスト"""
        with patch.dict(os.environ, {}, clear=True):
            assert QueueConfig.get_max_capacity() == 1000
            assert QueueConfig.get_dequeue_default_n() == 10
            assert QueueConfig.get_low_watermark() == 100
    
    def test_environment_variable_override(self):
        """環境変数による設定上書きのテスト"""
        env_vars = {
            "QUEUE_MAX_CAPACITY": "2000",
            "QUEUE_DEQUEUE_DEFAULT_N": "20",
            "QUEUE_LOW_WATERMARK": "200",
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            assert QueueConfig.get_max_capacity() == 2000
            assert QueueConfig.get_dequeue_default_n() == 20
            assert QueueConfig.get_low_watermark() == 200
    
    def test_invalid_environment_values(self):
        """無効な環境変数値のテスト"""
        invalid_env_vars = {
            "QUEUE_MAX_CAPACITY": "invalid",
            "QUEUE_DEQUEUE_DEFAULT_N": "not_a_number",
            "QUEUE_LOW_WATERMARK": "not_a_number",
        }
        
        with patch.dict(os.environ, invalid_env_vars, clear=True):
            # 無効値の場合はデフォルト値が返される
            assert QueueConfig.get_max_capacity() == 1000
            assert QueueConfig.get_dequeue_default_n() == 10
            assert QueueConfig.get_low_watermark() == 100
    
    def test_minimum_value_constraints(self):
        """最小値制約のテスト"""
        env_vars = {
            "QUEUE_MAX_CAPACITY": "0",
            "QUEUE_DEQUEUE_DEFAULT_N": "-10",
            "QUEUE_LOW_WATERMARK": "-5",
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            assert QueueConfig.get_max_capacity() == 1  # 最小値1
            assert QueueConfig.get_dequeue_default_n() == 1  # 最小値1（負の数は1に変換）
            assert QueueConfig.get_low_watermark() == 0  # 最小値0（負の数は0に変換）
    
    def test_get_all_settings(self):
        """全設定取得のテスト"""
        env_vars = {
            "QUEUE_MAX_CAPACITY": "500",
            "QUEUE_DEQUEUE_DEFAULT_N": "15",
            "QUEUE_LOW_WATERMARK": "50",
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            settings = QueueConfig.get_all_settings()
            
            expected = {
                "max_capacity": 500,
                "dequeue_default_n": 15,
                "low_watermark": 50,
            }
            
            assert settings == expected
    
    def test_mixed_valid_invalid_values(self):
        """一部有効・一部無効な値の混在テスト"""
        env_vars = {
            "QUEUE_MAX_CAPACITY": "1500",  # 有効
            "QUEUE_DEQUEUE_DEFAULT_N": "invalid",  # 無効
            "QUEUE_LOW_WATERMARK": "150",  # 有効
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            assert QueueConfig.get_max_capacity() == 1500  # 上書き
            assert QueueConfig.get_dequeue_default_n() == 10  # デフォルト
            assert QueueConfig.get_low_watermark() == 150  # 上書き


class TestWorkerConfig:
    """WorkerConfigクラスのテスト"""
    
    def test_worker_default_values(self):
        """デフォルト値のテスト"""
        with patch.dict(os.environ, {}, clear=True):
            assert WorkerConfig.get_itunes_terms() == ["さくら", "YOASOBI", "米津玄師", "あいみょん", "Official髭男dism"]
            assert WorkerConfig.get_country() == "JP"
            assert WorkerConfig.get_min_threshold() == 30
            assert WorkerConfig.get_batch_size() == 30
            assert WorkerConfig.get_max_cap() == 300
            assert WorkerConfig.get_poll_interval_ms() == 1500
            assert WorkerConfig.get_http_timeout_s() == 5.0
            assert WorkerConfig.get_retry_max() == 3
    
    def test_worker_environment_variable_override(self):
        """環境変数による設定上書きのテスト"""
        env_vars = {
            "OTODOKI_ITUNES_TERMS": "blues,jazz,funk",
            "OTODOKI_COUNTRY": "US",
            "OTODOKI_MIN_THRESHOLD": "50",
            "OTODOKI_BATCH_SIZE": "20",
            "OTODOKI_MAX_CAP": "500",
            "OTODOKI_POLL_INTERVAL_MS": "2000",
            "OTODOKI_HTTP_TIMEOUT_S": "10.0",
            "OTODOKI_RETRY_MAX": "5"
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            assert WorkerConfig.get_itunes_terms() == ["blues", "jazz", "funk"]
            assert WorkerConfig.get_country() == "US"
            assert WorkerConfig.get_min_threshold() == 50
            assert WorkerConfig.get_batch_size() == 20
            assert WorkerConfig.get_max_cap() == 500
            assert WorkerConfig.get_poll_interval_ms() == 2000
            assert WorkerConfig.get_http_timeout_s() == 10.0
            assert WorkerConfig.get_retry_max() == 5
    
    def test_worker_invalid_environment_values(self):
        """無効な環境変数値の処理テスト"""
        env_vars = {
            "OTODOKI_ITUNES_TERMS": "",  # 空文字
            "OTODOKI_MIN_THRESHOLD": "invalid",
            "OTODOKI_BATCH_SIZE": "-10",  # 負の値
            "OTODOKI_MAX_CAP": "not_a_number",
            "OTODOKI_POLL_INTERVAL_MS": "50",  # 最小値未満
            "OTODOKI_HTTP_TIMEOUT_S": "0.5",  # 最小値未満
            "OTODOKI_RETRY_MAX": "-1"  # 負の値
        }
        
        with patch.dict(os.environ, env_vars, clear=True):
            assert WorkerConfig.get_itunes_terms() == ["さくら", "YOASOBI", "米津玄師", "あいみょん", "Official髭男dism"]  # デフォルト
            assert WorkerConfig.get_min_threshold() == 30  # デフォルト
            assert WorkerConfig.get_batch_size() == 1  # 最小値
            assert WorkerConfig.get_max_cap() == 300  # デフォルト
            assert WorkerConfig.get_poll_interval_ms() == 100  # 最小値
            assert WorkerConfig.get_http_timeout_s() == 1.0  # 最小値
            assert WorkerConfig.get_retry_max() == 0  # 最小値
    
    def test_worker_terms_parsing(self):
        """iTunes検索キーワードのパースのテスト"""
        test_cases = [
            ("rock,pop,jazz", ["rock", "pop", "jazz"]),
            ("  rock  ,  pop  ,  jazz  ", ["rock", "pop", "jazz"]),  # 空白あり
            ("rock", ["rock"]),  # 単一キーワード
            ("rock,,pop", ["rock", "pop"]),  # 空要素
            (",,,", ["さくら", "YOASOBI", "米津玄師", "あいみょん", "Official髭男dism"]),  # 全て空
        ]
        
        for terms_str, expected in test_cases:
            with patch.dict(os.environ, {"OTODOKI_ITUNES_TERMS": terms_str}, clear=True):
                assert WorkerConfig.get_itunes_terms() == expected
    
    def test_worker_get_all_settings(self):
        """全設定値取得のテスト"""
        with patch.dict(os.environ, {}, clear=True):
            settings = WorkerConfig.get_all_settings()
            
            expected_keys = {
                "itunes_terms", "country", "min_threshold", "batch_size",
                "max_cap", "poll_interval_ms", "http_timeout_s", "retry_max",
                "search_strategy", "search_genres", "search_years"
            }
            assert set(settings.keys()) == expected_keys
            
            # デフォルト値の確認
            assert settings["itunes_terms"] == ["さくら", "YOASOBI", "米津玄師", "あいみょん", "Official髭男dism"]
            assert settings["country"] == "JP"
            assert settings["min_threshold"] == 30
