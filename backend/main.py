"""
CareChrono - FastAPI Backend Server
Patient-centred chronic care management.
Roles: strictly 'patient' and 'caregiver'.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import engine, Base, SessionLocal
from backend.models import User
from backend.seed import seed_database
from backend.routers import (
    auth_routes,
    consultations_routes,
    vitals_routes,
    medications_routes,
    records_routes,
    targets_routes,
    alerts_routes,
    caregiver_routes,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        user_count = db.query(User).count()

        if user_count == 0:
            print("[INFO] Database is empty. Auto-seeding initial demo data...")
            seed_database()
    finally:
        db.close()

    yield


app = FastAPI(
    title="CareChrono API",
    description=(
        "Patient-centred chronic disease intelligence: "
        "consultation diffs, continuous monitoring, "
        "and patient-owned targets."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

origins = os.getenv(
    "CORS_ORIGINS",
    (
        "http://localhost:5173,"
        "http://localhost:3000,"
        "http://127.0.0.1:5173,"
        "http://localhost:8000,"
        "http://127.0.0.1:8000"
    ),
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_routes.router)
app.include_router(consultations_routes.router)
app.include_router(vitals_routes.router)
app.include_router(medications_routes.router)
app.include_router(records_routes.router)
app.include_router(targets_routes.router)
app.include_router(alerts_routes.router)
app.include_router(caregiver_routes.router)

# Compatibility alias
app.include_router(
    targets_routes.router,
    prefix="/api/thresholds-compat",
    tags=["Targets Compat"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "CareChrono",
        "roles": ["patient", "caregiver"],
        "safety_disclaimer":
            "CareChrono is an assistive tool and does not provide medical diagnoses or replace clinical advice.",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )