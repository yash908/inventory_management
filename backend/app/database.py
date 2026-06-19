"""
Database connection setup using SQLAlchemy.
Session lifecycle is managed via a FastAPI dependency.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,       # Test connection health before use
    pool_size=10,             # Connection pool size
    max_overflow=20,          # Extra connections allowed beyond pool_size
    connect_args={},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
