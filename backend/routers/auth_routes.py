"""
CareChrono - Auth Routes
User registration, login, token refresh, and instant demo role switcher.
Roles strictly limited to: patient | caregiver.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, UserOut, Token
from ..auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if user_in.role not in ["patient", "caregiver"]:
        raise HTTPException(status_code=400, detail="Role must be either 'patient' or 'caregiver'")

    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone,
        conditions=user_in.conditions,
        avatar_url=user_in.avatar_url or "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        is_senior_mode=user_in.is_senior_mode
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.email, "role": new_user.role, "user_id": new_user.id})
    return {"access_token": token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=Token)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/demo-switch/{role}", response_model=Token)
def switch_demo_role(role: str, db: Session = Depends(get_db)):
    """
    Convenience endpoint for hackathon demo: Switch directly between
    seeded demo users (strictly 'patient' or 'caregiver').
    """
    if role not in ["patient", "caregiver"]:
        raise HTTPException(status_code=400, detail="CareChrono is patient-centred. Only 'patient' and 'caregiver' roles exist.")

    user = db.query(User).filter(User.role == role).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No seeded demo user found for role '{role}'")

    token = create_access_token({"sub": user.email, "role": user.role, "user_id": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/toggle-senior-mode", response_model=UserOut)
def toggle_senior_mode(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Toggles senior mode on/off for the logged-in user."""
    current_user.is_senior_mode = not current_user.is_senior_mode
    db.commit()
    db.refresh(current_user)
    return current_user
