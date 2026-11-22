from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from routers import expenses, users, auth, budgets
from database import engine
from models import Base
from fastapi.middleware.cors import CORSMiddleware

import os

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }

app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(users.router)
app.include_router(budgets.router)