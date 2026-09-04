from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus
from .config import settings

# mssql+pyodbc://username:password@host:port/database?driver=ODBC+Driver+17+for+SQL+Server"
SQLALCHEMY_DATABASE_URL = f'mssql+pyodbc://{settings.db_username}:{settings.db_password}@{settings.db_server}/{settings.db_name}?driver={quote_plus(settings.db_driver)}&Encrypt=yes&TrustServerCertificate=yes'
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db(): #ORM
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()