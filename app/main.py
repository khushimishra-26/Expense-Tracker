from fastapi import FastAPI
from app.routers import expenses, users, auth, categories
from app.database import engine
from app.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI()

# app.include_router(categories.router)
app.include_router(expenses.router)
app.include_router(users.router)
app.include_router(auth.router)