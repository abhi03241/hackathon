import os
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db, UserORM

JWT_SECRET = os.getenv("JWT_SECRET", "ng-yoga-studio-indore-secret-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return hashlib.sha256(f"ngyoga:{password}".encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password


def create_access_token(user: UserORM) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "phone": user.phone,
        "tenant_id": user.tenant_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user_optional(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[UserORM]:
    if not creds:
        return None
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(UserORM).filter(UserORM.id == user_id).first()
    except Exception:
        return None


def require_staff_or_owner(user: Optional[UserORM] = Depends(get_current_user_optional)) -> UserORM:
    if not user or user.role not in ("staff", "owner"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Staff or Studio Owner authentication required.",
        )
    return user


def require_owner(user: Optional[UserORM] = Depends(get_current_user_optional)) -> UserORM:
    if not user or user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Elevated Studio Owner role required to access retention analytics.",
        )
    return user
