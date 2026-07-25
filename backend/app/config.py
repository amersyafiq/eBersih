from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_server: str
    db_name: str
    db_username: str
    db_password: str
    db_driver: str
    secret_key: str 
    algorithm: str 
    access_token_expire_minutes: int 
    redis_url: str

    class Config:
        env_file = ".env"

settings = Settings()
