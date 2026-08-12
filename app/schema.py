from pydantic import BaseModel
from datetime import datetime

class CategoryCreate(BaseModel):
    name: str

class CategoryResponse(BaseModel):
    id: int
    name: str
    model_config = {
        "from_attributes": True
    }

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str

class ExpenseUpdate(BaseModel):
    title: str
    amount: float
    category: str
    created_at: datetime

class ExpenseResponse(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    created_at: datetime
    model_config = {
        "from_attributes": True
    }

class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    model_config = {
        "from_attributes": True
    }

class LoginRequest(BaseModel):
    username: str
    password: str