"""
設定管理モジュールのテスト
環境変数の読み込みとデフォルト値の動作を検証
"""

import os
from unittest.mock import patch

from app.core.config import QueueConfig


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
