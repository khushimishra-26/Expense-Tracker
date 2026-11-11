from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from backend.routers import expenses, users, auth
from backend.database import engine
from backend.models import Base
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(users.router)