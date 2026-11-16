from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from routers import expenses, users, auth, budgets
from database import engine
from models import Base
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(users.router)
app.include_router(budgets.router)