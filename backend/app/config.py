from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GROQ_API_KEY: str
    SECRET_KEY: str
    GMAIL_ADDRESS: str
    GMAIL_APP_PASSWORD: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite+aiosqlite:///./researchhub.db"
    SEMANTIC_SCHOLAR_API_KEY: str | None = None
    ENVIRONMENT: str = "development"
    model_config = SettingsConfigDict(env_file=[".env", "../.env"], extra="ignore")
settings = Settings()
