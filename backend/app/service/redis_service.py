from datetime import timedelta
from ..config.redis_db import redis

REFRESH_TOKEN_PREFIX = "refresh_token"


def store_refresh_token(user_id: str, jti: str, expire_minutes: int):
    key = f"{REFRESH_TOKEN_PREFIX}:{user_id}:{jti}"
    redis.setex(key, timedelta(minutes=expire_minutes), "valid")


def is_refresh_token_valid(user_id: str, jti: str) -> bool:
    key = f"{REFRESH_TOKEN_PREFIX}:{user_id}:{jti}"
    return redis.exists(key) == 1


def revoke_refresh_token(user_id: str, jti: str):
    key = f"{REFRESH_TOKEN_PREFIX}:{user_id}:{jti}"
    redis.delete(key)


def revoke_all_refresh_tokens(user_id: str):
    pattern = f"{REFRESH_TOKEN_PREFIX}:{user_id}:*"
    keys = redis.keys(pattern)
    if keys:
        redis.delete(*keys)